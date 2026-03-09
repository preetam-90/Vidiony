/**
 * YouTube API routes — /api/yt/*
 *
 * All data endpoints go through YouTubeService (which owns the Innertube
 * singleton).  Stream URLs are deciphered by the service and returned as
 * plain JSON; the browser sends them to /proxy/stream for actual playback.
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

    req.raw.on("close", () => { try { ff.kill("SIGKILL"); } catch {} });
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
  // Use `proxyUrl` as the <video> src.
  fastify.get("/stream/:videoId", streamHandler);
  fastify.get("/stream/:videoId/:itag", streamHandler);
};

async function streamHandler(req: any, reply: any) {
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

  try {
    req.log.info({ videoId, quality }, "Stream URL request");

    const fmt = await ytService.getStreamFormat(videoId, { quality, type: 'video+audio' });

    const proxyUrl = `/proxy/stream?url=${encodeURIComponent(fmt.url)}`;

    return reply.send({
      videoId,
      itag: fmt.itag,
      mimeType: fmt.mimeType,
      container: fmt.container,
      qualityLabel: fmt.qualityLabel,
      contentLength: fmt.contentLength,
      url: fmt.url,
      proxyUrl,
    });
  } catch (err: any) {
    req.log.error(err, "Stream URL error");
    return reply.status(500).send({
      error: err?.message ?? "Failed to get stream URL",
      hint: "Set YT_COOKIE in .env for better stream URL deciphering.",
    });
  }
}

export default youtubeModuleRoutes;
