/**
 * Worker process entry point.
 * Run with: pnpm dev:worker
 *
 * This runs separately from the HTTP server to avoid blocking the event loop.
 */

import "dotenv/config";
import { scheduleRecurringJobs } from "./queue.js";
import { createTrendingWorker } from "./trending.job.js";
import { createTokenRefreshWorker } from "./token-refresh.job.js";
import { createCleanupWorker } from "./cleanup.job.js";
import { createRecommendationsWorker } from "./recommendations.job.js";

console.log("[Worker] Starting Vidion background workers...");

// Start all workers
const trendingWorker       = createTrendingWorker();
const tokenWorker          = createTokenRefreshWorker();
const cleanupWorker        = createCleanupWorker();
const recommendationsWorker = createRecommendationsWorker();

// Schedule recurring jobs
await scheduleRecurringJobs();

console.log("[Worker] All workers running. Ctrl+C to stop.");

// Graceful shutdown
const shutdown = async () => {
  console.log("[Worker] Shutting down...");
  await Promise.allSettled([
    trendingWorker.close(),
    tokenWorker.close(),
    cleanupWorker.close(),
    recommendationsWorker.close(),
  ]);
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
