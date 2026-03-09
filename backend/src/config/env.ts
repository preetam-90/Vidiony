/**
 * Zod-validated environment configuration.
 * Import `env` anywhere — throws on startup if required vars are missing.
 */

import { z } from "zod";

const envSchema = z.object({
  // Server
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_URL: z.string().url().default("http://localhost:4000"),
  FRONTEND_URL: z.string().default("http://localhost:3000"),

  // Database
  DATABASE_URL: z.string().default("postgresql://vidion:vidion_secret@localhost:5432/vidion"),

  // Redis
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  // Upstash REST (optional; not used by ioredis/BullMQ directly)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // JWT
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 chars").default("vidion-dev-secret-key-change-in-prod"),
  JWT_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),

  // Encryption key for OAuth tokens (32 bytes / 64 hex chars)
  ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-fA-F]{64}$/, "ENCRYPTION_KEY must be 64 hex characters")
    .optional(),

  // Google OAuth2 (login + YouTube in one flow)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  // Callback URL registered in Google Cloud Console for the login flow
  GOOGLE_REDIRECT_URI: z.string().optional(),

  // Legacy aliases kept for backwards compatibility
  YOUTUBE_CLIENT_ID: z.string().optional(),
  YOUTUBE_CLIENT_SECRET: z.string().optional(),
  YOUTUBE_REDIRECT_URI: z.string().optional(),

  // YouTube session cookie (optional)
  YT_COOKIE: z.string().optional(),

  // yt-dlp
  YTDLP_PATH: z.string().default("yt-dlp"),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),

  // Features
  ENABLE_DOWNLOADS: z
    .string()
    .transform((v) => v === "true" || v === "1")
    .default("true"),
  MAX_DOWNLOAD_QUALITY: z.string().default("2160p"),
  TRENDING_REFRESH_CRON: z.string().default("0 */6 * * *"),
});

function parseEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("❌  Invalid environment variables:");
    console.error(result.error.flatten().fieldErrors);
    process.exit(1);
  }
  return result.data;
}

export const env = parseEnv();
export type Env = typeof env;
