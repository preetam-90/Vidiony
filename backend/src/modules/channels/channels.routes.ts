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
  tab: z.enum(["videos", "shorts", "live", "playlists", "podcasts", "posts"]).default("videos"),
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

function extractCountsFromPageHeader(header: unknown): { subscriberCount: string; videoCount: string } {
   let extractedSubCount = "";
   let extractedVidCount = "";

   const h = header as {
     content?: {
       metadata?: {
         metadata_rows?: Array<{
           metadata_parts?: Array<{
             text?: { text?: string };
           }>;
         }>;
       };
     };
   } | undefined;

   if (h?.content?.metadata?.metadata_rows) {
     for (const row of h.content.metadata.metadata_rows) {
       for (const part of row.metadata_parts || []) {
         const text = part?.text?.text || "";
         if (text.toLowerCase().includes("subscriber")) {
           extractedSubCount = text;
         } else if (text.toLowerCase().includes("video")) {
           extractedVidCount = text;
         }
       }
     }
   }

   return { subscriberCount: extractedSubCount, videoCount: extractedVidCount };
}

function getChannelBannerCandidates(header: unknown): unknown[] {
   const h = header as {
     banner?: unknown;
     mobile_banner?: unknown;
     tv_banner?: unknown;
     content?: { banner?: { image?: unknown; thumbnails?: unknown } };
   } | undefined;

   const candidates = [
     (h?.banner as { thumbnails?: unknown } | undefined)?.thumbnails,
     h?.banner,
     (h?.mobile_banner as { thumbnails?: unknown } | undefined)?.thumbnails,
     h?.mobile_banner,
     (h?.tv_banner as { thumbnails?: unknown } | undefined)?.thumbnails,
     h?.tv_banner,
     h?.content?.banner?.image,
     h?.content?.banner?.thumbnails,
   ];

   return candidates.find(Array.isArray) ?? [];
}

