/**
 * Recommendation precomputation job.
 *
 * Every 5 minutes:
 *   1. Find users active in the last 24 hours
 *   2. Precompute & cache their home recommendations
 *   3. Warm Redis so the first request after cache expiry is instant
 */

import { Worker, Queue, Job } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { bullmqConnection } from "./queue.js";
import { getHomeRecommendations } from "../modules/recommendations/recommendation.service.js";

export const QUEUE_RECOMMENDATIONS = "recommendations-precompute";

const prisma = new PrismaClient();

export const recommendationsQueue = new Queue(QUEUE_RECOMMENDATIONS, {
  connection: bullmqConnection,
  defaultJobOptions: {
    removeOnComplete: 5,
    removeOnFail: 10,
    attempts: 2,
    backoff: { type: "exponential", delay: 10_000 },
  },
});

export function createRecommendationsWorker(): Worker {
  const worker = new Worker(
    QUEUE_RECOMMENDATIONS,
    async (job: Job) => {
      const { userIds } = job.data as { userIds?: string[] };

      let targets: string[];

      if (userIds?.length) {
        targets = userIds;
      } else {
        // Find users active in the last 24 hours
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const active = await prisma.watchHistory.findMany({
          where: { watchedAt: { gte: cutoff } },
          select: { userId: true },
          distinct: ["userId"],
          take: 500, // cap to avoid overwhelming the DB
        });
        targets = active.map((a) => a.userId);
      }

      if (targets.length === 0) {
        console.log("[RecommendationsJob] No active users to precompute for.");
        return;
      }

      console.log(`[RecommendationsJob] Precomputing for ${targets.length} users…`);
      let success = 0;
      let failed = 0;

      // Process in batches of 20 to avoid hammering the DB
      const BATCH = 20;
      for (let i = 0; i < targets.length; i += BATCH) {
        const batch = targets.slice(i, i + BATCH);

        await Promise.allSettled(
          batch.map(async (userId) => {
            try {
              await getHomeRecommendations(prisma, userId);
              success++;
            } catch (err) {
              failed++;
              console.warn(`[RecommendationsJob] Failed for user ${userId}:`, (err as Error).message);
            }
          })
        );

        await job.updateProgress(Math.round(((i + BATCH) / targets.length) * 100));
      }

      console.log(
        `[RecommendationsJob] Done. success=${success} failed=${failed}`
      );
    },
    { connection: bullmqConnection, concurrency: 1 }
  );

  worker.on("completed", (job) =>
    console.log(`[RecommendationsJob] Completed: ${job.id}`)
  );
  worker.on("failed", (job, err) =>
    console.error(`[RecommendationsJob] Failed: ${job?.id}`, err.message)
  );
  worker.on("error", (err) =>
    console.error("[RecommendationsJob] Worker error:", err.message)
  );

  return worker;
}
