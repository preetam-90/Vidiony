/**
 * YouTube API routes — /api/yt/*
 *
 * All data endpoints go through YouTubeService (which owns the Innertube
 * singleton).  Stream URLs are deciphered by the service and returned as
 * plain JSON; the browser sends them to /proxy/stream for actual playback.
 *
 * SECURITY: Stream URL endpoint is rate-limited and cached to prevent abuse.
 */

import { FastifyPluginAsync } from "fastify";
import { spawn } from "child_process";
import {
  SearchQuerySchema,
  VideoIdParamSchema,
  ChannelIdParamSchema,
  StreamParamsSchema,
  StreamQuerySchema,
  FeedQuerySchema,
} from "./youtube.schemas.js";
import * as ytService from "../../services/youtube.service.js";
import { getCachedData, setCachedData } from "../../services/cache.service.js";

const youtubeModuleRoutes: FastifyPluginAsync = async (fastify) => {
  // ─── Health ──────────────────────────────────────────────────────────────
  fastify.get("/health", async () => ({
    status: "ok",
    service: "youtube",
  }));

  // ─── Search suggestions ──────────────────────────────────────────────────
  // Must be registered BEFORE /search to avoid route conflict.
  fastify.get("/search/suggestions", async (req, reply) => {
    const { q } = req.query as { q?: string };
    if (!q) return reply.status(400).send({ error: '"q" is required' });
    try {
      const suggestions = await ytService.getSearchSuggestions(q);
      return reply.send(suggestions);
    } catch (err: any) {
      fastify.log.error(err, "Suggestions error");
      return reply.status(500).send({ error: err?.message ?? "Failed" });
    }
  });

  // ─── Feed (trending / homepage) ──────────────────────────────────────────
  fastify.get("/feed", async (req, reply) => {
    const parsed = FeedQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }
    try {
      const { page, limit } = parsed.data;
      const videos = await ytService.getFeed(page, limit);
      reply.header("Cache-Control", "public, s-maxage=600, stale-while-revalidate=1200");
      return reply.send({ videos });
    } catch (err: any) {
      fastify.log.error(err, "Feed error");
      return reply.status(500).send({ error: err?.message ?? "Failed to fetch feed" });
    }
  });

  // ─── Search ──────────────────────────────────────────────────────────────
  fastify.get("/search", async (req, reply) => {
    const parsed = SearchQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }
    try {
      const videos = await ytService.search(parsed.data.q);
      reply.header("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
      return reply.send({ videos });
    } catch (err: any) {
      fastify.log.error(err, "Search error");
      return reply.status(500).send({ error: err?.message ?? "Search failed" });
    }
  });

  // ─── Video details ───────────────────────────────────────────────────────
  fastify.get("/video/:id", async (req, reply) => {
    const parsed = VideoIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }
    try {
      const details = await ytService.getVideoDetails(parsed.data.id);
      reply.header("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
      return reply.send({ video: details });
    } catch (err: any) {
      fastify.log.error(err, "Video details error");
      return reply.status(500).send({ error: err?.message ?? "Failed to fetch video details" });
    }
  });

  // ─── Related videos ──────────────────────────────────────────────────────
  fastify.get("/video/:id/related", async (req, reply) => {
    const parsed = VideoIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }
    try {
      const videos = await ytService.getRelatedVideos(parsed.data.id);
      reply.header("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
      return reply.send({ videos });
    } catch (err: any) {
      fastify.log.error(err, "Related videos error");
      return reply.status(500).send({ error: err?.message ?? "Failed to fetch related videos" });
    }
  });

  // ─── Comments ────────────────────────────────────────────────────────────
  fastify.get("/video/:id/comments", async (req, reply) => {
    const parsed = VideoIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }
    try {
      const { comments, hasMore, totalCount } = await ytService.getComments(parsed.data.id, "TOP_COMMENTS", 0);
      reply.header("Cache-Control", "public, s-maxage=180, stale-while-revalidate=300");
      return reply.send({ comments, hasMore, totalCount });
    } catch (err: any) {
      fastify.log.error(err, "Comments error");
      return reply.status(500).send({ error: err?.message ?? "Failed to fetch comments" });
    }
  });

  // ─── Channel info ─────────────────────────────────────────────────────────
  fastify.get("/channel/:id", async (req, reply) => {
    const parsed = ChannelIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }
    try {
      const channel = await ytService.getChannelInfo(parsed.data.id);
      reply.header("Cache-Control", "public, s-maxage=600, stale-while-revalidate=1200");
      return reply.send({ channel });
    } catch (err: any) {
      fastify.log.error(err, "Channel info error");
      return reply.status(500).send({ error: err?.message ?? "Failed to fetch channel info" });
    }
  });

  fastify.get("/guide", async (req, reply) => {
    try {
      const guide = await ytService.getGuide();
      reply.header("Cache-Control", "private, s-maxage=300, stale-while-revalidate=600");
      return reply.send(guide);
    } catch (err: any) {
      fastify.log.error(err, "Guide error");
      return reply.status(500).send({ error: err?.message ?? "Failed to fetch guide" });
    }
  });

  // ─── Caption VTT proxy ────────────────────────────────────────────────────
  //
  // Uses yt-dlp to download the WebVTT subtitle file — yt-dlp handles all
  // YouTube auth/signing that a plain fetch cannot replicate.
  //
  //   GET /api/yt/captions/:videoId?lang=en          (manual captions)
  //   GET /api/yt/captions/:videoId?lang=en&kind=asr (auto-generated)
  //
  fastify.get("/captions/:videoId", async (req, reply) => {
    const { videoId } = req.params as { videoId: string };
    const { lang = "en", kind } = req.query as { lang?: string; kind?: string };
    const isAuto = kind === "asr";

    req.log.info({ videoId, lang, isAuto }, "Caption VTT request");

    try {
      const vtt = await ytService.getCaptionVtt(videoId, lang, isAuto);

      if (!vtt) {
        return reply.status(404).send({ error: "No caption content returned" });
      }

      reply.header("Content-Type", "text/vtt; charset=utf-8");
      reply.header("Cache-Control", "public, max-age=3600, stale-while-revalidate=7200");
      return reply.send(vtt);
    } catch (err: any) {
      req.log.error(err, "Caption VTT error");
      return reply.status(404).send({ error: err?.message ?? "Captions not available" });
    }
  });

  // ─── Merged adaptive stream (ffmpeg real-time merge) ─────────────────────
  //
  // YouTube only ships ONE combined (video+audio) stream — itag 18 at ~360p.
  // All other resolutions are adaptive (video-only + audio-only DASH streams).
  // This endpoint fetches both with yt-dlp and merges them in real-time via
  // ffmpeg, outputting a fragmented MP4 the browser can play directly.
  //
  //   GET /api/yt/merged-stream/:videoId?quality=720p
  //
  fastify.get("/merged-stream/:videoId", async (req, reply) => {
    const { videoId } = req.params as { videoId: string };
    const rawQ = (req.query as { quality?: string }).quality ?? "720p";
    const quality = rawQ.match(/^(\d+p)/)?.[1] ?? rawQ;

    req.log.info({ videoId, quality }, "Merged stream request");

    let videoUrl: string;
    let audioUrl: string;
    try {
      ({ videoUrl, audioUrl } = await ytService.getAdaptiveStreamUrls(videoId, quality));
    } catch (err: any) {
      req.log.error(err, "getAdaptiveStreamUrls failed");
      return reply.status(500).send({ error: err?.message ?? "Failed to get stream URLs" });
    }

    const ff = spawn("ffmpeg", [
      "-loglevel", "error",
      "-i", videoUrl,
      "-i", audioUrl,
      "-map", "0:v:0",
      "-map", "1:a:0",
      "-c:v", "copy",
      "-c:a", "aac",
      "-b:a", "128k",
      "-f", "mp4",
      "-movflags", "frag_keyframe+empty_moov+default_base_moof",
      "pipe:1",
    ]);

    req.raw.on("close", () => { try { ff.kill("SIGKILL"); } catch { } });
    ff.stderr.on("data", (chunk: Buffer) => {
      req.log.debug({ ffmpeg: chunk.toString() }, "ffmpeg stderr");
    });
    ff.on("error", (err) => { req.log.error({ err }, "ffmpeg process error"); });

    reply.header("Content-Type", "video/mp4");
    reply.header("Cache-Control", "no-store");
    reply.header("X-Quality", quality);
    return reply.send(ff.stdout);
  });

  // ─── Stream URL ───────────────────────────────────────────────────────────
  //
  // Returns a JSON object with the deciphered YouTube stream URL.
  // The frontend must NOT use this URL directly (CORS) — it must pipe it
  // through /proxy/stream:
  //
  //   GET /api/yt/stream/:videoId          → best combined mp4
  //   GET /api/yt/stream/:videoId/:itag    → specific itag
  //
  //   Response: { url: string, proxyUrl: string, itag, mimeType, qualityLabel }
  //
  // Rate limit for stream URL requests (prevent abuse of the deciphering endpoint)
  const streamUrlRateLimit = fastify.rateLimit({
    max: 60, // 60 requests per minute per user/IP
    timeWindow: 60 * 1000,
    keyGenerator: (req: any) => {
      const userId = (req as any).user?.id;
      return userId ? `user:${userId}` : req.ip;
    },
    skipOnError: true,
  });

  // Stream URL handler with rate limiting and caching
  const streamHandler = async (req: any, reply: any) => {
    const parsed = StreamParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const parsedQuery = StreamQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      return reply.status(400).send({ error: parsedQuery.error.flatten() });
    }

    const { videoId } = parsed.data;
    const { quality } = parsedQuery.data;

    // Check cache first (cache key includes videoId and quality)
    const cacheKey = `yt_stream:${videoId}:${quality ?? 'best'}`;
    const cached = await getCachedData<{
      videoId: string;
      itag: number;
      mimeType: string;
      container: string;
      qualityLabel: string;
      contentLength: number;
      url: string;
      proxyUrl: string;
    }>(cacheKey);

    if (cached) {
      req.log.debug({ videoId, quality }, "Stream URL cache hit");
      return reply.send(cached);
    }

    try {
      req.log.info({ videoId, quality }, "Stream URL request");

      const fmt = await ytService.getStreamFormat(videoId, { quality, type: 'video+audio' });

      const proxyUrl = `/proxy/stream?url=${encodeURIComponent(fmt.url)}`;

      const responseData = {
        videoId,
        itag: fmt.itag,
        mimeType: fmt.mimeType,
        container: fmt.container,
        qualityLabel: fmt.qualityLabel,
        contentLength: fmt.contentLength,
        url: fmt.url,
        proxyUrl,
      };

      // Cache for 5 minutes (300 seconds)
      await setCachedData(cacheKey, responseData, 300);

      return reply.send(responseData);
    } catch (err: any) {
      req.log.error(err, "Stream URL error");
      return reply.status(500).send({
        error: err?.message ?? "Failed to get stream URL",
        hint: "Set YT_COOKIE in .env for better stream URL deciphering.",
      });
    }
  };

  // Register routes with rate limit preHandler
  fastify.get("/stream/:videoId", { preHandler: [streamUrlRateLimit] }, streamHandler);
  fastify.get("/stream/:videoId/:itag", { preHandler: [streamUrlRateLimit] }, streamHandler);
};

export default youtubeModuleRoutes;
