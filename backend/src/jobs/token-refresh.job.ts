/**
 * OAuth token refresh job processor.
 * Proactively refreshes YouTube OAuth tokens that expire within 1 hour.
 */

import { Worker, Job } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { bullmqConnection, QUEUE_TOKEN_REFRESH } from "./queue.js";
import { decryptJson, encryptJson } from "../utils/crypto.js";
import { refreshYouTubeToken, type YouTubeTokens } from "../modules/auth/auth.service.js";

const prisma = new PrismaClient();

export function createTokenRefreshWorker(): Worker {
  const worker = new Worker(
    QUEUE_TOKEN_REFRESH,
    async (_job: Job) => {
      const threshold = Date.now() + 60 * 60 * 1000; // 1 hour

      const users = await prisma.user.findMany({
        where: {
          youtubeConnected: true,
          youtubeTokens: { not: null },
        },
        select: { id: true, youtubeTokens: true },
      });

      let refreshed = 0, failed = 0;

      for (const user of users) {
        try {
          const tokens = decryptJson<YouTubeTokens>(user.youtubeTokens);
          if (!tokens) continue;
          if (tokens.expiry_date > threshold) continue;

          const newTokens = await refreshYouTubeToken(tokens.refresh_token);
          await prisma.user.update({
            where: { id: user.id },
            data: { youtubeTokens: encryptJson(newTokens) },
          });
          refreshed++;
        } catch (err) {
          failed++;
          console.error(`[TokenRefresh] Failed for user ${user.id}:`, (err as Error).message);
        }
      }

      console.log(`[TokenRefresh] Done — refreshed: ${refreshed}, failed: ${failed}`);
    },
    { connection: bullmqConnection }
  );

  worker.on("failed", (job, err) => console.error(`[TokenRefresh] ${job?.id} failed:`, err.message));
  return worker;
}
