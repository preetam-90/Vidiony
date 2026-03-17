/**
 * BullMQ queue definitions.
 * Import queues to add jobs; import workers to process them.
 */

import { Queue } from "bullmq";
import { env } from "../config/env.js";

// BullMQ requires a plain connection config (avoids ioredis version conflicts)
function getBullMQConnection() {
  if (env.REDIS_URL) {
    // Parse Redis URL
    try {
      const url = new URL(env.REDIS_URL);
      return {
        host: url.hostname,
        port: parseInt(url.port) || 6379,
        password: url.password || undefined,
      };
    } catch {
      // fallback
    }
  }
  return {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD || undefined,
  };
}

export const connection = getBullMQConnection();

// ─── Queue names ──────────────────────────────────────────────────────────────
export const QUEUE_TRENDING_REFRESH  = "trending-refresh";
export const QUEUE_TOKEN_REFRESH     = "token-refresh";
export const QUEUE_CLEANUP           = "cleanup";
export const QUEUE_RECOMMENDATIONS   = "recommendations-precompute";

// ─── Queue instances ──────────────────────────────────────────────────────────
export const trendingRefreshQueue = new Queue(QUEUE_TRENDING_REFRESH, {
  connection,
  defaultJobOptions: {
    removeOnComplete: 5,
    removeOnFail: 20,
    attempts: 3,
    backoff: { type: "exponential", delay: 30_000 },
  },
});

export const tokenRefreshQueue = new Queue(QUEUE_TOKEN_REFRESH, {
  connection,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 10,
    attempts: 2,
    backoff: { type: "fixed", delay: 60_000 },
  },
});

export const cleanupQueue = new Queue(QUEUE_CLEANUP, {
  connection,
  defaultJobOptions: {
    removeOnComplete: 3,
    removeOnFail: 5,
  },
});

export const recommendationsQueue = new Queue(QUEUE_RECOMMENDATIONS, {
  connection,
  defaultJobOptions: {
    removeOnComplete: 5,
    removeOnFail: 10,
    attempts: 2,
    backoff: { type: "exponential", delay: 10_000 },
  },
});

// ─── Schedule recurring jobs ──────────────────────────────────────────────────
export async function scheduleRecurringJobs(): Promise<void> {
  const cronExpr = env.TRENDING_REFRESH_CRON;

  // Remove any existing repeatable jobs first (idempotent restart)
  await trendingRefreshQueue.removeRepeatable("trending-all", { pattern: cronExpr });

  await trendingRefreshQueue.add(
    "trending-all",
    { categories: ["TRENDING", "MUSIC", "GAMING", "MOVIES", "NEWS"] },
    { repeat: { pattern: cronExpr }, jobId: "trending-all-recurring" }
  );

  // Daily cleanup at 3 AM
  await cleanupQueue.removeRepeatable("daily-cleanup", { pattern: "0 3 * * *" });
  await cleanupQueue.add(
    "daily-cleanup",
    {},
    { repeat: { pattern: "0 3 * * *" }, jobId: "daily-cleanup-recurring" }
  );

  // Recommendations precompute every 5 minutes
  await recommendationsQueue.removeRepeatable("recommendations-precompute", { pattern: "*/5 * * * *" });
  await recommendationsQueue.add(
    "recommendations-precompute",
    {},
    { repeat: { pattern: "*/5 * * * *" }, jobId: "recommendations-precompute-recurring" }
  );

  console.log("[Jobs] Recurring jobs scheduled");
}

export { connection as bullmqConnection };
