/**
 * Live module routes — /live
 *
 * GET /live/:videoId                — live stream info (HLS / DASH manifest URLs)
 * WS  /live/:videoId/chat           — WebSocket live chat relay
 */

import type { FastifyPluginAsync } from "fastify";
import type { WebSocket } from "@fastify/websocket";
import { z } from "zod";
import { getInnertube } from "../../innertube.js";
import { getCachedData, setCachedData } from "../../services/cache.service.js";
import { toErrorResponse } from "../../utils/errors.js";
import { joinRoom, leaveRoom } from "./live.service.js";

const VideoIdSchema = z.object({ videoId: z.string().min(1) });

function getText(val: unknown): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  const obj = val as Record<string, unknown>;
  if (typeof obj.text === "string") return obj.text;
  if (Array.isArray(obj.runs)) return (obj.runs as any[]).map((r) => r.text ?? "").join("");
  return "";
}

function buildProxyUrl(url: string): string {
  return `/proxy/stream?url=${encodeURIComponent(url)}`;
}

function buildLiveManifestUrl(videoId: string, url: string): string {
  return `/api/v2/live/${videoId}/manifest?url=${encodeURIComponent(url)}`;
}

function toAbsoluteUrl(line: string, baseUrl: string): string {
  try {
    return new URL(line, baseUrl).toString();
  } catch {
    return line;
  }
}

/**
 * Rewrite a single non-comment HLS manifest line.
 *
 * YouTube HLS has two levels of manifests:
 *   1. Variant manifest  — lists renditions; each line is a sub-playlist URL
 *      (path contains "hls_playlist" or "hls_variant", or ends with .m3u8).
 *      These must go through the /manifest proxy so their segment lines
 *      also get rewritten — otherwise hls.js would fetch raw googlevideo
 *      segment URLs directly from the browser, hitting CORS errors.
 *
 *   2. Media playlist    — lists actual .ts / .aac segment chunks.
 *      These can go straight through the byte-piping /proxy/stream.
 */
function rewriteManifestLine(absoluteUrl: string, videoId: string): string {
  const isSubPlaylist =
    absoluteUrl.includes("hls_playlist") ||
    absoluteUrl.includes("hls_variant") ||
    /\.m3u8(\?|$)/.test(absoluteUrl) ||
    absoluteUrl.includes("/playlist/index.m3u8");

  return isSubPlaylist
    ? buildLiveManifestUrl(videoId, absoluteUrl)
    : buildProxyUrl(absoluteUrl);
}