function getNestedValue(source: unknown, path: Array<string | number>): unknown {
  return path.reduce<unknown>((current, key) => {
    if (current == null) return undefined;
    if (typeof key === "number") {
      return Array.isArray(current) ? current[key] : undefined;
    }
    if (typeof current === "object") {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, source);
}

function getArrayValue(source: unknown, paths: Array<Array<string | number>>): unknown[] {
  for (const path of paths) {
    const value = getNestedValue(source, path);
    if (Array.isArray(value) && value.length > 0) {
      return value;
    }
  }

  return [];
}

function getThumbnailUrl(item: unknown): string {
  const candidateArrays = [
    getArrayValue(item, [["thumbnails"], ["thumbnail", "thumbnails"], ["images"], ["image", "sources"]]),
    getArrayValue(item, [["attachment", "thumbnails"], ["attachment", "image", "sources"], ["content", "thumbnails"]]),
  ];

  for (const array of candidateArrays) {
    const selected = [...array].reverse().find((entry) => {
      const record = entry as Record<string, unknown>;
      return typeof record?.url === "string" && record.url.length > 0;
    });

    if (selected) {
      return (selected as { url: string }).url;
    }
  }

  return "";
}

function collectImageUrls(source: unknown, paths: Array<Array<string | number>>): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();

  const toCanonicalImageKey = (url: string): string => {
    try {
      const parsed = new URL(url);
      const file = parsed.pathname.split("/").pop() ?? parsed.pathname;
      return `${parsed.hostname}/${file}`.toLowerCase();
    } catch {
      const withoutQuery = url.split("?")[0] ?? url;
      const segments = withoutQuery.split("/");
      const file = segments[segments.length - 1] ?? withoutQuery;
      return file.toLowerCase();
    }
  };

  for (const path of paths) {
    const value = getNestedValue(source, path);
    if (!Array.isArray(value)) continue;

    for (const entry of value) {
      const url = typeof (entry as { url?: unknown })?.url === "string"
        ? ((entry as { url: string }).url ?? "").trim()
        : "";
      if (url) {
        const canonical = toCanonicalImageKey(url);
        if (!seen.has(canonical)) {
          seen.add(canonical);
          urls.push(url);
        }
      }
    }
  }

  return urls;
}

function getAuthorAvatarUrl(item: unknown): string {
  const avatarUrls = collectImageUrls(item, [
    ["author", "thumbnails"],
    ["author", "avatar", "thumbnails"],
    ["authorThumbnail", "thumbnails"],
    ["author_thumbnail", "thumbnails"],
  ]);

  return avatarUrls[0] ?? "";
}

function getPostMediaImages(item: unknown): string[] {
  return collectImageUrls(item, [
    ["attachment", "image", "sources"],
    ["attachment", "image", "thumbnails"],
    ["attachment", "thumbnails"],
    ["backstageAttachment", "image", "sources"],
    ["backstageAttachment", "image", "thumbnails"],
    ["backstageAttachment", "thumbnails"],
    ["content", "thumbnails"],
    ["images"],
    ["media", "thumbnails"],
    ["thumbnails"],
  ]);
}

function unwrapPostNode(item: unknown): Record<string, unknown> {
  let current = item as Record<string, unknown> | undefined;
  let depth = 0;

  while (current && typeof current === "object" && !Array.isArray(current) && depth < 5) {
    const next =
      (current.backstagePostRenderer as Record<string, unknown> | undefined) ??
      (current.sharedBackstagePostRenderer as Record<string, unknown> | undefined) ??
      (current.postRenderer as Record<string, unknown> | undefined) ??
      (current.backstagePostThreadRenderer as Record<string, unknown> | undefined) ??
      (current.post as Record<string, unknown> | undefined);

    if (!next || next === current) break;
    current = next;
    depth += 1;
  }

  return current && typeof current === "object" && !Array.isArray(current) ? current : {};
}

function getPostContent(item: unknown): string {
  return getText(
    getNestedValue(item, ["contentText"]) ??
    getNestedValue(item, ["content_text"]) ??
    getNestedValue(item, ["content", "content"]) ??
    getNestedValue(item, ["content"]) ??
    getNestedValue(item, ["text"]) ??
    getNestedValue(item, ["body"]) ??
    getNestedValue(item, ["description"]) ??
    getNestedValue(item, ["title"]) ??
    getNestedValue(item, ["header", "title"]) ??
    getNestedValue(item, ["snippet", "text"])
  );
}

function getPostAuthorName(item: unknown): string {
  return getText(
    getNestedValue(item, ["author", "name"]) ??
    getNestedValue(item, ["author"]) ??
    getNestedValue(item, ["authorText"]) ??
    getNestedValue(item, ["ownerText"]) ??
    getNestedValue(item, ["displayName"]) ??
    getNestedValue(item, ["channel", "name"])
  );
}

function getPostPublishedAt(item: unknown): string {
  return getText(
    getNestedValue(item, ["published"]) ??
    getNestedValue(item, ["published_time_text"]) ??
    getNestedValue(item, ["publishedText"]) ??
    getNestedValue(item, ["publishedTimeText"]) ??
    getNestedValue(item, ["timestampText"])
  );
}

function getVideoId(item: unknown): string | null {
  const obj = item as Record<string, unknown> | undefined;
  if (!obj) return null;

  const fromIdObject = obj.id as Record<string, unknown> | undefined;
  const direct =
    (typeof obj.id === "string" ? obj.id : undefined) ??
    (typeof obj.videoId === "string" ? obj.videoId : undefined) ??
    (typeof obj.video_id === "string" ? obj.video_id : undefined) ??
    (typeof fromIdObject?.videoId === "string" ? fromIdObject.videoId : undefined) ??
    (typeof fromIdObject?.video_id === "string" ? fromIdObject.video_id : undefined) ??
    (typeof getNestedValue(obj, ["video", "id"]) === "string" ? (getNestedValue(obj, ["video", "id"]) as string) : undefined) ??
    (typeof getNestedValue(obj, ["endpoint", "payload", "videoId"]) === "string" ? (getNestedValue(obj, ["endpoint", "payload", "videoId"]) as string) : undefined) ??
    (typeof getNestedValue(obj, ["navigation_endpoint", "payload", "videoId"]) === "string" ? (getNestedValue(obj, ["navigation_endpoint", "payload", "videoId"]) as string) : undefined) ??
    (typeof getNestedValue(obj, ["on_tap_endpoint", "payload", "videoId"]) === "string" ? (getNestedValue(obj, ["on_tap_endpoint", "payload", "videoId"]) as string) : undefined) ??
    (typeof getNestedValue(obj, ["watch_endpoint", "video_id"]) === "string" ? (getNestedValue(obj, ["watch_endpoint", "video_id"]) as string) : undefined) ??
    (typeof getNestedValue(obj, ["reel_watch_endpoint", "videoId"]) === "string" ? (getNestedValue(obj, ["reel_watch_endpoint", "videoId"]) as string) : undefined) ??
    (typeof obj.entity_id === "string" ? obj.entity_id : undefined) ??
    (typeof obj.entityId === "string" ? obj.entityId : undefined);

  return direct ?? null;
}

function getPlaylistId(item: unknown): string | null {
  const obj = item as Record<string, unknown> | undefined;
  if (!obj) return null;

  const fromIdObject = obj.id as Record<string, unknown> | undefined;
  const rawId =
    (typeof obj.id === "string" ? obj.id : undefined) ??
    (typeof obj.playlist_id === "string" ? obj.playlist_id : undefined) ??
    (typeof obj.playlistId === "string" ? obj.playlistId : undefined) ??
    (typeof obj.content_id === "string" ? obj.content_id : undefined) ??
    (typeof fromIdObject?.playlistId === "string" ? fromIdObject.playlistId : undefined) ??
    (typeof getNestedValue(obj, ["endpoint", "payload", "playlistId"]) === "string" ? (getNestedValue(obj, ["endpoint", "payload", "playlistId"]) as string) : undefined) ??
    (typeof getNestedValue(obj, ["navigation_endpoint", "payload", "playlistId"]) === "string" ? (getNestedValue(obj, ["navigation_endpoint", "payload", "playlistId"]) as string) : undefined) ??
    (typeof getNestedValue(obj, ["endpoint", "payload", "browseId"]) === "string" ? (getNestedValue(obj, ["endpoint", "payload", "browseId"]) as string) : undefined) ??
    (typeof getNestedValue(obj, ["navigation_endpoint", "payload", "browseId"]) === "string" ? (getNestedValue(obj, ["navigation_endpoint", "payload", "browseId"]) as string) : undefined);

  if (!rawId) return null;
  if (rawId.startsWith("VL") && rawId.length > 2) {
    return rawId.slice(2);
  }

  return rawId;
}

function getPostId(item: unknown): string | null {
  const obj = item as Record<string, unknown> | undefined;
  if (!obj) return null;

  const id =
    (typeof obj.post_id === "string" ? obj.post_id : undefined) ??
    (typeof obj.postId === "string" ? obj.postId : undefined) ??
    (typeof obj.externalPostId === "string" ? obj.externalPostId : undefined) ??
    (typeof getNestedValue(obj, ["postId"]) === "string" ? (getNestedValue(obj, ["postId"]) as string) : undefined) ??
    (typeof getNestedValue(obj, ["backstagePostRenderer", "postId"]) === "string" ? (getNestedValue(obj, ["backstagePostRenderer", "postId"]) as string) : undefined) ??
    (typeof getNestedValue(obj, ["sharedBackstagePostRenderer", "postId"]) === "string" ? (getNestedValue(obj, ["sharedBackstagePostRenderer", "postId"]) as string) : undefined) ??
    (typeof getNestedValue(obj, ["backstagePostThreadRenderer", "post", "postId"]) === "string" ? (getNestedValue(obj, ["backstagePostThreadRenderer", "post", "postId"]) as string) : undefined);

  return id ?? null;
}

function looksLikePostItem(item: unknown): boolean {
  const hasPostIdentity = !!getPostId(item);
  const text = getPostContent(item);

  const hasPostSignals =
    !!getPostPublishedAt(item) ||
    !!getPostAuthorName(item) ||
    getNestedValue(item, ["attachment"]) != null;

  return hasPostIdentity || (text.length > 0 && hasPostSignals);
}

function isCandidateForTab(item: unknown, tab: string): boolean {
  if (!item || typeof item !== "object") return false;

  if (tab === "posts") {
    const node = unwrapPostNode(item);
    const typeHint = String((node as { type?: unknown })?.type ?? (item as { type?: unknown })?.type ?? "").toLowerCase();
    const hasRenderer =
      getNestedValue(item, ["backstagePostRenderer"]) != null ||
      getNestedValue(item, ["sharedBackstagePostRenderer"]) != null ||
      getNestedValue(item, ["postRenderer"]) != null;
    return !!getPostId(node) || looksLikePostItem(node) || hasRenderer || typeHint.includes("post");
  }

  if (tab === "playlists" || tab === "podcasts") {
    const contentType = getText(getNestedValue(item, ["content_type"]))
      .toUpperCase()
      .trim();
    return !!getPlaylistId(item) || contentType === "PLAYLIST" || contentType === "PODCAST";
  }

  return !!getVideoId(item);
}

function collectDeepTabItems(source: unknown, tab: string): any[] {
  const collected: any[] = [];
  const visited = new WeakSet<object>();

  const walk = (node: unknown) => {
    if (!node || typeof node !== "object") return;

    const asObj = node as object;
    if (visited.has(asObj)) return;
    visited.add(asObj);

    if (Array.isArray(node)) {
      for (const entry of node) walk(entry);
      return;
    }

    if (isCandidateForTab(node, tab)) {
      collected.push(node);
    }

    for (const value of Object.values(node as Record<string, unknown>)) {
      if (value && typeof value === "object") walk(value);
    }
  };

  walk(source);
  return collected;
}

function toCount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const text = getText(value)
    .replace(/,/g, "")
    .replace(/likes?/gi, "")
    .replace(/comments?/gi, "")
    .replace(/replies?/gi, "")
    .trim();
  if (!text) return null;

  const compact = text.match(/([\d.]+)\s*([kmb])/i);
  if (compact) {
    const amount = Number(compact[1]);
    const unit = compact[2]?.toLowerCase();
    if (!Number.isFinite(amount)) return null;
    const multiplier = unit === "k" ? 1_000 : unit === "m" ? 1_000_000 : unit === "b" ? 1_000_000_000 : 1;
    return Math.round(amount * multiplier);
  }

  const match = text.match(/\d+/);
  if (!match) return null;

  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function getPostLikeCount(item: unknown): number | null {
  return toCount(
    getNestedValue(item, ["vote_count"]) ??
    getNestedValue(item, ["like_count"]) ??
    getNestedValue(item, ["likes"]) ??
    getNestedValue(item, ["action_buttons", "like_button", "toggle_button", "default_text"]) ??
    getNestedValue(item, ["action_buttons", "like_button", "toggle_button", "text"]) ??
    getNestedValue(item, ["likeButton", "toggleButton", "defaultText"]) ??
    getNestedValue(item, ["toolbar", "likeButton", "text"])
  );
}

function getPostCommentCount(item: unknown): number | null {
  return toCount(
    getNestedValue(item, ["reply_count"]) ??
    getNestedValue(item, ["comment_count"]) ??
    getNestedValue(item, ["comments_count"]) ??
    getNestedValue(item, ["action_buttons", "comment_button", "text"]) ??
    getNestedValue(item, ["action_buttons", "reply_button", "text"]) ??
    getNestedValue(item, ["commentButton", "text"]) ??
    getNestedValue(item, ["replyButton", "text"]) ??
    getNestedValue(item, ["toolbar", "commentButton", "text"])
  );
}

function normalizeChannelTabLabel(tab: string): string {
  const normalized = tab.trim().toLowerCase();

  if (normalized === "featured") return "home";
  if (normalized === "streams") return "live";
  if (normalized === "community") return "posts";

  return normalized;
}

function getNormalizedChannelTabs(tabs: unknown): string[] {
  if (!Array.isArray(tabs)) return [];

  return [...new Set(
    tabs
      .map((tab) => {
        if (typeof tab === "string") return normalizeChannelTabLabel(tab);
        return normalizeChannelTabLabel(getText((tab as { title?: unknown })?.title ?? tab));
      })
      .filter(Boolean)
  )];
}

function getChannelTabsWithFallback(channel: unknown): string[] {
  const ch = channel as {
    tabs?: unknown;
    has_videos?: boolean;
    has_shorts?: boolean;
    has_live_streams?: boolean;
    has_playlists?: boolean;
    has_podcasts?: boolean;
    has_community?: boolean;
  };

  const tabs = new Set(getNormalizedChannelTabs(ch?.tabs));

  tabs.add("home");
  tabs.add("about");

  if (tabs.size <= 2 || ch?.has_videos !== false) tabs.add("videos");
  if (ch?.has_shorts) tabs.add("shorts");
  if (ch?.has_live_streams) tabs.add("live");
  if (ch?.has_playlists) tabs.add("playlists");
  if (ch?.has_podcasts) tabs.add("podcasts");
  if (ch?.has_community) tabs.add("posts");

  return [...tabs];
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
    const cacheKey = `channel:v2:${id}`;
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

      const realChannelId = meta?.channelId ?? meta?.externalId ?? header?.channelId ?? c4Header?.channelId ?? id;

       const { subscriberCount: extractedSubCount, videoCount: extractedVidCount } = extractCountsFromPageHeader(header);

       const channel = {
         id: realChannelId,
         name: getText(meta?.title ?? header?.title),
         handle: meta?.custom_url ?? header?.channel_handle_text ?? "",
         description: getText(meta?.description),
         thumbnails: (meta?.thumbnail ?? []).map((t: any) => ({
           url: t.url, width: t.width ?? 0, height: t.height ?? 0,
         })),
         banners: getChannelBannerCandidates(header).map((t: any) => ({
           url: t.url, width: t.width ?? 0, height: t.height ?? 0,
         })),
         subscriberCount: (function() {
           const s = extractedSubCount || getText(
             c4Header?.subscribers ??
             header?.subscribers ??
             header?.subscriber_count ??
             meta?.subscriber_count ??
             meta?.viewCount ??
             ""
           );
           return s || "—";
         })(),
         videoCount: extractedVidCount || getText(c4Header?.videos_count),
         isVerified: header?.badges?.some((b: any) =>
           getText(b.tooltip).toLowerCase().includes("verified")
         ) ?? false,
         links: (meta?.external_accounts ?? []).map((a: any) => ({
           title: getText(a.platform_name),
           url: a.profile_url ?? "",
         })),
         tabs: getChannelTabsWithFallback(ch),
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
    const cacheKey = `channel:v4:${id}:${tab}:${continuation ?? "first"}`;

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
        if (tab === "podcasts") return await (ch as any).getPodcasts?.();
        if (tab === "posts") return await (ch as any).getCommunity?.();
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
          const initialTabData = await getInitialTabData();
          const storedSource = getStoredContinuationSource(continuation, id, tab);

          if (storedSource) {
            tabData = await storedSource.getContinuation();
          } else {
            const firstPageToken = findContinuation(initialTabData);
            if (firstPageToken) {
              rememberContinuationState(firstPageToken, initialTabData, id, tab);
            }
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

        const firstPageToken = findContinuation(tabData);
        if (firstPageToken) {
          rememberContinuationState(firstPageToken, tabData, id, tab);
        }
      }

      // Extract items from response - handle different response structures
      let rawItems: any[] = [];
      
      // Try different property names based on response structure
      if (Array.isArray(tabData?.videos)) {
        rawItems = tabData.videos;
      } else if (Array.isArray(tabData?.posts)) {
        rawItems = tabData.posts;
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
            if (getVideoId(firstItem) || getPlaylistId(firstItem) || getPostId(firstItem) || (tab === "posts" && looksLikePostItem(firstItem))) {
              rawItems = (tabData as any)[key];
              break;
            }
          }
        }
      }

      if (tab === "posts") {
        rawItems = [...rawItems, ...collectDeepTabItems(tabData, tab)];
      } else if (rawItems.length === 0) {
        rawItems = collectDeepTabItems(tabData, tab);
      }

      const seenIds = new Set<string>();

      const items = rawItems
        .map((v: any, index: number) => {
          const isPostTab = tab === "posts";
          const isPodcastTab = tab === "podcasts";
          const sourceNode = isPostTab ? unwrapPostNode(v) : v;
          const videoId = getVideoId(sourceNode);
          const playlistId = getPlaylistId(sourceNode);
          const postId = getPostId(sourceNode);
          const authorAvatar = getAuthorAvatarUrl(sourceNode);
          const mediaImages = isPostTab ? getPostMediaImages(sourceNode) : [];
          const content = isPostTab
            ? getPostContent(sourceNode)
            : getText(
                sourceNode.content ??
                sourceNode.content_text ??
                sourceNode.text ??
                sourceNode.body ??
                sourceNode.description ??
                getNestedValue(sourceNode, ["content", "content"]) ??
                getNestedValue(sourceNode, ["attachment", "content_text"])
              );

          const synthesizedPostId = isPostTab && content
            ? `post-${String(getPostPublishedAt(sourceNode) || index).replace(/\s+/g, "-")}-${content.slice(0, 24).replace(/\s+/g, "-")}`
            : null;

          const postScopedId = isPostTab
            ? (postId ? `post:${postId}` : null)
            : null;

          const id = videoId ?? playlistId ?? postScopedId ?? synthesizedPostId;
          if (!id) return null;

          const isPlaylist =
            isPodcastTab ||
            !!playlistId ||
            !!sourceNode.playlist_id ||
            !!sourceNode.playlistId ||
            sourceNode.type === "Playlist" ||
            (sourceNode.constructor as { name?: string } | undefined)?.name === "Playlist" ||
            sourceNode.content_type === "PLAYLIST" ||
            sourceNode.content_type === "PODCAST";

          const thumbnail =
            mediaImages[0] ??
            getThumbnailUrl(sourceNode) ??
            (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : "");

          return {
            type: isPostTab ? "post" : isPlaylist ? "playlist" : "video",
            id: String(id),
            title: getText(sourceNode.title) || content || (isPostTab ? "Community post" : isPodcastTab ? "Podcast" : ""),
            thumbnail,
            duration: getText(sourceNode.duration ?? sourceNode.length_text ?? sourceNode.lengthText),
            viewCount: getText(sourceNode.view_count ?? sourceNode.short_view_count ?? sourceNode.views),
            publishedAt: isPostTab ? getPostPublishedAt(sourceNode) : getText(sourceNode.published ?? sourceNode.published_time_text ?? sourceNode.publishedText),
            videoCount: sourceNode.video_count ?? sourceNode.videoCount ?? null,
            content,
            authorName: isPostTab ? getPostAuthorName(sourceNode) : getText(sourceNode.author?.name ?? sourceNode.author ?? sourceNode.channel?.name),
            authorAvatar,
            mediaImages,
            likeCount: isPostTab ? getPostLikeCount(sourceNode) : toCount(sourceNode.vote_count ?? sourceNode.like_count ?? sourceNode.likes),
            commentCount: isPostTab ? getPostCommentCount(sourceNode) : toCount(sourceNode.reply_count ?? sourceNode.comment_count ?? sourceNode.comments_count),
          };
        })
        .filter((item): item is NonNullable<typeof item> => {
          if (!item) return false;
          if (seenIds.has(item.id)) return false;
          seenIds.add(item.id);
          return true;
        });

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

       const { subscriberCount: extractedSubCount, videoCount: extractedVidCount } = extractCountsFromPageHeader(header);

       const about = {
         description: getText(meta?.description),
         subscriberCount: extractedSubCount || getText(c4Header?.subscribers),
         videoCount: extractedVidCount || getText(c4Header?.videos_count),
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
  fastify.post("/:id/subscribe", { preHandler: [fastify.authenticate] }, async (req: any, reply) => {
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

  fastify.delete("/:id/subscribe", { preHandler: [fastify.authenticate] }, async (req: any, reply) => {
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
