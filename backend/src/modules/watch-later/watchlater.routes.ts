/**
 * Watch Later routes — /user/watch-later
 *
 * Vidion-native Watch Later: stored in our DB, independent of YouTube.
 */

import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";

const addSchema = z.object({
  videoId: z.string().min(1),
  title: z.string().optional(),
  thumbnail: z.string().optional(),
  channelName: z.string().optional(),
  channelId: z.string().optional(),
  duration: z.string().optional(),
});

const watchLaterRoutes: FastifyPluginAsync = async (fastify) => {
  // ═══ Add to Watch Later (upsert — idempotent) ════════════════════════════

  fastify.post("/", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const parsed = addSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.flatten() },
      });
    }

    const { videoId, ...meta } = parsed.data;
    const userId = req.user!.id;

    const item = await fastify.prisma.watchLater.upsert({
      where: { userId_videoId: { userId, videoId } },
      create: { userId, videoId, ...meta },
      update: { ...meta }, // refresh metadata if re-saved
    });

    return reply.status(201).send({ success: true, item });
  });

  // ═══ Remove from Watch Later ══════════════════════════════════════════════

  fastify.delete("/:videoId", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const { videoId } = req.params as { videoId: string };
    const userId = req.user!.id;

    await fastify.prisma.watchLater.deleteMany({
      where: { userId, videoId },
    });

    return reply.send({ success: true });
  });

  // ═══ Clear all Watch Later ════════════════════════════════════════════════

  fastify.delete("/clear", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const { count } = await fastify.prisma.watchLater.deleteMany({
      where: { userId: req.user!.id },
    });

    return reply.send({ success: true, deleted: count });
  });

  // ═══ Get Watch Later list (paginated, newest first) ═══════════════════════

  fastify.get("/", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const { page = "1", limit = "20", sort = "newest" } = req.query as Record<string, string>;
    const p = Math.max(1, parseInt(page));
    const l = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (p - 1) * l;
    const orderBy = sort === "oldest" ? "asc" as const : "desc" as const;

    const userId = req.user!.id;

    const [items, total] = await Promise.all([
      fastify.prisma.watchLater.findMany({
        where: { userId },
        orderBy: { addedAt: orderBy },
        skip,
        take: l,
        select: {
          id: true,
          videoId: true,
          title: true,
          thumbnail: true,
          channelName: true,
          channelId: true,
          duration: true,
          addedAt: true,
        },
      }),
      fastify.prisma.watchLater.count({ where: { userId } }),
    ]);

    return reply.send({
      success: true,
      items,
      total,
      page: p,
      hasMore: skip + l < total,
    });
  });

  // ═══ Check if a single video is saved ═════════════════════════════════════

  fastify.get("/check/:videoId", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const { videoId } = req.params as { videoId: string };

    const exists = await fastify.prisma.watchLater.findUnique({
      where: { userId_videoId: { userId: req.user!.id, videoId } },
      select: { id: true },
    });

    return reply.send({ success: true, saved: !!exists });
  });

  // ═══ Batch check multiple video IDs ═══════════════════════════════════════

  fastify.get("/check", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const { ids = "" } = req.query as { ids?: string };
    const videoIds = ids.split(",").filter(Boolean).slice(0, 50); // cap at 50

    if (videoIds.length === 0) {
      return reply.send({ success: true, saved: {} });
    }

    const rows = await fastify.prisma.watchLater.findMany({
      where: { userId: req.user!.id, videoId: { in: videoIds } },
      select: { videoId: true },
    });

    const savedSet = new Set(rows.map((r: { videoId: string }) => r.videoId));
    const saved: Record<string, boolean> = {};
    for (const id of videoIds) {
      saved[id] = savedSet.has(id);
    }

    return reply.send({ success: true, saved });
  });
};

export default watchLaterRoutes;
