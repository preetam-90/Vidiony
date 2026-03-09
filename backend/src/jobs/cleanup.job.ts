/**
 * BullMQ cleanup worker.
 */

import { Worker, Job } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { bullmqConnection, QUEUE_CLEANUP } from "./queue.js";

const prisma = new PrismaClient();

export function createCleanupWorker(): Worker {
  const worker = new Worker(
    QUEUE_CLEANUP,
    async (_job: Job) => {
      console.log("[CleanupJob] Starting daily cleanup...");
      const { count } = await prisma.userSession.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
      console.log(`[CleanupJob] Removed ${count} expired sessions`);
    },
    { connection: bullmqConnection }
  );

  worker.on("failed", (job, err) => console.error(`[CleanupJob] Failed: ${job?.id}`, err.message));
  return worker;
}
