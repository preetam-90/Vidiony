/**
 * Redis plugin — replaces the old standalone export with a proper Fastify
 * plugin that decorates the instance AND exports the raw client for use
 * outside the Fastify context (BullMQ, cache service, etc.).
 *
 * Startup behaviour:
 *  - Uses lazyConnect:true so we can attach an error handler BEFORE the
 *    first connection attempt, eliminating the "[ioredis] Unhandled error
 *    event" spam that fires when lazyConnect:false triggers errors before
 *    any listener is registered.
 *  - On failure: immediately calls client.disconnect() to halt all
 *    reconnection loops, then falls back to in-memory cache.
 */

import fp from "fastify-plugin";
import Redis from "ioredis";
import type { FastifyPluginAsync } from "fastify";
import { env } from "../config/env.js";

// Singleton for services outside Fastify context (cache.service, BullMQ)
let _redis: Redis | null = null;

export function getRedis(): Redis | null {
  return _redis;
}

/** Build a client config. Always lazyConnect so caller controls connect timing. */
function buildClient(): Redis {
  const base = {
    lazyConnect: true,          // CRITICAL: don't connect until we call .connect()
    maxRetriesPerRequest: 0,    // fail fast — we handle retry at application level
    enableOfflineQueue: false,  // don't queue commands while disconnected
    connectTimeout: 3000,
  } as const;

  if (env.REDIS_URL) {
    return new Redis(env.REDIS_URL, base);
  }

  return new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD || undefined,
    ...base,
  });
}

/** Create a connected Redis client, or return null if Redis is unreachable. */
export async function createRedisClient(): Promise<Redis | null> {
  const client = buildClient();

  // Attach a no-op error handler BEFORE connect() so Node never sees an
  // "unhandled error event".  We replace it with a real handler on success.
  client.on("error", () => {});

  try {
    await client.connect();
    await client.ping();

    // Connection confirmed — swap in the real error handler
    client.removeAllListeners("error");
    client.on("error", (err: Error) => {
      if ((err as NodeJS.ErrnoException).code !== "ECONNREFUSED") {
        console.error("[Redis] error:", err.message);
      }
    });
    client.on("reconnecting", () => console.warn("[Redis] reconnecting…"));

    return client;
  } catch {
    // Stop all reconnect loops before returning null
    client.disconnect();
    return null;
  }
}

// ─── Fastify plugin ───────────────────────────────────────────────────────────

const redisPlugin: FastifyPluginAsync = fp(async (fastify) => {
  const client = await createRedisClient();

  if (client) {
    _redis = client;
    fastify.decorate("redis", client);
    fastify.log.info("Redis connected");

    fastify.addHook("onClose", async () => {
      await client.quit();
      _redis = null;
      fastify.log.info("Redis disconnected");
    });
  } else {
    fastify.log.warn("Redis unavailable — caching degraded to in-memory");
    fastify.decorate("redis", null);
  }
}, {
  name: "redis-plugin",
});

export default redisPlugin;
export { _redis as redis }; // backward-compat for cache.service.ts
