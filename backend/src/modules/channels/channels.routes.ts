/**
 * Channel routes — /channels
 *
 * GET /channels/:id            — channel info
 * GET /channels/:id/videos     — channel video list (paginated)
 * GET /channels/:id/playlists  — channel playlists
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
  const obj = val as Record<string, unknown>;
  if (typeof obj.text === "string") return obj.text;
  if (Array.isArray(obj.runs)) return (obj.runs as any[]).map((r) => r.text ?? "").join("");
  return "";
}

const channelRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /channels/:id
  fastify.get("/:id", async (req, reply) => {
    const parsed = ChannelIdSchema.safeParse(req.params);
    if (!parsed.success) {
      return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid channel ID" } });
    }

    const { id } = parsed.data;
    const cacheKey = `channel:${id}`;
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

      const channel = {
        id,
        name: getText(meta?.title ?? header?.title),
        handle: meta?.custom_url ?? header?.channel_handle_text ?? "",
        description: getText(meta?.description),
        thumbnails: (meta?.thumbnail ?? []).map((t: any) => ({
          url: t.url, width: t.width ?? 0, height: t.height ?? 0,
        })),
        bannerUrl: header?.banner?.thumbnails?.at(-1)?.url ?? null,
        subscriberCount: getText(header?.subscriber_count),
        videoCount: getText(header?.videos_count),
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
      reply.header("X-Cache", "HIT");
      return reply.send(cached);
    }

    try {
      const yt = await getInnertube();
      const ch = await yt.getChannel(id);

      // Get the right tab
      let tabData: any;
      if (tab === "videos") tabData = await (ch as any).getVideos?.();
      else if (tab === "shorts") tabData = await (ch as any).getShorts?.();
      else if (tab === "live") tabData = await (ch as any).getLiveStreams?.();
      else if (tab === "playlists") tabData = await (ch as any).getPlaylists?.();

      const rawItems: any[] = tabData?.videos ?? tabData?.items ?? tabData?.playlists ?? [];

      const items = rawItems.filter((v: any) => v.id ?? v.videoId ?? v.playlist_id).map((v: any) => ({
        type: v.playlist_id ? "playlist" : "video",
        id: v.id ?? v.videoId ?? v.playlist_id ?? "",
        title: getText(v.title),
        thumbnail: v.thumbnails?.at(-1)?.url ?? v.thumbnails?.[0]?.url ?? "",
        duration: getText(v.duration),
        viewCount: getText(v.view_count ?? v.short_view_count),
        publishedAt: getText(v.published),
        videoCount: v.video_count ?? null,
      }));

      const response = {
        success: true,
        channelId: id,
        tab,
        items,
        continuation: tabData?.continuation ?? null,
      };

      await setCachedData(cacheKey, response, 3600); // 1h
      reply.header("Cache-Control", "public, s-maxage=3600");
      return reply.send(response);
    } catch (err) {
      fastify.log.error(err, `Channel videos error: ${id}`);
      const e = toErrorResponse(err);
      return reply.status(502).send({ success: false, error: e });
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
      })).json();

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
