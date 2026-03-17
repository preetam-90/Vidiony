/**
 * Analytics routes — behavioral signal ingestion
 *
 * POST /analytics/watch        — record detailed watch event
 * POST /analytics/interaction  — record engagement action (like, skip, share…)
 * GET  /analytics/signals      — debug endpoint (dev only)
 *
 * These endpoints enrich watch_history with category/tag/channelId metadata
 * that powers the multi-layer recommendation engine.
 */

import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { invalidateUserRecommendations } from "../recommendations/recommendation.service.js";

// ─── Validation schemas ────────────────────────────────────────────────────────

const watchSchema = z.object({
  videoId: z.string().min(1).max(64),
  watchTime: z.number().int().min(0),
  watchPercentage: z.number().min(0).max(100),
  duration: z.number().int().min(0).optional(),
  // Enrichment metadata — provided by the player from YouTube API response
  title: z.string().max(500).optional(),
  thumbnail: z.string().url().optional().or(z.literal("")),
  channelId: z.string().max(64).optional(),
  channelName: z.string().max(200).optional(),
  category: z.string().max(100).optional(),
  tags: z.array(z.string().max(100)).max(30).optional(),
  device: z.string().max(50).optional(),
});

const interactionSchema = z.object({
  videoId: z.string().min(1).max(64),
  actionType: z.enum(["LIKE", "DISLIKE", "COMMENT", "SHARE", "SUBSCRIBE", "SAVE", "SKIP"]),
  metadata: z.record(z.unknown()).optional(),
});

// ─── Minimum watch thresholds for useful signal ────────────────────────────────
const MIN_WATCH_SECONDS = 5;
const MIN_WATCH_PCT_STORE = 5; // don't store accidental opens

// ─── Plugin ───────────────────────────────────────────────────────────────────

const analyticsRoutes: FastifyPluginAsync = async (fastify) => {

  // ── POST /analytics/watch ──────────────────────────────────────────────────
  fastify.post(
    "/watch",
    { preHandler: [fastify.authenticate] },
    async (req, reply) => {
      const parsed = watchSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid watch payload",
            details: parsed.error.flatten(),
          },
        });
      }

      const {
        videoId,
        watchTime,
        watchPercentage,
        duration,
        title,
        thumbnail,
        channelId,
        channelName,
        category,
        tags,
        device,
      } = parsed.data;

      const userId = (req as any).user!.id as string;

      // Drop low-quality signals (accidental opens, skip-throughs)
      if (watchTime < MIN_WATCH_SECONDS && watchPercentage < MIN_WATCH_PCT_STORE) {
        return reply.send({ success: true, recorded: false, reason: "below_threshold" });
      }

      try {
        // Upsert watch_history with the initial progress value;
        // we then immediately run a GREATEST() SQL to never go backward.
        await fastify.prisma.watchHistory.upsert({
          where: { userId_videoId: { userId, videoId } },
          create: {
            userId,
            videoId,
            title,
            thumbnail,
            channelId,
            channelName,
            category,
            tags: tags ?? [],
            duration: duration ?? null,
            progress: watchTime,
            watchedAt: new Date(),
          },
          update: {
            // Always refresh metadata from the most recent event
            ...(title ? { title } : {}),
            ...(thumbnail ? { thumbnail } : {}),
            ...(channelId ? { channelId } : {}),
            ...(channelName ? { channelName } : {}),
            ...(category ? { category } : {}),
            ...(tags?.length ? { tags } : {}),
            ...(duration ? { duration } : {}),
            watchedAt: new Date(),
          },
        });

        // Ensure we only move progress forward (Prisma doesn't support MAX in update)
        await fastify.prisma.$executeRaw`
          UPDATE watch_history
          SET progress = GREATEST(progress, ${watchTime})
          WHERE "userId" = ${userId} AND "videoId" = ${videoId}
        `;

        // Invalidate cached recommendations asynchronously
        invalidateUserRecommendations(userId).catch(() => { });

        return reply.send({ success: true, recorded: true });
      } catch (err) {
        fastify.log.error(err, "[analytics] watch upsert error");
        return reply.status(500).send({
          success: false,
          error: { code: "DB_ERROR", message: "Failed to record watch event" },
        });
      }
    }
  );

  // ── POST /analytics/interaction ────────────────────────────────────────────
  fastify.post(
    "/interaction",
    { preHandler: [fastify.authenticate] },
    async (req, reply) => {
      const parsed = interactionSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid interaction payload",
            details: parsed.error.flatten(),
          },
        });
      }

      const { videoId, actionType, metadata } = parsed.data;
      const userId = (req as any).user!.id as string;

      try {
        await fastify.prisma.userInteraction.create({
          data: {
            userId,
            videoId,
            actionType,
            metadata: metadata as any,
          },
        });

        // Dislikes / skips bust the recommendation cache immediately
        if (actionType === "DISLIKE" || actionType === "SKIP") {
          invalidateUserRecommendations(userId).catch(() => { });
        }

        return reply.send({ success: true });
      } catch (err) {
        fastify.log.error(err, "[analytics] interaction create error");
        return reply.status(500).send({
          success: false,
          error: { code: "DB_ERROR", message: "Failed to record interaction" },
        });
      }
    }
  );

  // ── GET /analytics/signals (dev only) ─────────────────────────────────────
  if (process.env.NODE_ENV !== "production") {
    fastify.get(
      "/signals",
      { preHandler: [fastify.authenticate] },
      async (req, reply) => {
        const userId = (req as any).user!.id as string;
        const [watchCount, interactions, topCategories] = await Promise.all([
          fastify.prisma.watchHistory.count({ where: { userId } }),
          fastify.prisma.userInteraction.groupBy({
            by: ["actionType"],
            where: { userId },
            _count: { actionType: true },
          }),
          fastify.prisma.$queryRaw<Array<{ category: string; cnt: number }>>`
            SELECT category, COUNT(*)::int AS cnt
            FROM watch_history
            WHERE "userId" = ${userId} AND category IS NOT NULL
            GROUP BY category
            ORDER BY cnt DESC
            LIMIT 10
          `,
        ]);

        return reply.send({
          success: true,
          data: { watchCount, interactions, topCategories },
        });
      }
    );
  }
};

export default analyticsRoutes;
