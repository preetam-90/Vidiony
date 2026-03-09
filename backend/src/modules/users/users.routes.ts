/**
 * User routes — /user
 *
 * Watch History, Subscriptions, Playlists (YouTube-authenticated)
 */

import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { Innertube } from "youtubei.js";
import { YouTubeAuthRequired, toErrorResponse } from "../../utils/errors.js";
import { getUserYouTubeTokens } from "../auth/auth.service.js";
import { env } from "../../config/env.js";

const userRoutes: FastifyPluginAsync = async (fastify) => {
  // ═══ Watch History ════════════════════════════════════════════════════════

  fastify.get("/history", { preHandler: [fastify.authenticate] }, async (req, reply) => {
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
        select: {
          id: true, videoId: true, title: true, thumbnail: true,
          channelName: true, duration: true, progress: true, watchedAt: true,
        },
      }),
      fastify.prisma.watchHistory.count({ where: { userId: req.user!.id } }),
    ]);

    return reply.send({ success: true, items, total, page: p, limit: l, totalPages: Math.ceil(total / l) });
  });

  fastify.post("/history", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const schema = z.object({
      videoId: z.string().min(1),
      progress: z.number().int().min(0).default(0),
      title: z.string().optional(),
      thumbnail: z.string().optional(),
      channelName: z.string().optional(),
      duration: z.number().int().optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.flatten() } });
    }

    const { videoId, progress, ...meta } = parsed.data;

    const entry = await fastify.prisma.watchHistory.upsert({
      where: { userId_videoId: { userId: req.user!.id, videoId } },
      create: { userId: req.user!.id, videoId, progress, ...meta },
      update: { progress, watchedAt: new Date(), ...meta },
    });

    return reply.send({ success: true, entry });
  });

  fastify.delete("/history/clear", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const { count } = await fastify.prisma.watchHistory.deleteMany({ where: { userId: req.user!.id } });
    return reply.send({ success: true, deleted: count });
  });

  fastify.delete("/history/:videoId", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const { videoId } = req.params as { videoId: string };
    await fastify.prisma.watchHistory.deleteMany({ where: { userId: req.user!.id, videoId } });
    return reply.send({ success: true });
  });

  // ═══ Subscriptions ════════════════════════════════════════════════════════

  fastify.get("/subscriptions", { preHandler: [fastify.requireYouTube] }, async (req, reply) => {
    try {
      const token = await getYTAccessToken(req.user!.id);
      const data = await ytApi<any>("/subscriptions", token, {
        part: "snippet",
        mine: "true",
        maxResults: "50",
        order: "alphabetical",
      });

      return reply.send({
        success: true,
        subscriptions: (data.items ?? []).map((item: any) => ({
          channelId: item.snippet?.resourceId?.channelId ?? "",
          channelName: item.snippet?.title ?? "",
          thumbnail: item.snippet?.thumbnails?.high?.url ?? item.snippet?.thumbnails?.default?.url ?? null,
        })).filter((item: any) => item.channelId),
      });
    } catch (err) {
      return reply.status(502).send({ success: false, error: toErrorResponse(err) });
    }
  });

  fastify.get("/subscriptions/feed", { preHandler: [fastify.requireYouTube] }, async (req, reply) => {
    try {
      const token = await getYTAccessToken(req.user!.id);
      const data = await ytApi<any>("/activities", token, {
        part: "snippet,contentDetails",
        home: "true",
        maxResults: "50",
      });

      const videoIds = (data.items ?? [])
        .filter((i: any) => i.snippet?.type === "upload")
        .map((i: any) => i.contentDetails?.upload?.videoId)
        .filter(Boolean);

      const details = await getVideoDetails(videoIds, token);
      const videos = videoIds.map((id: string) => {
        const det = details.get(id);
        return det ? mapVideoResource(det) : null;
      }).filter(Boolean);

      return reply.send({ success: true, videos });
    } catch (err) {
      return reply.status(502).send({ success: false, error: toErrorResponse(err) });
    }
  });

  fastify.post("/subscriptions/:channelId", { preHandler: [fastify.requireYouTube] }, async (req, reply) => {
    const { channelId } = req.params as { channelId: string };
    try {
      const token = await getYTAccessToken(req.user!.id);
      await ytApi<any>(
        "/subscriptions",
        token,
        { part: "snippet" },
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            snippet: {
              resourceId: {
                kind: "youtube#channel",
                channelId,
              },
            },
          }),
        },
      );
      return reply.send({ success: true, message: `Subscribed to ${channelId}` });
    } catch (err) {
      return reply.status(502).send({ success: false, error: toErrorResponse(err) });
    }
  });

  fastify.delete("/subscriptions/:channelId", { preHandler: [fastify.requireYouTube] }, async (req, reply) => {
    const { channelId } = req.params as { channelId: string };
    try {
      const token = await getYTAccessToken(req.user!.id);
      const lookup = await ytApi<any>("/subscriptions", token, {
        part: "id",
        mine: "true",
        forChannelId: channelId,
        maxResults: "1",
      });

      const subscriptionId = lookup.items?.[0]?.id;
      if (!subscriptionId) {
        return reply.send({ success: true, message: `Already unsubscribed from ${channelId}` });
      }

      await ytApi<void>("/subscriptions", token, { id: subscriptionId }, { method: "DELETE" });
      return reply.send({ success: true, message: `Unsubscribed from ${channelId}` });
    } catch (err) {
      return reply.status(502).send({ success: false, error: toErrorResponse(err) });
    }
  });

  // ═══ Playlists ════════════════════════════════════════════════════════════

  fastify.get("/playlists", { preHandler: [fastify.requireYouTube] }, async (req, reply) => {
    try {
      const yt = await getAuthenticatedInnertube(fastify, req.user!.id);
      const feed = await yt.getPlaylists();
      return reply.send({ success: true, playlists: (feed as any).items ?? [] });
    } catch (err) {
      return reply.status(502).send({ success: false, error: toErrorResponse(err) });
    }
  });

  fastify.post("/playlists", { preHandler: [fastify.requireYouTube] }, async (req, reply) => {
    const schema = z.object({
      title: z.string().min(1).max(150),
      videoIds: z.array(z.string()).default([]),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.flatten() } });
    }

    try {
      const yt = await getAuthenticatedInnertube(fastify, req.user!.id);
      const result = await yt.playlist.create(parsed.data.title, parsed.data.videoIds);
      return reply.status(201).send({ success: true, playlist: result });
    } catch (err) {
      return reply.status(502).send({ success: false, error: toErrorResponse(err) });
    }
  });

  fastify.delete("/playlists/:id", { preHandler: [fastify.requireYouTube] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      const yt = await getAuthenticatedInnertube(fastify, req.user!.id);
      await yt.playlist.delete(id);
      return reply.send({ success: true });
    } catch (err) {
      return reply.status(502).send({ success: false, error: toErrorResponse(err) });
    }
  });

  fastify.post("/playlists/:id/videos", { preHandler: [fastify.requireYouTube] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const schema = z.object({ videoId: z.string().min(1) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "videoId required" } });
    }

    try {
      const yt = await getAuthenticatedInnertube(fastify, req.user!.id);
      await yt.playlist.addVideos(id, [parsed.data.videoId]);
      return reply.send({ success: true });
    } catch (err) {
      return reply.status(502).send({ success: false, error: toErrorResponse(err) });
    }
  });

  fastify.delete("/playlists/:id/videos/:videoId", { preHandler: [fastify.requireYouTube] }, async (req, reply) => {
    const { id, videoId } = req.params as { id: string; videoId: string };
    try {
      const yt = await getAuthenticatedInnertube(fastify, req.user!.id);
      await yt.playlist.removeVideos(id, [videoId]);
      return reply.send({ success: true });
    } catch (err) {
      return reply.status(502).send({ success: false, error: toErrorResponse(err) });
    }
  });

  // ═══ User profile (Vidion) ════════════════════════════════════════════════

  fastify.get("/profile/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const user = await fastify.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, username: true, name: true, avatar: true,
        bio: true, verified: true, createdAt: true,
        _count: { select: { subscribers: true, subscriptions: true, videos: true } },
      },
    });

    if (!user) return reply.status(404).send({ success: false, error: { code: "NOT_FOUND", message: "User not found" } });
    return reply.send({ success: true, user });
  });

  // ═══ YouTube Account Data via YouTube Data API v3 ════════════════════════
  // NOTE: YouTube Data API v3 must be enabled in Google Cloud Console.
  // Standard Google OAuth tokens work perfectly with the Data API v3 but
  // are NOT accepted by YouTube's internal API (youtubei/v1/*).

  // ── Helper: get fresh access token for a user ────────────────────────────

  async function getYTAccessToken(userId: string): Promise<string> {
    const tokens = await getUserYouTubeTokens(fastify.prisma, userId);
    if (!tokens) throw new YouTubeAuthRequired("use YouTube features");
    return tokens.access_token;
  }

  /** YouTube Data API v3 base URL */
  const YT_API = "https://www.googleapis.com/youtube/v3";

  /** Fetch helper — throws with a clean message on non-200 */
  async function ytApi<T>(
    path: string,
    token: string,
    params: Record<string, string> = {},
    init?: RequestInit,
  ): Promise<T> {
    const url = new URL(`${YT_API}${path}`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString(), {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as any;
      throw new Error(err?.error?.message ?? `YouTube API error ${res.status}`);
    }
    if (res.status === 204) {
      return undefined as T;
    }
    return res.json() as Promise<T>;
  }

  /** Map a Data API v3 video resource to our VideoCard shape */
  function mapVideoResource(item: any): any {
    const id = item.id?.videoId ?? item.id ?? item.contentDetails?.videoId ?? "";
    const snippet = item.snippet ?? {};
    const thumbs = snippet.thumbnails;
    const thumbnail = thumbs?.maxres?.url ?? thumbs?.high?.url ?? thumbs?.medium?.url ?? thumbs?.default?.url ?? "";
    return {
      id,
      title: snippet.title ?? "",
      thumbnail,
      channelName: snippet.channelTitle ?? "",
      channelId: snippet.channelId ?? "",
      channelThumbnail: null,
      duration: item.contentDetails?.duration ?? "",
      viewCount: item.statistics?.viewCount ?? "",
      publishedAt: snippet.publishedAt ?? "",
      isLive: snippet.liveBroadcastContent === "live",
    };
  }

  /** Get video details (thumbnails + duration) for a list of video IDs */
  async function getVideoDetails(ids: string[], token: string): Promise<Map<string, any>> {
    if (!ids.length) return new Map();
    const data = await ytApi<any>("/videos", token, {
      part: "snippet,contentDetails,statistics",
      id: ids.slice(0, 50).join(","),
    });
    const map = new Map<string, any>();
    for (const item of data.items ?? []) {
      map.set(item.id, item);
    }
    return map;
  }

  // ═══ YouTube Watch History ════════════════════════════════════════════════
  // YouTube Data API v3 does NOT expose watch history — it's intentionally
  // private and only accessible via browser cookies or YouTube TV OAuth.
  // We return Vidion's own tracked history instead (videos watched on Vidion).

  fastify.get("/youtube/history", { preHandler: [fastify.requireYouTube] }, async (req, reply) => {
    try {
      // Vidion watch history grouped into a single "Recent" section
      const rows = await fastify.prisma.watchHistory.findMany({
        where: { userId: req.user!.id },
        orderBy: { watchedAt: "desc" },
        take: 100,
      });

      const videos = rows.map((r: any) => ({
        id: r.videoId,
        title: r.title ?? "",
        thumbnail: r.thumbnail ?? "",
        channelName: r.channelName ?? "",
        channelId: "",
        channelThumbnail: null,
        duration: r.duration ?? "",
        viewCount: "",
        publishedAt: new Date(r.watchedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        isLive: false,
      }));

      const sections = videos.length > 0
        ? [{ title: "Recently watched on Vidion", videos }]
        : [];

      return reply.send({
        success: true,
        sections,
        hasMore: false,
        note: "YouTube watch history is private and not available via any public Google API. Showing Vidion watch history instead.",
      });
    } catch (err) {
      fastify.log.error(err, "History fetch error");
      return reply.status(502).send({ success: false, error: toErrorResponse(err) });
    }
  });

  // ═══ YouTube Liked Videos (playlist LL) ═══════════════════════════════════

  fastify.get("/youtube/liked", { preHandler: [fastify.requireYouTube] }, async (req, reply) => {
    try {
      const token = await getYTAccessToken(req.user!.id);

      // LL = the user's Liked Videos playlist (fixed ID)
      const data = await ytApi<any>("/playlistItems", token, {
        part: "snippet,contentDetails",
        playlistId: "LL",
        maxResults: "50",
      });

      const ids = (data.items ?? []).map((i: any) => i.contentDetails?.videoId).filter(Boolean);
      const details = await getVideoDetails(ids, token);

      const videos = (data.items ?? []).map((item: any) => {
        const id = item.contentDetails?.videoId ?? "";
        const det = details.get(id);
        return mapVideoResource(det ?? { id, snippet: item.snippet, contentDetails: item.contentDetails });
      }).filter((v: any) => v.id);

      return reply.send({ success: true, videos, total: data.pageInfo?.totalResults ?? videos.length });
    } catch (err) {
      fastify.log.error(err, "YouTube liked videos error");
      return reply.status(502).send({ success: false, error: toErrorResponse(err) });
    }
  });

  // ═══ YouTube Watch Later (playlist WL) ════════════════════════════════════

  fastify.get("/youtube/watch-later", { preHandler: [fastify.requireYouTube] }, async (req, reply) => {
    try {
      const token = await getYTAccessToken(req.user!.id);

      // WL = the user's Watch Later playlist (fixed ID)
      const data = await ytApi<any>("/playlistItems", token, {
        part: "snippet,contentDetails",
        playlistId: "WL",
        maxResults: "50",
      });

      const ids = (data.items ?? []).map((i: any) => i.contentDetails?.videoId).filter(Boolean);
      const details = await getVideoDetails(ids, token);

      const videos = (data.items ?? []).map((item: any) => {
        const id = item.contentDetails?.videoId ?? "";
        const det = details.get(id);
        return mapVideoResource(det ?? { id, snippet: item.snippet });
      }).filter((v: any) => v.id);

      return reply.send({ success: true, videos });
    } catch (err) {
      fastify.log.error(err, "YouTube watch later error");
      return reply.status(502).send({ success: false, error: toErrorResponse(err) });
    }
  });

  // ═══ YouTube Subscriptions ════════════════════════════════════════════════

  fastify.get("/youtube/subscriptions", { preHandler: [fastify.requireYouTube] }, async (req, reply) => {
    try {
      const token = await getYTAccessToken(req.user!.id);

      const data = await ytApi<any>("/subscriptions", token, {
        part: "snippet",
        mine: "true",
        maxResults: "50",
        order: "alphabetical",
      });

      const subscriptions = (data.items ?? []).map((item: any) => {
        const s = item.snippet ?? {};
        const thumbs = s.thumbnails;
        return {
          channelId: s.resourceId?.channelId ?? "",
          channelName: s.title ?? "",
          thumbnail: thumbs?.high?.url ?? thumbs?.medium?.url ?? thumbs?.default?.url ?? null,
          subscriberCount: "",
          videoCount: "",
          hasNewVideos: (item.contentDetails?.newItemCount ?? 0) > 0,
        };
      }).filter((c: any) => c.channelId);

      return reply.send({ success: true, subscriptions });
    } catch (err) {
      fastify.log.error(err, "YouTube subscriptions error");
      return reply.status(502).send({ success: false, error: toErrorResponse(err) });
    }
  });

  // ═══ YouTube Subscription Feed ════════════════════════════════════════════

  fastify.get("/youtube/feed", { preHandler: [fastify.requireYouTube] }, async (req, reply) => {
    try {
      const token = await getYTAccessToken(req.user!.id);

      // activities?home=true gives subscription feed videos
      const data = await ytApi<any>("/activities", token, {
        part: "snippet,contentDetails",
        home: "true",
        maxResults: "50",
      });

      const videoIds = (data.items ?? [])
        .filter((i: any) => i.snippet?.type === "upload")
        .map((i: any) => i.contentDetails?.upload?.videoId)
        .filter(Boolean);

      const details = await getVideoDetails(videoIds, token);

      const videos = videoIds.map((id: string) => {
        const det = details.get(id);
        return det ? mapVideoResource(det) : null;
      }).filter(Boolean);

      return reply.send({ success: true, videos });
    } catch (err) {
      fastify.log.error(err, "YouTube feed error");
      return reply.status(502).send({ success: false, error: toErrorResponse(err) });
    }
  });

  // ═══ YouTube Notifications ════════════════════════════════════════════════
  // YouTube Data API v3 does not expose notifications — return empty gracefully

  fastify.get("/youtube/notifications", { preHandler: [fastify.requireYouTube] }, async (_req, reply) => {
    return reply.send({
      success: true,
      notifications: [],
      unseenCount: 0,
      note: "YouTube notifications are not available via the YouTube Data API v3.",
    });
  });

  // ═══ YouTube Playlists ════════════════════════════════════════════════════

  fastify.get("/youtube/playlists", { preHandler: [fastify.requireYouTube] }, async (req, reply) => {
    try {
      const token = await getYTAccessToken(req.user!.id);

      const data = await ytApi<any>("/playlists", token, {
        part: "snippet,contentDetails,status",
        mine: "true",
        maxResults: "50",
      });

      const playlists = (data.items ?? []).map((p: any) => {
        const s = p.snippet ?? {};
        const thumbs = s.thumbnails;
        return {
          id: p.id ?? "",
          title: s.title ?? "",
          videoCount: p.contentDetails?.itemCount ?? 0,
          thumbnail: thumbs?.maxres?.url ?? thumbs?.high?.url ?? thumbs?.medium?.url ?? null,
          isPrivate: p.status?.privacyStatus === "private",
          lastUpdated: s.publishedAt ? new Date(s.publishedAt).toLocaleDateString() : "",
        };
      }).filter((p: any) => p.id);

      return reply.send({ success: true, playlists });
    } catch (err) {
      fastify.log.error(err, "YouTube playlists error");
      return reply.status(502).send({ success: false, error: toErrorResponse(err) });
    }
  });
};

// ─── Helper (used by videos.routes.ts) ────────────────────────────────────────

export async function getAuthenticatedInnertube(
  fastify: { prisma: any; log: any },
  userId: string
): Promise<Innertube> {
  const tokens = await getUserYouTubeTokens(fastify.prisma, userId);
  if (!tokens) throw new YouTubeAuthRequired("perform this action");

  const clientId = env.GOOGLE_CLIENT_ID || env.YOUTUBE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET || env.YOUTUBE_CLIENT_SECRET;

  // Pass a future expiry so youtubei.js never tries to refresh via YouTube TV endpoint
  const safeExpiry = new Date(Date.now() + 55 * 60 * 1000).toISOString();

  const yt = await Innertube.create();
  await yt.session.signIn({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: safeExpiry,
    token_type: tokens.token_type ?? "Bearer",
    scope: tokens.scope ?? "",
    client: clientId && clientSecret
      ? { client_id: clientId, client_secret: clientSecret }
      : undefined,
  });

  return yt;
}

export default userRoutes;
