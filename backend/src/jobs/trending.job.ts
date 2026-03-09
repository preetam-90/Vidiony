/**
 * Trending refresh job processor.
 * Fetches all trending categories from YouTube and stores in PostgreSQL.
 */

import { Worker, Job } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { bullmqConnection, QUEUE_TRENDING_REFRESH } from "./queue.js";
import { refreshAllTrending } from "../modules/trending/trending.service.js";

const prisma = new PrismaClient();

export function createTrendingWorker(): Worker {
  const worker = new Worker(
    QUEUE_TRENDING_REFRESH,
    async (job: Job) => {
      console.log(`[TrendingJob] Starting refresh (jobId=${job.id})`);
      await job.updateProgress(0);
      await refreshAllTrending(prisma);
      await job.updateProgress(100);

      try {
        const { trendingRefreshTimestamp } = await import("../plugins/metrics.js");
        trendingRefreshTimestamp.set(Date.now() / 1000);
      } catch {
        // metrics may not be initialised in worker process
      }

      console.log(`[TrendingJob] Done (jobId=${job.id})`);
    },
    { connection: bullmqConnection, concurrency: 1 }
  );

  worker.on("completed", (job) => console.log(`[TrendingJob] Completed: ${job.id}`));
  worker.on("failed", (job, err) => console.error(`[TrendingJob] Failed: ${job?.id}`, err.message));
  worker.on("error", (err) => console.error("[TrendingJob] Worker error:", err.message));

  return worker;
}
