/**
 * Search routes — /search
 *
 * GET /search?q=...&type=video&sort=relevance&upload_date=week&duration=short
 * GET /search/suggestions?q=partial
 */

import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { getInnertube } from "../../innertube.js";
import { getCachedData, setCachedData } from "../../services/cache.service.js";
import { toErrorResponse } from "../../utils/errors.js";
import { createHash } from "node:crypto";

const SearchQuerySchema = z.object({
  q: z.string().min(1, "q is required").max(200),
  type: z.enum(["video", "channel", "playlist", "all"]).default("all"),
  sort: z.enum(["relevance", "upload_date", "view_count", "rating"]).default("relevance"),
  upload_date: z.enum(["hour", "today", "week", "month", "year"]).optional(),
  duration: z.enum(["short", "medium", "long"]).optional(),
  features: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
});

// Map UI sort values to youtubei.js sort_by values
const SORT_MAP: Record<string, string> = {
  relevance: "relevance",
  upload_date: "upload_date",
  view_count: "view_count",
  rating: "rating",
};

function getText(val: unknown): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  const obj = val as Record<string, unknown>;
  if (typeof obj.text === "string") return obj.text;
  if (Array.isArray(obj.runs)) return (obj.runs as any[]).map((r) => r.text ?? "").join("");
  return "";
}

function getVideoId(item: any): string | null {
  return item?.id ?? item?.videoId ?? item?.video?.id ?? item?.endpoint?.payload?.videoId ?? null;
}

function getPlaylistId(item: any): string | null {
  return item?.id ?? item?.playlistId ?? item?.content_id ?? item?.endpoint?.payload?.playlistId ?? null;
}

function mapResult(item: any) {
  const rawType = String(item?.type ?? "").toLowerCase();

  if (rawType === "channel") {
    return {
      type: "channel" as const,
      id: item.id ?? item.author?.id ?? "",
      name: getText(item.author?.name ?? item.title),
      handle: item.author?.url ?? item.endpoint?.metadata?.url ?? "",
      thumbnail: item.author?.thumbnails?.[0]?.url ?? item.thumbnails?.[0]?.url ?? "",
      subscriberCount: getText(item.subscriber_count),
      videoCount: getText(item.video_count),
      isVerified: item.author?.is_verified ?? item.is_verified ?? false,
    };
  }

  if (rawType === "playlist" || rawType === "lockupview" || item?.content_type === "PLAYLIST") {
    const playlistId = getPlaylistId(item);
    if (!playlistId) return null;

    const metadata = item.metadata ?? {};
    const rows = metadata.metadata?.metadata_rows ?? [];
    const firstRow = rows[0]?.metadata_parts ?? [];
    const secondRow = rows[1]?.metadata_parts ?? [];

    return {
      type: "playlist" as const,
      id: playlistId,
      title: getText(metadata.title ?? item.title),
      thumbnail: item.content_image?.primary_thumbnail?.image?.[0]?.url ?? item.thumbnails?.[0]?.url ?? "",
      channelName: getText(firstRow[0]?.text),
      channelId: firstRow[0]?.text?.runs?.[0]?.endpoint?.payload?.browseId ?? "",
      videoCount: parseInt(getText(secondRow[0]?.text).replace(/\D/g, ""), 10) || null,
    };
  }

  const videoId = getVideoId(item);
  if (rawType === "video" || videoId) {
    if (!videoId) return null;
    return {
      type: "video" as const,
      id: videoId,
      title: getText(item.title),
      thumbnail: item.thumbnails?.at(-1)?.url ?? item.thumbnails?.[0]?.url ?? "",
      duration: getText(item.duration),
      viewCount: getText(item.view_count ?? item.short_view_count),
      publishedAt: getText(item.published),
      channelName: getText(item.author?.name ?? item.author),
      channelId: item.author?.id ?? "",
      channelThumbnail: item.author?.thumbnails?.[0]?.url ?? null,
      isLive: item.is_live ?? false,
    };
  }

  return null;
}

const searchRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /search/suggestions  (must be before /search to avoid route conflict)
  fastify.get("/suggestions", async (req, reply) => {
    const { q } = req.query as { q?: string };
    if (!q?.trim()) {
      return reply.status(400).send({ success: false, error: { code: "MISSING_Q", message: "q is required" } });
    }

    const cacheKey = `search:suggestions:${q.toLowerCase()}`;
    const cached = await getCachedData<string[]>(cacheKey);
    if (cached) return reply.send({ success: true, suggestions: cached });

    try {
      const yt = await getInnertube();
      const suggestions = await yt.getSearchSuggestions(q);
      await setCachedData(cacheKey, suggestions, 900); // 15 min
      reply.header("Cache-Control", "public, s-maxage=900");
      return reply.send({ success: true, suggestions });
    } catch (err) {
      fastify.log.error(err, "Search suggestions error");
      return reply.send({ success: true, suggestions: [] });
    }
  });

  // GET /search
  fastify.get("/", async (req, reply) => {
    const parsed = SearchQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid query", details: parsed.error.flatten() },
      });
    }

    const { q, type, sort, upload_date, duration } = parsed.data;

    // Cache key is hash of all params
    const paramHash = createHash("md5")
      .update(JSON.stringify(parsed.data))
      .digest("hex")
      .slice(0, 16);
    const cacheKey = `search:${paramHash}`;

    const cached = await getCachedData<object>(cacheKey);
    if (cached) {
      reply.header("X-Cache", "HIT");
      return reply.send(cached);
    }

    try {
      const yt = await getInnertube();

      // Build filter options
      const opts: Record<string, string> = {};
      if (type !== "all") opts.type = type;
      if (sort !== "relevance") opts.sort_by = SORT_MAP[sort];
      if (upload_date) opts.upload_date = upload_date;
      if (duration) opts.duration = duration;

      const results = await yt.search(q, opts as any);

      const items = (results.results ?? [])
        .map(mapResult)
        .filter(Boolean)
        .filter((item: any) => type === "all" ? true : item.type === type);

      const response = {
        success: true,
        query: q,
        estimatedResults: (results as any).estimated_results ?? null,
        results: items,
        continuation: (results as any).continuation ?? null,
      };

      await setCachedData(cacheKey, response, 1800); // 30 min
      reply.header("Cache-Control", "public, s-maxage=1800");
      reply.header("X-Cache", "MISS");
      return reply.send(response);
    } catch (err) {
      fastify.log.error(err, "Search error");
      const e = toErrorResponse(err);
      return reply.status(502).send({ success: false, error: e });
    }
  });
};

export default searchRoutes;