const liveRoutes: FastifyPluginAsync = async (fastify) => {
  // ─── GET /live/:videoId ─────────────────────────────────────────────────
  // For live streams, immediately fetch and cache the HLS manifest to work
  // around YouTube's short manifest URL expiration (typically 5-10 minutes).
  // Without caching, the URL returned to the client would expire before hls.js
  // could fetch it.
  fastify.get("/:videoId", async (req, reply) => {
    const parsed = VideoIdSchema.safeParse(req.params);
    if (!parsed.success) {
      return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid video ID" } });
    }

    const { videoId } = parsed.data;
    const cacheKey = `live:info:${videoId}`;
    const cached = await getCachedData(cacheKey);
    if (cached) return reply.send(cached);

    try {
      const yt = await getInnertube();
      const info = await yt.getInfo(videoId);
      const basic = info.basic_info as any;
      const streamData = info.streaming_data as any;

      // ─── Fetch and cache HLS manifest for live streams ────────────────────
      // YouTube manifest URLs expire in ~5-10 minutes. We fetch immediately
      // and return a stable internal URL (`/api/v2/live/:id/manifest/cached`)
      // that we manage and refresh periodically.
      let hlsManifestUrl: string | null = null;
      if (streamData?.hls_manifest_url && basic.is_live) {
        const manifestCacheKey = `live:hls_manifest:${videoId}`;
        try {
          const upstream = await fetch(streamData.hls_manifest_url, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              Accept: "application/vnd.apple.mpegurl, application/x-mpegURL, */*",
              Origin: "https://www.youtube.com",
              Referer: "https://www.youtube.com/",
            },
          });

          if (upstream.ok) {
            const manifestText = await upstream.text();
            // Cache the manifest for 25 seconds (YouTube's typical expiration is 5-10 min,
            // hls.js polls every ~5-10 sec, so 25s keeps a fresh buffer)
            await setCachedData(manifestCacheKey, manifestText, 25);
            hlsManifestUrl = `/api/v2/live/${videoId}/manifest/cached`;
            fastify.log.debug(`Live HLS manifest cached for ${videoId}`);
          }
        } catch (err) {
          fastify.log.warn(err, `Failed to pre-fetch HLS manifest for ${videoId}, falling back to URL proxy`);
          hlsManifestUrl = buildLiveManifestUrl(videoId, streamData.hls_manifest_url);
        }
      }

      const liveInfo = {
        success: true,
        videoId,
        isLive: basic.is_live ?? false,
        isUpcoming: basic.is_upcoming ?? false,
        viewers: getText((info as any).primary_info?.view_count),
        startTime: basic.start_timestamp ?? null,
        title: getText(basic.title),
        channelId: basic.channel_id ?? "",
        channelName: getText(basic.author),
        thumbnails: (basic.thumbnail ?? []).map((t: any) => ({ url: t.url, width: t.width, height: t.height })),
        hlsManifestUrl,
        dashManifestUrl: streamData?.dash_manifest_url
          ? buildProxyUrl(streamData.dash_manifest_url)
          : null,
        formats: [
          ...(streamData?.formats ?? []),
          ...(streamData?.adaptive_formats ?? []),
        ].map((f: any) => ({
          itag: f.itag,
          quality: f.quality_label ?? f.quality,
          mimeType: f.mime_type,
          hasAudio: Boolean(f.has_audio ?? f.audio_quality),
          hasVideo: Boolean(f.has_video ?? f.quality_label),
          url: f.url ?? null,
        })),
      };

      // Cache live info for only 20 seconds (slightly less than manifest cache)
      if (liveInfo.isLive) await setCachedData(cacheKey, liveInfo, 20);
      else await setCachedData(cacheKey, liveInfo, 300);

      return reply.send(liveInfo);
    } catch (err) {
      fastify.log.error(err, `Live info error: ${videoId}`);
      const e = toErrorResponse(err);
      return reply.status(502).send({ success: false, error: e });
    }
  });

  // ─── GET /live/:videoId/manifest/cached ───────────────────────────────
  // Serves pre-fetched and cached HLS manifest for live streams. This avoids
  // expiration issues since the manifest is fetched server-side immediately
  // after calling getInfo(), while the YouTube URL is still fresh.
  fastify.get("/:videoId/manifest/cached", async (req, reply) => {
    const parsed = VideoIdSchema.safeParse(req.params);
    if (!parsed.success) {
      return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid video ID" } });
    }

    const { videoId } = parsed.data;
    const manifestCacheKey = `live:hls_manifest:${videoId}`;

    try {
      const cachedManifest = await getCachedData(manifestCacheKey);
      if (!cachedManifest) {
        return reply.status(503).send({
          success: false,
          error: { code: "MANIFEST_EXPIRED", message: "HLS manifest cache expired, refresh the page" },
        });
      }

      // Rewrite manifest lines to route through our proxies
      const rewritten = (cachedManifest as string)
        .split("\n")
        .map((line) => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) return line;
          // Try to convert relative to absolute using a dummy base
          // (YouTube manifests use absolute URLs for playlists)
          const absolute = trimmed.startsWith("http")
            ? trimmed
            : `https://manifest.googlevideo.com/${trimmed}`;
          return rewriteManifestLine(absolute, videoId);
        })
        .join("\n");

      reply.header("Content-Type", "application/vnd.apple.mpegurl");
      reply.header("Cache-Control", "no-store, max-age=0");
      return reply.send(rewritten);
    } catch (err) {
      fastify.log.error(err, `Live cached manifest error: ${videoId}`);
      const e = toErrorResponse(err);
      return reply.status(502).send({ success: false, error: e });
    }
  });

  // ─── GET /live/:videoId/manifest?url=<upstream.m3u8> ───────────────────
  fastify.get("/:videoId/manifest", async (req, reply) => {
    const parsed = VideoIdSchema.safeParse(req.params);
    const query = z.object({ url: z.string().url() }).safeParse(req.query);

    if (!parsed.success || !query.success) {
      return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid manifest request" } });
    }

    const { videoId } = parsed.data;
    const upstreamUrl = query.data.url;

    try {
      const upstream = await fetch(upstreamUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
            "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "application/vnd.apple.mpegurl, application/x-mpegURL, */*",
          Origin: "https://www.youtube.com",
          Referer: "https://www.youtube.com/",
        },
      });

      if (!upstream.ok) {
        return reply.status(502).send({ success: false, error: { code: "UPSTREAM_ERROR", message: `Manifest fetch failed (${upstream.status})` } });
      }

      const manifest = await upstream.text();
      const rewritten = manifest
        .split("\n")
        .map((line) => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) return line;
          const absolute = toAbsoluteUrl(trimmed, upstreamUrl);
          return rewriteManifestLine(absolute, videoId);
        })
        .join("\n");

      reply.header("Content-Type", "application/vnd.apple.mpegurl");
      reply.header("Cache-Control", "no-store, max-age=0");
      return reply.send(rewritten);
    } catch (err) {
      fastify.log.error(err, `Live manifest proxy error: ${videoId}`);
      const e = toErrorResponse(err);
      return reply.status(502).send({ success: false, error: e });
    }
  });

  // ─── WebSocket: /live/:videoId/chat ─────────────────────────────────────
  fastify.get("/:videoId/chat", { websocket: true }, (socket: WebSocket, req) => {
    const { videoId } = req.params as { videoId: string };

    fastify.log.info({ videoId }, "Live chat client connected");

    // Try to get user from JWT header or token query param (optional — needed for sending messages)
    let userId: string | null = null;
    const authHeader = req.headers.authorization;
    const tokenFromQuery = (() => {
      try {
        const requestUrl = new URL(req.url, "http://localhost");
        return requestUrl.searchParams.get("token");
      } catch {
        return null;
      }
    })();
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : tokenFromQuery;
    if (bearerToken) {
      try {
        const payload = fastify.jwt.verify<{ id: string }>(bearerToken);
        userId = payload.id;
      } catch {
        // Ignore — anonymous viewers are OK
      }
    }

    // Join the room
    const room = joinRoom(videoId);

    // Send a welcome message
    send(socket, { type: "connected", videoId, userId, timestamp: new Date().toISOString() });

    // Relay new chat messages to this client
    const onMessage = (msg: object) => send(socket, { type: "message", data: msg });
    const onViewerCount = (update: object) => send(socket, update);
    const onError = (err: Error) => send(socket, { type: "error", message: err.message });
    const onNotLive = () => send(socket, { type: "not_live" });
    const onEnd = () => send(socket, { type: "ended" });

    room.on("message", onMessage);
    room.on("viewer_count", onViewerCount);
    room.on("error", onError);
    room.on("not_live", onNotLive);
    room.on("end", onEnd);

    // Handle incoming client messages
    socket.on("message", (raw: Buffer | string) => {
      try {
        const data = JSON.parse(String(raw));

        if (data.type === "ping") {
          send(socket, { type: "pong" });
          return;
        }

        // Sending chat messages requires YouTube auth
        if (data.type === "send_message") {
          if (!userId) {
            send(socket, {
              type: "error",
              code: "AUTH_REQUIRED",
              message: "You must be logged in to send chat messages",
            });
            return;
          }
          // TODO: Send message via authenticated Innertube instance
          // For now, acknowledge receipt
          send(socket, { type: "message_sent", text: data.text });
        }
      } catch {
        // Ignore malformed messages
      }
    });

    // Cleanup on disconnect
    socket.on("close", () => {
      fastify.log.info({ videoId }, "Live chat client disconnected");
      room.off("message", onMessage);
      room.off("viewer_count", onViewerCount);
      room.off("error", onError);
      room.off("not_live", onNotLive);
      room.off("end", onEnd);
      leaveRoom(videoId);
    });

    socket.on("error", (err: Error) => {
      fastify.log.error(err, "WebSocket error");
      leaveRoom(videoId);
    });
  });
};

function send(socket: WebSocket, data: object): void {
  try {
    if (socket.readyState === 1 /* OPEN */) {
      socket.send(JSON.stringify(data));
    }
  } catch {
    // Client may have disconnected
  }
}

export default liveRoutes;
