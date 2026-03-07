/**
 * In-memory LRU cache with TTL support.
 * Drop-in replaceable with Redis later — just swap the implementation.
 *
 * Usage:
 *   const cache = new MemoryCache({ maxSize: 500, defaultTTL: 300 });
 *   cache.set("key", value);
 *   const hit = cache.get<MyType>("key");
 */

interface CacheEntry<T = unknown> {
  value: T;
  expiresAt: number;
}

interface CacheOptions {
  /** Max number of entries (oldest evicted first) */
  maxSize?: number;
  /** Default TTL in seconds */
  defaultTTL?: number;
}

export class MemoryCache {
  private store = new Map<string, CacheEntry>();
  private maxSize: number;
  private defaultTTL: number;

  constructor(opts: CacheOptions = {}) {
    this.maxSize = opts.maxSize ?? 1000;
    this.defaultTTL = opts.defaultTTL ?? 300; // 5 min
  }

  get<T = unknown>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    // Move to end (most recently used)
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value as T;
  }

  set<T = unknown>(key: string, value: T, ttlSeconds?: number): void {
    // Evict oldest if at capacity
    if (this.store.size >= this.maxSize) {
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) this.store.delete(oldest);
    }
    this.store.set(key, {
      value,
      expiresAt: Date.now() + (ttlSeconds ?? this.defaultTTL) * 1000,
    });
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }
}

/** Shared app-wide cache instance */
export const appCache = new MemoryCache({ maxSize: 1000, defaultTTL: 300 });

// Optional Redis-backed helpers (if Redis is configured and available)
import { redis } from "../plugins/redis.js";

export async function getCachedData<T = unknown>(key: string): Promise<T | null> {
  try {
    if (redis) {
      const raw = await redis.get(key);
      if (raw) {
        try {
          return JSON.parse(raw) as T;
        } catch (e) {
          // If parsing fails, return null and allow fallback
          return null;
        }
      }
    }
  } catch (e) {
    // Redis failed — fall back to in-memory cache
    // eslint-disable-next-line no-console
    console.warn("Redis GET error:", e);
  }

  // Fallback: in-memory cache
  return appCache.get<T>(key);
}

export async function setCachedData(key: string, value: any, ttlSeconds: number): Promise<void> {
  try {
    if (redis) {
      try {
        await redis.set(key, JSON.stringify(value), "EX", Math.max(1, Math.floor(ttlSeconds)));
        return;
      } catch (e) {
        console.warn("Redis SET error:", e);
      }
    }
  } catch (e) {
    console.warn("Redis error:", e);
  }

  // Fallback to in-memory cache
  appCache.set(key, value, ttlSeconds);
}

export async function delCachedData(key: string): Promise<void> {
  try {
    if (redis) {
      await redis.del(key);
      return;
    }
  } catch (e) {
    console.warn("Redis DEL error:", e);
  }
  appCache.delete(key);
}

