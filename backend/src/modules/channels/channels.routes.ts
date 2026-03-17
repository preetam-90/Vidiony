/**
 * Channel routes — /channels
 *
 * GET /channels/:id            — channel info
 * GET /channels/:id/videos     — channel video list (paginated)
 * GET /channels/:id/playlists  — channel playlists
 * GET /channels/:id/popular    — channel videos sorted by viewCount
 * GET /channels/:id/about      — channel about info with joinedDate
 */

import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { getInnertube } from "../../innertube.js";
import { getCachedData, setCachedData } from "../../services/cache.service.js";
import { toErrorResponse } from "../../utils/errors.js";
import { getUserYouTubeTokens } from "../auth/auth.service.js";

const ChannelIdSchema = z.object({
  id: z.string().min(1, "Channel ID is required"),
});

const ChannelVideosQuerySchema = z.object({
  tab: z.enum(["videos", "shorts", "live", "playlists"]).default("videos"),
  sort: z.enum(["date", "popular"]).default("date"),
  continuation: z.string().optional(),
});

function getText(val: unknown): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  const obj = val as any;
  if (obj.simpleText) return obj.simpleText;
  if (typeof obj.text === "string") return obj.text;
  if (Array.isArray(obj.runs)) return obj.runs.map((r: any) => r.text ?? "").join("");
  if (obj.accessibility?.accessibilityData?.label) return obj.accessibility.accessibilityData.label;
  return "";
}

type ContinuationSource = {
  getContinuation: () => Promise<unknown>;
};

type ContinuationState = {
  channelId: string;
  tab: string;
  source: ContinuationSource;
  expiresAt: number;
};

const CHANNEL_CONTINUATION_TTL_MS = 10 * 60 * 1000;
const channelContinuationState = new Map<string, ContinuationState>();

function pruneChannelContinuationState() {
  const now = Date.now();
  for (const [token, state] of channelContinuationState.entries()) {
    if (state.expiresAt <= now) {
      channelContinuationState.delete(token);
    }
  }
}

function rememberContinuationState(
  token: string | null,
  source: unknown,
  channelId: string,
  tab: string
) {
  if (!token) return;
  if (!source || typeof (source as { getContinuation?: unknown }).getContinuation !== "function") return;

  pruneChannelContinuationState();

  channelContinuationState.set(token, {
    channelId,
    tab,
    source: source as ContinuationSource,
    expiresAt: Date.now() + CHANNEL_CONTINUATION_TTL_MS,
  });
}

function getStoredContinuationSource(token: string, channelId: string, tab: string): ContinuationSource | null {
  pruneChannelContinuationState();
  const state = channelContinuationState.get(token);
  if (!state) return null;
  if (state.channelId !== channelId || state.tab !== tab) return null;
  return state.source;
}

const channelRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /channels/:id
  fastify.get("/:id", async (req, reply) => {
    const parsed = ChannelIdSchema.safeParse(req.params);
    if (!parsed.success) {
      return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid channel ID" } });
    }

    const { id } = parsed.data;
    const { nocache } = req.query as { nocache?: string };
    const cacheKey = `channel:${id}`;
    if (nocache !== "true") {
      const cached = await getCachedData(cacheKey);
      if (cached) {
        reply.header("X-Cache", "HIT");
        return reply.send(cached);
      }
    }

    try {
      const yt = await getInnertube();
      const ch = await yt.getChannel(id);

      const meta = ch.metadata as any;
      const header = (ch as any).header as any;
      const c4Header = header?.c4TabbedHeader as any;

      // Debug: Log what YouTube API returns
      console.log('[Channel Debug] YouTube API response:', {
        id,
        headerKeys: header ? Object.keys(header) : 'no header',
        hasBanner: !!header?.banner,
        bannerThumbnails: header?.banner?.thumbnails,
        c4HeaderKeys: c4Header ? Object.keys(c4Header) : 'no c4Header',
      });

      const channel = {
        id,
        name: getText(meta?.title ?? header?.title),
        handle: meta?.custom_url ?? header?.channel_handle_text ?? "",
        description: getText(meta?.description),
        thumbnails: (meta?.thumbnail ?? []).map((t: any) => ({
          url: t.url, width: t.width ?? 0, height: t.height ?? 0,
        })),
        banners: (header?.banner?.thumbnails ?? []).map((t: any) => ({
          url: t.url, width: t.width ?? 0, height: t.height ?? 0,
        })),
        subscriberCount: getText(
          c4Header?.subscriberCount ??
          header?.subscriberCount ??
          header?.subscriber_count ??
          meta?.subscriber_count ??
          meta?.viewCount ??
          ""
        ),
        videoCount: getText(c4Header?.videosCount),
        isVerified: header?.badges?.some((b: any) =>
          getText(b.tooltip).toLowerCase().includes("verified")
        ) ?? false,
        links: (meta?.external_accounts ?? []).map((a: any) => ({
          title: getText(a.platform_name),
          url: a.profile_url ?? "",
        })),
        tabs: (ch as any).tabs?.map((t: any) => getText(t.title).toLowerCase()) ?? [],
      };

      const response = { success: true, channel };
      await setCachedData(cacheKey, response, 14_400); // 4h
      reply.header("Cache-Control", "public, s-maxage=14400");
      return reply.send(response);
    } catch (err) {
      fastify.log.error(err, `Channel fetch error: ${id}`);
      const e = toErrorResponse(err);
      return reply.status(502).send({ success: false, error: e });
    }
  });

  // GET /channels/:id/videos
  fastify.get("/:id/videos", async (req, reply) => {
    const idParsed = ChannelIdSchema.safeParse(req.params);
    const qParsed = ChannelVideosQuerySchema.safeParse(req.query);

    if (!idParsed.success || !qParsed.success) {
      return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid params" } });
    }

    const { id } = idParsed.data;
    const { tab, continuation } = qParsed.data;
    const cacheKey = `channel:${id}:${tab}:${continuation ?? "first"}`;

    const cached = await getCachedData(cacheKey);
    if (cached) {
      const cachedContinuation =
        typeof (cached as { continuation?: unknown }).continuation === "string"
          ? (cached as { continuation: string }).continuation
          : null;

      // First page cache can contain stale continuation tokens. If we don't have
      // live continuation state for that token, refresh from YouTube instead.
      if (!continuation && cachedContinuation) {
        const hasLiveContinuationState = !!getStoredContinuationSource(cachedContinuation, id, tab);
        if (!hasLiveContinuationState) {
          // Fall through to fresh fetch and state hydration.
        } else {
          reply.header("X-Cache", "HIT");
          return reply.send(cached);
        }
      } else {
        reply.header("X-Cache", "HIT");
        return reply.send(cached);
      }
    }

    try {
      const yt = await getInnertube();
      const ch = await yt.getChannel(id);

      // Recursive helper to find continuation token string
      function findContinuation(obj: any): string | null {
        if (!obj || typeof obj !== "object") return null;
        if (typeof obj.continuation === "string") return obj.continuation;
        if (typeof obj.token === "string") return obj.token;
        if (typeof obj.continuationToken === "string") return obj.continuationToken;

        if (Array.isArray(obj)) {
          for (const el of obj) {
            const found = findContinuation(el);
            if (found) return found;
          }
        } else {
          for (const key of Object.keys(obj)) {
            // Avoid recursing into some massive objects if possible, but keep it thorough
            if (key === "session" || key === "loading") continue;
            const found = findContinuation(obj[key]);
            if (found) return found;
          }
        }
        return null;
      }

      const getInitialTabData = async () => {
        if (tab === "videos") return await (ch as any).getVideos?.();
        if (tab === "shorts") return await (ch as any).getShorts?.();
        if (tab === "live") return await (ch as any).getLiveStreams?.();
        if (tab === "playlists") return await (ch as any).getPlaylists?.();
        return null;
      };

      const resolveContinuationFromTabWalk = async (targetToken: string) => {
        let pageObj: any = await getInitialTabData();
        let steps = 0;

        while (pageObj && typeof pageObj.getContinuation === "function" && steps < 8) {
          const pageToken = findContinuation(pageObj);
          rememberContinuationState(pageToken, pageObj, id, tab);

          if (!pageToken) return null;
          if (pageToken === targetToken) {
            return await pageObj.getContinuation();
          }

          pageObj = await pageObj.getContinuation();
          steps += 1;
        }

        return null;
      };

      // Get the right tab - store for pagination
      let tabData: any;

      if (continuation) {
        // Use continuation token to get more videos
        try {
          const storedSource = getStoredContinuationSource(continuation, id, tab);

          if (storedSource) {
            tabData = await storedSource.getContinuation();
          } else {
            tabData = await resolveContinuationFromTabWalk(continuation);
          }

          if (!tabData && typeof (yt as any).getContinuation === "function") {
            tabData = await (yt as any).getContinuation(continuation);
          } else if (!tabData && typeof (yt as any).getContinuationFromToken === "function") {
            tabData = await (yt as any).getContinuationFromToken(continuation);
          }

          if (!tabData) {
            throw new Error("Continuation data not found");
          }
        } catch (err) {
          fastify.log.warn(`Continuation fetch failed for ${tab}:`, (err as any)?.message);
          return reply.status(500).send({ success: false, error: { code: "CONTINUATION_ERROR", message: "Failed to load more videos" }, items: [], continuation: null });
        }
      } else {
        tabData = await getInitialTabData();
      }

      // Extract items from response - handle different response structures
      let rawItems: any[] = [];
      
      // Try different property names based on response structure
      if (Array.isArray(tabData?.videos)) {
        rawItems = tabData.videos;
      } else if (Array.isArray(tabData?.items)) {
        rawItems = tabData.items;
      } else if (Array.isArray(tabData?.playlists)) {
        rawItems = tabData.playlists;
      } else if (Array.isArray((tabData as any)?.contents)) {
        rawItems = (tabData as any).contents;
      } else if (Array.isArray(tabData)) {
        // Sometimes the response is directly an array
        rawItems = tabData;
      } else {
        // Last resort: try to find any array in the response
        for (const key of Object.keys(tabData || {})) {
          if (Array.isArray((tabData as any)[key]) && (tabData as any)[key].length > 0) {
            const firstItem = (tabData as any)[key][0];
            // Check if this looks like a video/playlist item
            if (firstItem?.id || firstItem?.videoId || firstItem?.playlistId) {
              rawItems = (tabData as any)[key];
              break;
            }
          }
        }
      }

      const items = rawItems
        .map((v: any) => {
          const id = v.id ?? v.videoId ?? v.video_id ?? v.playlist_id ?? v.playlistId;
          if (!id) return null;

          const isPlaylist = !!v.playlist_id || !!v.playlistId || v.type === 'Playlist' || v.constructor.name === 'Playlist';

          return {
            type: isPlaylist ? "playlist" : "video",
            id: String(id),
            title: getText(v.title),
            thumbnail: v.thumbnails?.at(-1)?.url ?? v.thumbnails?.[0]?.url ?? v.thumbnail?.url ?? v.thumbnail?.thumbnails?.[0]?.url ?? "",
            duration: getText(v.duration ?? v.length_text ?? v.lengthText),
            viewCount: getText(v.view_count ?? v.short_view_count ?? v.views),
            publishedAt: getText(v.published ?? v.published_time_text ?? v.publishedText),
            videoCount: v.video_count ?? v.videoCount ?? null,
          };
        })
        .filter(Boolean);

      const response = {
        success: true,
        channelId: id,
        tab,
        items,
        continuation: findContinuation(tabData),
      };

      rememberContinuationState(response.continuation, tabData, id, tab);

      await setCachedData(cacheKey, response, 600); // Reduce to 10m for now
      reply.header("Cache-Control", "public, s-maxage=3600");
      return reply.send(response);
    } catch (err) {
      fastify.log.error(err, `Channel videos error: ${id}`);
      const e = toErrorResponse(err);
      return reply.status(502).send({ success: false, error: e });
    }
  });

  // GET /channels/:id/popular — videos sorted by viewCount
  fastify.get("/:id/popular", async (req, reply) => {
    const idParsed = ChannelIdSchema.safeParse(req.params);
    if (!idParsed.success) return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid channel ID" } });
    const id = idParsed.data.id;

    const cacheKey = `channel:${id}:popular`;
    const cached = await getCachedData(cacheKey);
    if (cached) {
      reply.header("X-Cache", "HIT");
      return reply.send(cached);
    }

    try {
      const yt = await getInnertube();
      const ch = await yt.getChannel(id);
      const tabData = await (ch as any).getVideos?.();
      const rawItems: any[] = tabData?.videos ?? tabData?.items ?? (tabData as any).contents ?? [];

      // Parse view count for sorting (extract numeric value from "1.2M views" etc)
      const parseViewCount = (str: string): number => {
        if (!str) return 0;
        const normalised = str.toLowerCase().replace(/views?/g, "").replace(/,/g, "").trim();
        const match = normalised.match(/^([\d.]+)([kmb])?$/);
        if (!match) {
          const n = Number(normalised);
          return isNaN(n) ? 0 : n;
        }
        const num = Number(match[1]);
        const mult = match[2] === "k" ? 1_000 : match[2] === "m" ? 1_000_000 : match[2] === "b" ? 1_000_000_000 : 1;
        return num * mult;
      };

      const items = rawItems
        .map((v: any) => {
          const vidId = v.id ?? v.videoId ?? v.video_id;
          if (!vidId) return null;

          return {
            id: String(vidId),
            title: getText(v.title),
            thumbnail: v.thumbnails?.at(-1)?.url ?? v.thumbnails?.[0]?.url ?? v.thumbnail?.url ?? "",
            duration: getText(v.duration ?? v.length_text),
            viewCount: getText(v.view_count ?? v.short_view_count),
            viewCountNum: parseViewCount(getText(v.view_count ?? v.short_view_count)),
            publishedAt: getText(v.published ?? v.published_time_text),
          };
        })
        .filter(Boolean)
        .sort((a: any, b: any) => b.viewCountNum - a.viewCountNum)
        .map(({ viewCountNum, ...rest }: any) => rest);

      const response = { success: true, channelId: id, items };
      await setCachedData(cacheKey, response, 600); // 10m
      reply.header("Cache-Control", "public, s-maxage=3600");
      return reply.send(response);
    } catch (err) {
      fastify.log.error(err, `Channel popular error: ${id}`);
      return reply.status(502).send({ success: false, error: toErrorResponse(err) });
    }
  });

  // GET /channels/:id/about — channel about info with joinedDate
  fastify.get("/:id/about", async (req, reply) => {
    const idParsed = ChannelIdSchema.safeParse(req.params);
    if (!idParsed.success) return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid channel ID" } });
    const id = idParsed.data.id;

    const cacheKey = `channel:${id}:about`;
    const cached = await getCachedData(cacheKey);
    if (cached) {
      reply.header("X-Cache", "HIT");
      return reply.send(cached);
    }

    try {
      const yt = await getInnertube();
      const ch = await yt.getChannel(id);

      const meta = ch.metadata as any;
      const header = (ch as any).header as any;
      const c4Header = header?.c4TabbedHeader as any;

      const about = {
        description: getText(meta?.description),
        subscriberCount: getText(c4Header?.subscriberCount),
        videoCount: getText(c4Header?.videosCount),
        totalViewCount: getText(meta?.viewCount),
        joinedDate: meta?.joinedDate ?? null,
        links: (meta?.external_accounts ?? []).map((a: any) => ({
          title: getText(a.platform_name),
          url: a.profile_url ?? "",
        })),
        country: meta?.country ?? null,
      };

      const response = { success: true, channelId: id, about };
      await setCachedData(cacheKey, response, 14_400); // 4h
      reply.header("Cache-Control", "public, s-maxage=14400");
      return reply.send(response);
    } catch (err) {
      fastify.log.error(err, `Channel about error: ${id}`);
      return reply.status(502).send({ success: false, error: toErrorResponse(err) });
    }
  });

  // GET /channels/:id/playlists  — convenience wrapper
  fastify.get("/:id/playlists", async (req, reply) => {
    const idParsed = ChannelIdSchema.safeParse(req.params);
    if (!idParsed.success) return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid channel ID" } });
    const id = idParsed.data.id;

    try {
      const yt = await getInnertube();
      const ch = await yt.getChannel(id);
      const tabData = await (ch as any).getPlaylists?.();
      const rawItems: any[] = tabData?.playlists ?? tabData?.items ?? [];
      const items = rawItems.map((p: any) => ({
        id: p.id ?? p.playlist_id ?? "",
        title: getText(p.title),
        thumbnail: p.thumbnails?.at(-1)?.url ?? p.thumbnails?.[0]?.url ?? "",
        videoCount: p.videoCount ?? p.video_count ?? null,
      }));
      return reply.send({ success: true, channelId: id, items });
    } catch (err) {
      fastify.log.error(err, `Channel playlists error: ${id}`);
      return reply.status(502).send({ success: false, error: toErrorResponse(err) });
    }
  });

  // Subscribe / Unsubscribe via YouTube Data API v3 (requires connected YouTube account)
  fastify.post("/:id/subscribe", { preHandler: [fastify.requireYouTube] }, async (req: any, reply) => {
    const idParsed = ChannelIdSchema.safeParse(req.params);
    if (!idParsed.success) return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid channel ID" } });
    const channelId = idParsed.data.id;

    try {
      const tokens = await getUserYouTubeTokens(fastify.prisma, req.user!.id);
      if (!tokens) return reply.status(403).send({ success: false, error: { code: "YOUTUBE_AUTH_REQUIRED", message: "Connect YouTube to subscribe" } });

      const resp = await fetch("https://www.googleapis.com/youtube/v3/subscriptions?part=snippet", {
        method: "POST",
        headers: { Authorization: `Bearer ${tokens.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ snippet: { resourceId: { kind: "youtube#channel", channelId } } }),
      });

      if (!resp.ok) {
        const body = await resp.text().catch(() => "");
        throw new Error(`YouTube subscribe failed: ${resp.status} ${body}`);
      }

      return reply.send({ success: true, subscribed: true });
    } catch (err) {
      fastify.log.error(err, `Subscribe error: ${channelId}`);
      return reply.status(502).send({ success: false, error: toErrorResponse(err) });
    }
  });

  fastify.delete("/:id/subscribe", { preHandler: [fastify.requireYouTube] }, async (req: any, reply) => {
    const idParsed = ChannelIdSchema.safeParse(req.params);
    if (!idParsed.success) return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid channel ID" } });
    const channelId = idParsed.data.id;

    try {
      const tokens = await getUserYouTubeTokens(fastify.prisma, req.user!.id);
      if (!tokens) return reply.status(403).send({ success: false, error: { code: "YOUTUBE_AUTH_REQUIRED", message: "Connect YouTube to unsubscribe" } });

      // Look up subscription id
      const lookup = await (await fetch(`https://www.googleapis.com/youtube/v3/subscriptions?part=id&mine=true&forChannelId=${encodeURIComponent(channelId)}&maxResults=1`, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      })).json() as { items?: Array<{ id: string }> };

      const subscriptionId = lookup.items?.[0]?.id;
      if (!subscriptionId) return reply.send({ success: true, unsubscribed: true });

      const delResp = await fetch(`https://www.googleapis.com/youtube/v3/subscriptions?id=${encodeURIComponent(subscriptionId)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      if (!delResp.ok) throw new Error(`YouTube unsubscribe failed: ${delResp.status}`);
      return reply.send({ success: true, unsubscribed: true });
    } catch (err) {
      fastify.log.error(err, `Unsubscribe error: ${channelId}`);
      return reply.status(502).send({ success: false, error: toErrorResponse(err) });
    }
  });
};

export default channelRoutes;
