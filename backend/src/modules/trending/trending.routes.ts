/**
 * Trending routes — /trending
 *
 * GET /trending?category=music&region=US
 * POST /trending/refresh  (admin only — forces immediate refresh)
 */

import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { getTrending, refreshAllTrending } from "./trending.service.js";
import { toErrorResponse } from "../../utils/errors.js";

const TrendingQuerySchema = z.object({
  category: z
    .enum(["trending", "music", "gaming", "movies", "news"])
    .default("trending")
    .transform((c) => c.toUpperCase() as "TRENDING" | "MUSIC" | "GAMING" | "MOVIES" | "NEWS"),
  region: z.string().length(2).default("US").transform((r) => r.toUpperCase()),
});

const trendingRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /trending
  fastify.get("/", async (req, reply) => {
    const parsed = TrendingQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid query", details: parsed.error.flatten() },
      });
    }

    try {
      const { category, region } = parsed.data;
      const data = await getTrending(fastify.prisma, category, region);

      reply.header("Cache-Control", "public, s-maxage=600, stale-while-revalidate=1200");
      return reply.send({ success: true, ...data });
    } catch (err) {
      fastify.log.error(err, "Trending fetch error");
      const e = toErrorResponse(err);
      return reply.status(502).send({ success: false, error: e });
    }
  });

  // POST /trending/refresh — force refresh all categories
  // In a real deployment, protect with admin middleware
  fastify.post("/refresh", {
    preHandler: [fastify.authenticate],
  }, async (req, reply) => {
    fastify.log.info({ userId: req.user?.id }, "Manual trending refresh triggered");

    // Run async in background — don't block the response
    refreshAllTrending(fastify.prisma).catch((err) =>
      fastify.log.error(err, "Trending refresh error")
    );

    return reply.send({ success: true, message: "Trending refresh started in background" });
  });
};

export default trendingRoutes;
