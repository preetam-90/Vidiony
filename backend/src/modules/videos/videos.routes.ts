/**
 * Video-specific routes that extend the YouTube module.
 *
 * GET  /videos/:id              — video info (wraps yt module)
 * GET  /videos/:id/stream       — stream URL for the player
 * GET  /videos/:id/download     — download video (streams to client)
 * GET  /videos/:id/transcript   — full transcript / captions
 * POST /videos/:id/like
 * POST /videos/:id/dislike
 * DELETE /videos/:id/like       — remove rating
 * GET  /videos/:id/comments
 * POST /videos/:id/comments
 * POST /comments/:id/reply
 * DELETE /comments/:id
 */

import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { spawn } from "node:child_process";
import { env } from "../../config/env.js";
import { toErrorResponse, YouTubeAuthRequired } from "../../utils/errors.js";
import * as ytService from "../../services/youtube.service.js";
import { getCachedData, setCachedData } from "../../services/cache.service.js";
import { getUserYouTubeTokens } from "../auth/auth.service.js";

const YTDLP_BIN = env.YTDLP_PATH;

function sanitizeFilenamePart(input: string): string {
  return input
    .replace(/[\\/:*?"<>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}

async function getYTAccessToken(fastify: any, userId: string): Promise<string> {
  const tokens = await getUserYouTubeTokens(fastify.prisma, userId);
  if (!tokens) throw new YouTubeAuthRequired("use YouTube features");
  return tokens.access_token;
}

async function ytDataApi<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`https://www.googleapis.com/youtube/v3${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(body || `YouTube API error ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

const videoRoutes: FastifyPluginAsync = async (fastify) => {
  // ─── GET /videos/:id ─────────────────────────────────────────────────────
  fastify.get("/:id", {
    preHandler: [fastify.optionalAuthenticate],
  }, async (req, reply) => {
    const { id } = req.params as { id: string };

    try {
      const [details, related] = await Promise.all([
        ytService.getVideoDetails(id),
        ytService.getRelatedVideos(id),
      ]);

      const response: Record<string, unknown> = {
        success: true,
        video: { ...details, relatedVideos: related },
      };

      // Enrich with user-specific data if authenticated
      if (req.user && fastify.prisma) {
        const history = await fastify.prisma.watchHistory.findUnique({
          where: { userId_videoId: { userId: req.user.id, videoId: id } },
          select: { progress: true },
        });
        if (history) response.progress = history.progress;
      }

      reply.header("Cache-Control", "public, s-maxage=120, stale-while-revalidate=300");
      return reply.send(response);
    } catch (err) {
      fastify.log.error(err, `Video info error: ${id}`);
      return reply.status(502).send({ success: false, error: toErrorResponse(err) });
    }
  });

  // ─── GET /videos/:id/stream ───────────────────────────────────────────────
  fastify.get("/:id/stream", async (req, reply) => {
    const { id } = req.params as { id: string };
    const q = req.query as Record<string, string>;
    const quality = q.quality ?? "360p";
    const type = (q.type ?? "video+audio") as "video" | "audio" | "video+audio";

    try {
      const fmt = await ytService.getStreamFormat(id, { quality, type });
      const proxyUrl = `/proxy/stream?url=${encodeURIComponent(fmt.url)}`;
      return reply.send({
        success: true,
        videoId: id,
        itag: fmt.itag,
        mimeType: fmt.mimeType,
        qualityLabel: fmt.qualityLabel,
        url: fmt.url,
        proxyUrl,
        expiresIn: 21_600, // ~6 hours
      });
    } catch (err) {
      fastify.log.error(err, `Stream URL error: ${id}`);
      return reply.status(502).send({ success: false, error: toErrorResponse(err) });
    }
  });

  // ─── GET /videos/:id/adaptive ─────────────────────────────────────────────
  // Returns separate video + audio URLs for adaptive streaming
  fastify.get("/:id/adaptive", async (req, reply) => {
    const { id } = req.params as { id: string };
    const { quality = "720p" } = req.query as Record<string, string>;

    try {
      const { videoUrl, audioUrl } = await ytService.getAdaptiveStreamUrls(id, quality);
      return reply.send({
        success: true,
        videoId: id,
        quality,
        videoProxyUrl: `/proxy/stream?url=${encodeURIComponent(videoUrl)}`,
        audioProxyUrl: `/proxy/stream?url=${encodeURIComponent(audioUrl)}`,
        videoUrl,
        audioUrl,
      });
    } catch (err) {
      fastify.log.error(err, `Adaptive URLs error: ${id}`);
      return reply.status(502).send({ success: false, error: toErrorResponse(err) });
    }
  });

  // ─── GET /videos/:id/download ─────────────────────────────────────────────
  fastify.get("/:id/download", {
    preHandler: [async (req: any, reply) => {
      const queryToken = (req.query as Record<string, string> | undefined)?.token;

      if (queryToken) {
        try {
          req.user = await fastify.jwt.verify(queryToken);
          return;
        } catch {
          return reply.status(401).send({
            success: false,
            error: { code: "UNAUTHORIZED", message: "Invalid download token" },
          });
        }
      }

      return fastify.authenticate(req, reply);
    }],
  }, async (req, reply) => {
    if (!env.ENABLE_DOWNLOADS) {
      return reply.status(403).send({ success: false, error: { code: "DOWNLOADS_DISABLED", message: "Downloads are disabled" } });
    }

    const { id } = req.params as { id: string };
    const { quality = "720p", format = "mp4" } = req.query as Record<string, string>;

    if (fastify.prisma) {
      fastify.prisma.downloadQueue.create({
        data: {
          userId: req.user!.id,
          videoId: id,
          quality,
          format,
          status: "PROCESSING",
        },
      }).catch(() => {}); // Don't block on DB write
    }

    const url = `https://www.youtube.com/watch?v=${id}`;
    const maxQualityHeight = parseInt(env.MAX_DOWNLOAD_QUALITY) || 2160;
    const h = Math.min(parseInt(quality) || 720, maxQualityHeight);

    const fmtSelector =
      format === "audio"
        ? "bestaudio[ext=m4a]/bestaudio"
        : `bestvideo[height<=${h}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=${h}]+bestaudio/best[height<=${h}]`;

    const details = await ytService.getVideoDetails(id).catch(() => null);
    const safeTitle = sanitizeFilenamePart(details?.title || id);
    const qualityLabel = format === "audio" ? "audio" : quality;
    const ext = format === "audio" ? "m4a" : "mp4";
    const filename = `${safeTitle} ${qualityLabel}.${ext}`;

    reply.header("Content-Disposition", `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
    reply.header("Content-Type", format === "audio" ? "audio/mp4" : "video/mp4");
    reply.header("Transfer-Encoding", "chunked");

    const args = [
      "-f", fmtSelector,
      "--merge-output-format", format === "audio" ? "m4a" : "mp4",
      "--no-playlist",
      "--no-warnings",
      "-o", "-",
      url,
    ];

    const dl = spawn(YTDLP_BIN, args);

    req.raw.on("close", () => {
      try { dl.kill("SIGKILL"); } catch {}
    });

    dl.stderr.on("data", (chunk: Buffer) => {
      fastify.log.debug({ stderr: chunk.toString() }, "yt-dlp download stderr");
    });

    dl.on("error", (err) => {
      fastify.log.error(err, "yt-dlp download process error");
    });

    return reply.send(dl.stdout);
  });

  // ─── GET /videos/:id/state ────────────────────────────────────────────────
  fastify.get("/:id/state", { preHandler: [fastify.requireYouTube] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { channelId } = req.query as { channelId?: string };

    try {
      const token = await getYTAccessToken(fastify, req.user!.id);

      const [ratingData, subData] = await Promise.all([
        ytDataApi<any>(`/videos/getRating?id=${encodeURIComponent(id)}`, token),
        channelId
          ? ytDataApi<any>(
              `/subscriptions?part=id&mine=true&forChannelId=${encodeURIComponent(channelId)}&maxResults=1`,
              token,
            )
          : Promise.resolve({ items: [] }),
      ]);

      const rating = ratingData?.items?.[0]?.rating ?? "none";
      const subscribed = !!subData?.items?.length;

      return reply.send({
        success: true,
        liked: rating === "like",
        disliked: rating === "dislike",
        subscribed,
      });
    } catch (err) {
      return reply.status(502).send({ success: false, error: toErrorResponse(err) });
    }
  });

  // ─── GET /videos/:id/transcript ───────────────────────────────────────────
  fastify.get("/:id/transcript", async (req, reply) => {
    const { id } = req.params as { id: string };
    const { lang = "en", kind } = req.query as { lang?: string; kind?: string };
    const isAuto = kind === "asr" || kind === "auto";

    const cacheKey = `transcript:${id}:${lang}:${isAuto ? "auto" : "manual"}`;
    const cached = await getCachedData<string>(cacheKey);
    if (cached) {
      reply.header("Content-Type", "text/vtt; charset=utf-8");
      reply.header("Cache-Control", "public, max-age=86400");
      reply.header("X-Cache", "HIT");
      return reply.send(cached);
    }

    try {
      const vtt = await ytService.getCaptionVtt(id, lang, isAuto);
      await setCachedData(cacheKey, vtt, 86_400); // 24h

      reply.header("Content-Type", "text/vtt; charset=utf-8");
      reply.header("Cache-Control", "public, max-age=86400");
      return reply.send(vtt);
    } catch (err) {
      fastify.log.error(err, `Transcript error: ${id}/${lang}`);
      return reply.status(404).send({ success: false, error: toErrorResponse(err) });
    }
  });

  // ─── Like / Dislike / Remove (YouTube Data API v3) ────────────────────────
  fastify.post("/:id/like", { preHandler: [fastify.requireYouTube] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      const token = await getYTAccessToken(fastify, req.user!.id);
      await ytDataApi<void>(`/videos/rate?id=${encodeURIComponent(id)}&rating=like`, token, {
        method: "POST",
      });
      return reply.send({ success: true, action: "liked", videoId: id });
    } catch (err) {
      return reply.status(502).send({ success: false, error: toErrorResponse(err) });
    }
  });

  fastify.post("/:id/dislike", { preHandler: [fastify.requireYouTube] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      const token = await getYTAccessToken(fastify, req.user!.id);
      await ytDataApi<void>(`/videos/rate?id=${encodeURIComponent(id)}&rating=dislike`, token, {
        method: "POST",
      });
      return reply.send({ success: true, action: "disliked", videoId: id });
    } catch (err) {
      return reply.status(502).send({ success: false, error: toErrorResponse(err) });
    }
  });

  fastify.delete("/:id/like", { preHandler: [fastify.requireYouTube] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      const token = await getYTAccessToken(fastify, req.user!.id);
      await ytDataApi<void>(`/videos/rate?id=${encodeURIComponent(id)}&rating=none`, token, {
        method: "POST",
      });
      return reply.send({ success: true, action: "rating_removed", videoId: id });
    } catch (err) {
      return reply.status(502).send({ success: false, error: toErrorResponse(err) });
    }
  });

  // ─── Comments ─────────────────────────────────────────────────────────────
  fastify.get("/:id/comments", async (req, reply) => {
    const { id } = req.params as { id: string };
    const { sort = "top", page = "0" } = req.query as { sort?: string; page?: string };

    const sortKey = sort === "new" ? "NEWEST_FIRST" : "TOP_COMMENTS";
    const pageNum = Math.max(0, parseInt(page, 10) || 0);

    // Only cache page 0 at the route level (service handles it internally)
    const cacheKey = `comments:${id}:${sortKey}:0`;
    if (pageNum === 0) {
      const cached = await getCachedData(cacheKey);
      if (cached) {
        reply.header("X-Cache", "HIT");
        return reply.send(cached);
      }
    }

    try {
      const result = await ytService.getComments(id, sortKey as "TOP_COMMENTS" | "NEWEST_FIRST", pageNum);
      const response = { success: true, ...result };
      if (pageNum === 0) {
        await setCachedData(cacheKey, response, 180);
        reply.header("Cache-Control", "public, s-maxage=180");
      }
      return reply.send(response);
    } catch (err: any) {
      if (err?.message === "CONTINUATION_EXPIRED") {
        return reply.status(410).send({ success: false, error: { code: "CONTINUATION_EXPIRED", message: "Reload comments from page 0" } });
      }
      fastify.log.error(err, `Comments error: ${id}`);
      return reply.status(502).send({ success: false, error: toErrorResponse(err) });
    }
  });

  fastify.post("/:id/comments", { preHandler: [fastify.requireYouTube] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const schema = z.object({ text: z.string().min(1).max(10_000) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Text required" } });
    }

    try {
      const token = await getYTAccessToken(fastify, req.user!.id);
      await ytDataApi(`/commentThreads?part=snippet`, token, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          snippet: {
            videoId: id,
            topLevelComment: {
              snippet: {
                textOriginal: parsed.data.text,
              },
            },
          },
        }),
      });
      return reply.status(201).send({ success: true, message: "Comment posted" });
    } catch (err) {
      return reply.status(502).send({ success: false, error: toErrorResponse(err) });
    }
  });
};

export default videoRoutes;
