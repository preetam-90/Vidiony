import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";

const historyRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /history/update
  fastify.post("/update", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const schema = z.object({
      videoId:     z.string().min(1),
      position:    z.number().int().min(0),
      duration:    z.number().int().min(0),
      title:       z.string().optional(),
      thumbnail:   z.string().optional(),
      channelName: z.string().optional(),
      // Recommendation enrichment fields
      channelId:   z.string().optional(),
      category:    z.string().optional(),
      tags:        z.array(z.string()).optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.flatten() } });
    }

    let { videoId, position, duration, title, thumbnail, channelName, channelId, category, tags } = parsed.data;

    // Enrich metadata if missing (best-effort). This helps ensure thumbnails/titles appear in the UI.
    if ((!title || !thumbnail || !channelName) && fastify) {
      try {
        const ytService = await import("../services/youtube.service.js");
        const details = await ytService.getVideoDetails(videoId).catch(() => null);
        if (details) {
          title = title || details.title || title;
          thumbnail = thumbnail || (details.thumbnails?.[0]?.url ?? thumbnail);
          channelName = channelName || details.channelName || channelName;
          duration = duration || details.duration || duration;
        }
      } catch (err) {
        fastify.log.debug({ err }, "history: metadata enrichment failed");
      }
    }

    try {
      await fastify.prisma.watchHistory.upsert({
        where: { userId_videoId: { userId: req.user!.id, videoId } },
        create: {
          userId: req.user!.id,
          videoId,
          progress: position,
          duration,
          title,
          thumbnail,
          channelName,
          channelId,
          category,
          tags: tags ?? [],
        },
        update: {
          duration,
          ...(title       ? { title }       : {}),
          ...(thumbnail   ? { thumbnail }   : {}),
          ...(channelName ? { channelName } : {}),
          ...(channelId   ? { channelId }   : {}),
          ...(category    ? { category }    : {}),
          ...(tags?.length ? { tags }       : {}),
          watchedAt: new Date(),
        },
      });

      // Move progress forward only (never backward)
      await fastify.prisma.$executeRaw`
        UPDATE watch_history
        SET progress = GREATEST(progress, ${position})
        WHERE user_id = ${req.user!.id} AND video_id = ${videoId}
      `;

      return reply.send({ success: true });
    } catch (err) {
      fastify.log.error(err, "history update error");
      return reply.status(500).send({ success: false, error: { code: "DB_ERROR", message: "Failed to update history" } });
    }
  });

  // GET /history - paginated
  fastify.get("/", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const { page = "1", limit = "20" } = req.query as Record<string, string>;
    const p = Math.max(1, parseInt(page));
    const l = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (p - 1) * l;

    const [items, total] = await Promise.all([
      fastify.prisma.watchHistory.findMany({
        where: { userId: req.user!.id },
        orderBy: { watchedAt: "desc" },
        skip,
        take: l,
        select: { id: true, videoId: true, title: true, thumbnail: true, channelName: true, duration: true, progress: true, watchedAt: true },
      }),
      fastify.prisma.watchHistory.count({ where: { userId: req.user!.id } }),
    ]);

    return reply.send({ success: true, items, total, page: p, limit: l, totalPages: Math.ceil(total / l) });
  });

  // GET /history/continue
  fastify.get("/continue", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    try {
      const rows = await fastify.prisma.watchHistory.findMany({
        where: {
          userId: req.user!.id,
          progress: { gt: 0 },
          duration: { not: null },
        },
        orderBy: { watchedAt: "desc" },
        take: 100,
      });

      // filter out items where user has watched >= 90%
      const filtered = rows.filter((r: any) => {
        if (!r.duration || r.duration <= 0) return false;
        return r.progress < Math.floor(r.duration * 0.9);
      });

      return reply.send({ success: true, items: filtered });
    } catch (err) {
      fastify.log.error(err, "continue fetch error");
      return reply.status(500).send({ success: false, error: { code: "DB_ERROR", message: "Failed to fetch continue watching" } });
    }
  });

  // GET /history/video/:videoId
  fastify.get("/video/:videoId", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const { videoId } = req.params as { videoId: string };
    const entry = await fastify.prisma.watchHistory.findUnique({
      where: { userId_videoId: { userId: req.user!.id, videoId } },
      select: { id: true, videoId: true, title: true, thumbnail: true, channelName: true, duration: true, progress: true, watchedAt: true },
    });

    return reply.send({ success: true, entry });
  });

  // DELETE /history/:videoId
  fastify.delete("/:videoId", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const { videoId } = req.params as { videoId: string };
    try {
      await fastify.prisma.watchHistory.deleteMany({ where: { userId: req.user!.id, videoId } });
      return reply.send({ success: true });
    } catch (err) {
      fastify.log.error(err, "history delete error");
      return reply.status(500).send({ success: false, error: { code: "DB_ERROR", message: "Failed to delete history entry" } });
    }
  });

  // DELETE /history - clear all
  fastify.delete("/", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    try {
      const { count } = await fastify.prisma.watchHistory.deleteMany({ where: { userId: req.user!.id } });
      return reply.send({ success: true, deleted: count });
    } catch (err) {
      fastify.log.error(err, "history clear error");
      return reply.status(500).send({ success: false, error: { code: "DB_ERROR", message: "Failed to clear history" } });
    }
  });
};

export default historyRoutes;
