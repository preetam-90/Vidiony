import { FastifyPluginAsync } from "fastify";
import { getInnertube } from "../innertube.js";
import { getCachedData, setCachedData } from "../services/cache.service.js";

const homeFeedRoutes: FastifyPluginAsync = async (fastify, _opts) => {
  // Helper: extract text
  function getText(val: unknown): string {
    if (!val) return "";
    if (typeof val === "string") return val;
    if (typeof val === "number") return String(val);
    if (typeof val === "object" && val !== null) {
      const obj = val as Record<string, unknown>;
      if (typeof obj.text === "string") return obj.text;
      if (typeof obj.toString === "function") {
        const s = obj.toString();
        if (s !== "[object Object]") return s;
      }
      if (Array.isArray((obj as any).runs)) {
        return ((obj as any).runs as any[]).map((r) => r.text ?? "").join("");
      }
    }
    return "";
  }

  function getThumbnails(item: unknown) {
    if (!item || !Array.isArray(item)) return [];
    return (item as any[]).map((t: any) => ({ url: t.url ?? "", width: t.width ?? 0, height: t.height ?? 0 }));
  }

  function getVideoId(item: any): string | null {
    if (!item) return null;
    return (
      item.id ??
      item.videoId ??
      item.video?.id ??
      item.endpoint?.payload?.videoId ??
      item.navigation_endpoint?.payload?.videoId ??
      null
    );
  }

  function mapToCard(v: any) {
    const id = getVideoId(v) ?? "";
    return {
      id,
      title: getText(v.title ?? v.name ?? v.headline),
      thumbnails: getThumbnails(v.thumbnails ?? v.thumbnail ?? v.thumbnail?.thumbnails ?? []),
      duration: getText(v.duration ?? v.lengthText ?? v.badges?.[0]?.label ?? ""),
      viewCount: getText(v.view_count ?? v.short_view_count ?? v.views ?? ""),
      publishedAt: getText(v.published ?? v.publishedTimeText ?? v.publishedText ?? ""),
      channelName: getText(v.author?.name ?? v.channel ?? v.owner?.name ?? ""),
      channelId: (v.author?.id ?? v.channelId ?? v.owner?.id) ?? "",
      channelThumbnail: v.author?.thumbnails?.[0]
        ? { url: v.author.thumbnails[0].url, width: v.author.thumbnails[0].width ?? 0, height: v.author.thumbnails[0].height ?? 0 }
        : null,
    };
  }

  // Recursively find continuation token strings in the response object
  function findContinuation(obj: any): string | null {
    if (!obj || typeof obj !== "object") return null;
    if (typeof obj.continuation === "string") return obj.continuation;
    if (typeof obj.token === "string") return obj.token;
    if (typeof obj.continuationToken === "string") return obj.continuationToken;
    // Arrays
    if (Array.isArray(obj)) {
      for (const el of obj) {
        const found = findContinuation(el);
        if (found) return found;
      }
    } else {
      for (const key of Object.keys(obj)) {
        const v = obj[key];
        if (typeof v === "string" && /[A-Za-z0-9_-]{10,}/.test(v) && key.toLowerCase().includes("cont")) return v;
        const found = findContinuation(v);
        if (found) return found;
      }
    }
    return null;
  }

  // Normalize a youtubei.js feed/section object into { title, videos[] }
  function normalizeSection(item: any) {
    const title = getText(item.header?.title ?? item.title ?? item.sectionTitle ?? item.name ?? item.label ?? "");

    // potential video containers
    const candidates = item.contents ?? item.items ?? item.playlist ?? item.videos ?? item.items?.[0]?.contents ?? [];
    const rawVideos: any[] = Array.isArray(candidates) ? candidates : [];

    // Sometimes items are wrapped in { content } or { video } wrappers
    const videos = rawVideos
      .map((rv) => rv.content ?? rv.video ?? rv)
      .filter((x) => getVideoId(x))
      .map(mapToCard);

    return { title: title || "", videos };
  }

  // Main endpoint
  fastify.get("/home-feed", { preHandler: fastify.optionalAuthenticate }, async (request, reply) => {
    const { continuation } = request.query as { continuation?: string };
    const user = (request as any).user;

    try {
      const yt = await getInnertube();

      // Continuation fetch — prefer to fetch directly using the library continuation
      if (continuation) {
        let pageObj: any = null;
        try {
          // library supports getContinuation on the Innertube instance
          if (typeof (yt as any).getContinuation === "function") {
            pageObj = await (yt as any).getContinuation(continuation);
          } else if (typeof (yt as any).getContinuationFromToken === "function") {
            pageObj = await (yt as any).getContinuationFromToken(continuation);
          } else {
            // fallback: attempt to call getHomeFeed().getContinuation if available
            throw new Error("Continuation API not available");
          }
        } catch (err) {
          fastify.log.warn("Continuation fetch failed:", (err as any)?.message);
          return reply.status(500).send({ sections: [], continuationToken: null });
        }

        // pageObj may contain contents/sections — normalize
        const sections: any[] = [];
        const root = pageObj.contents ?? pageObj.items ?? pageObj;
        if (Array.isArray(root)) {
          for (const it of root) {
            const s = normalizeSection(it);
            if (s.videos.length) sections.push(s);
          }
        } else {
          const s = normalizeSection(root);
          if (s.videos.length) sections.push(s);
        }

        const cont = findContinuation(pageObj) ?? null;
        reply.header("Cache-Control", "private, max-age=0, s-maxage=60");
        return reply.send({ sections, continuationToken: cont });
      }

      // No continuation -> initial load
      if (!user) {
        // Guest user — try cached guest feed
        const cacheKey = `home:guest`;
        const cached = await getCachedData<any>(cacheKey);
        if (cached) {
          reply.header("Cache-Control", "public, s-maxage=600, stale-while-revalidate=1200");
          return reply.send(cached);
        }

        // Fetch trending + a few supplementary searches to create sections
        const sections: any[] = [];

        try {
          const trending = await yt.getTrending();
          const trendingVideos = (trending.videos ?? []).map((v: any) => mapToCard(v)).filter((v: any) => v.id);
          if (trendingVideos.length) sections.push({ title: "Trending", videos: trendingVideos });
        } catch (e) {
          fastify.log.warn("getTrending failed:", (e as any)?.message);
        }

        try {
          const music = await yt.search("music hits 2025");
          const mv = (music.results ?? []).map((v: any) => mapToCard(v)).filter((v: any) => v.id);
          if (mv.length) sections.push({ title: "Music", videos: mv.slice(0, 12) });
        } catch (e) {
          fastify.log.warn("music search failed:", (e as any)?.message);
        }

        try {
          const news = await yt.search("latest news 2025");
          const nv = (news.results ?? []).map((v: any) => mapToCard(v)).filter((v: any) => v.id);
          if (nv.length) sections.push({ title: "News", videos: nv.slice(0, 12) });
        } catch (e) {
          fastify.log.warn("news search failed:", (e as any)?.message);
        }

        const result = { sections, continuationToken: findContinuation(sections) ?? null };
        await setCachedData(cacheKey, result, 600);
        reply.header("Cache-Control", "public, s-maxage=600, stale-while-revalidate=1200");
        return reply.send(result);
      }

      // Logged-in Vidion user — personalized feed
      const cacheKey = `home:user:${user.id}`;
      const cachedUser = await getCachedData<any>(cacheKey);
      if (cachedUser) {
        reply.header("Cache-Control", "private, s-maxage=120");
        return reply.send(cachedUser);
      }

      // Fetch personalized home feed
      let homeFeed: any = null;
      try {
        homeFeed = await yt.getHomeFeed();
      } catch (err) {
        fastify.log.warn("getHomeFeed failed:", (err as any)?.message);
      }

      const sections: any[] = [];
      if (homeFeed) {
        const root = homeFeed.contents ?? homeFeed.sections ?? homeFeed.items ?? homeFeed;
        const items = Array.isArray(root) ? root : [root];
        for (const it of items) {
          const s = normalizeSection(it);
          if (s.videos.length) sections.push(s);
        }
      }

      const result = { sections, continuationToken: findContinuation(homeFeed) ?? null };
      await setCachedData(cacheKey, result, 120); // cache per-user briefly
      reply.header("Cache-Control", "private, s-maxage=120");
      return reply.send(result);
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ sections: [], continuationToken: null });
    }
  });
};

export default homeFeedRoutes;
