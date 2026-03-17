/**
 * Recommendation routes
 *
 * GET /recommendations/home          — personalized home feed (auth optional)
 * GET /recommendations/video/:id     — video-page related videos (auth optional)
 * POST /recommendations/invalidate   — bust cache for a user (admin/internal)
 */

import type { FastifyPluginAsync } from "fastify";
import {
  getHomeRecommendations,
  getVideoPageRecommendations,
  invalidateUserRecommendations,
} from "./recommendation.service.js";

const recommendationRoutes: FastifyPluginAsync = async (fastify) => {
  // ── GET /recommendations/home ──────────────────────────────────────────────
  fastify.get(
    "/home",
    { preHandler: [fastify.optionalAuthenticate] },
    async (req, reply) => {
      try {
        const userId = (req as any).user?.id as string | undefined;

        if (!userId) {
          // Anonymous: just serve trending
          const { getHomeRecommendations: home } = await import(
            "./recommendation.service.js"
          );
          const result = await home(fastify.prisma, "__anon__");
          return reply.send({ success: true, data: result });
        }

        const data = await getHomeRecommendations(fastify.prisma, userId);
        return reply.send({ success: true, data });
      } catch (err) {
        fastify.log.error(err, "[recommendations] home error");
        return reply.status(500).send({
          success: false,
          error: { code: "RECOMMENDATION_ERROR", message: "Failed to load recommendations" },
        });
      }
    }
  );

  // ── GET /recommendations/video/:videoId ────────────────────────────────────
  fastify.get(
    "/video/:videoId",
    { preHandler: [fastify.optionalAuthenticate] },
    async (req, reply) => {
      const { videoId } = req.params as { videoId: string };

      if (!videoId || videoId.length < 3) {
        return reply.status(400).send({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Invalid videoId" },
        });
      }

      try {
        const userId = (req as any).user?.id as string | undefined;
        const data = await getVideoPageRecommendations(fastify.prisma, videoId, userId);
        return reply.send({ success: true, data });
      } catch (err) {
        fastify.log.error(err, "[recommendations] video page error");
        return reply.status(500).send({
          success: false,
          error: { code: "RECOMMENDATION_ERROR", message: "Failed to load video recommendations" },
        });
      }
    }
  );

  // ── POST /recommendations/invalidate ──────────────────────────────────────
  // Called internally after watch analytics are recorded
  fastify.post(
    "/invalidate",
    { preHandler: [fastify.authenticate] },
    async (req, reply) => {
      const userId = (req as any).user!.id as string;
      await invalidateUserRecommendations(userId);
      return reply.send({ success: true });
    }
  );
};

export default recommendationRoutes;
