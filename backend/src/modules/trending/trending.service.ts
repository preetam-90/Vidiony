/**
 * Trending service — reads from PostgreSQL cache (refreshed every 6h by BullMQ).
 * Falls back to live YouTube data when the DB is empty.
 */

import type { PrismaClient } from "@prisma/client";
import { getInnertube } from "../../innertube.js";
import { setCachedData, getCachedData } from "../../services/cache.service.js";

export type TrendingCategory = "TRENDING" | "MUSIC" | "GAMING" | "MOVIES" | "NEWS";

export interface TrendingItem {
  id: string;
  title: string;
  thumbnail: string;
  channelName: string;
  channelId: string;
  channelThumb: string | null;
  viewCount: string;
  publishedAt: string;
  duration: string;
  rank: number;
}

export interface TrendingResponse {
  category: TrendingCategory;
  lastUpdated: Date | null;
  videos: TrendingItem[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getText(val: unknown): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  const obj = val as Record<string, unknown>;
  if (typeof obj.text === "string") return obj.text;
  if (Array.isArray(obj.runs)) return (obj.runs as any[]).map((r) => r.text ?? "").join("");
  return "";
}

function getThumbnailUrl(thumbnails: any[]): string {
  if (!Array.isArray(thumbnails) || thumbnails.length === 0) return "";
  return thumbnails.at(-1)?.url ?? thumbnails[0]?.url ?? "";
}

function getVideoId(item: any): string | null {
  return item?.id ?? item?.videoId ?? item?.video?.id ?? item?.endpoint?.payload?.videoId ?? null;
}

// ─── Live fetch from YouTube ──────────────────────────────────────────────────

async function fetchCategoryVideos(
  category: TrendingCategory
): Promise<Array<Omit<TrendingItem, "rank"> & { rawData: object }>> {
  const yt = await getInnertube();

  let rawVideos: any[] = [];

  try {
    if (category === "TRENDING") {
      const trending = await yt.getTrending();
      rawVideos = trending.videos ?? [];
    } else {
      const trending = await yt.getTrending();
      const sectionMap: Record<TrendingCategory, string> = {
        TRENDING: "Now",
        MUSIC: "Music",
        GAMING: "Gaming",
        MOVIES: "Movies",
        NEWS: "News",
      };

      // Try to find the matching tab
      const tabName = sectionMap[category];
      const tabs = (trending as any).tabs ?? [];
      const tab = tabs.find((t: any) =>
        getText(t.title).toLowerCase().includes(tabName.toLowerCase())
      );

      rawVideos = tab?.content?.videos ?? tab?.videos ?? [];

      // Fallback: search for category
      if (rawVideos.length === 0) {
        const query = `trending ${tabName.toLowerCase()} 2025`;
        const results = await yt.search(query, { sort_by: "view_count" });
        rawVideos = results.results ?? [];
      }
    }
  } catch (err) {
    console.error(`[TrendingService] Error fetching ${category}:`, (err as Error).message);
  }

  return rawVideos
    .filter((v: any) => getVideoId(v))
    .slice(0, 50)
    .map((v: any) => ({
      id: getVideoId(v)!,
      title: getText(v.title),
      thumbnail: getThumbnailUrl(v.thumbnails ?? []),
      channelName: getText(v.author?.name ?? v.author),
      channelId: v.author?.id ?? "",
      channelThumb: v.author?.thumbnails?.[0]?.url ?? null,
      viewCount: getText(v.view_count ?? v.short_view_count),
      publishedAt: getText(v.published),
      duration: getText(v.duration),
      rawData: JSON.parse(JSON.stringify(v)),
    }));
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getTrending(
  prisma: PrismaClient,
  category: TrendingCategory,
  region?: string
): Promise<TrendingResponse> {
  const cacheKey = `trending:${category}:${region ?? "US"}`;
  const cached = await getCachedData<TrendingResponse>(cacheKey);
  if (cached) return cached;

  // Read from DB
  const rows = await prisma.trendingVideo.findMany({
    where: { category },
    orderBy: { rank: "asc" },
  });

  if (rows.length > 0) {
    const response: TrendingResponse = {
      category,
      lastUpdated: rows[0]?.updatedAt ?? null,
      videos: rows.map((r) => ({
        id: r.id,
        title: r.title,
        thumbnail: r.thumbnail,
        channelName: r.channelName,
        channelId: r.channelId,
        channelThumb: r.channelThumb,
        viewCount: r.viewCount,
        publishedAt: r.publishedAt,
        duration: r.duration,
        rank: r.rank,
      })),
    };

    await setCachedData(cacheKey, response, 600); // cache 10 min
    return response;
  }

  // DB empty — fetch live and store
  const liveVideos = await fetchCategoryVideos(category);
  if (liveVideos.length > 0) {
    await storeTrendingVideos(prisma, category, liveVideos);
  }

  const response: TrendingResponse = {
    category,
    lastUpdated: new Date(),
    videos: liveVideos.map((v, i) => ({ ...v, rank: i + 1 })),
  };

  await setCachedData(cacheKey, response, 600);
  return response;
}

/** Called by the BullMQ job to refresh all categories. */
export async function refreshAllTrending(prisma: PrismaClient): Promise<void> {
  const categories: TrendingCategory[] = ["TRENDING", "MUSIC", "GAMING", "MOVIES", "NEWS"];

  for (const category of categories) {
    try {
      console.log(`[TrendingService] Refreshing ${category}…`);
      const videos = await fetchCategoryVideos(category);
      if (videos.length > 0) {
        await storeTrendingVideos(prisma, category, videos);
      }
      // Invalidate Redis cache
      const cacheKey = `trending:${category}:US`;
      const { getRedis } = await import("../../plugins/redis.js");
      await getRedis()?.del(cacheKey);
    } catch (err) {
      console.error(`[TrendingService] Failed to refresh ${category}:`, (err as Error).message);
    }
  }
}

async function storeTrendingVideos(
  prisma: PrismaClient,
  category: TrendingCategory,
  videos: Array<Omit<TrendingItem, "rank"> & { rawData: object }>
): Promise<void> {
  // Upsert each video
  await prisma.$transaction(
    videos.map((v, i) =>
      prisma.trendingVideo.upsert({
        where: { id: v.id },
        create: { ...v, category, rank: i + 1 },
        update: {
          title: v.title,
          thumbnail: v.thumbnail,
          channelName: v.channelName,
          channelId: v.channelId,
          channelThumb: v.channelThumb,
          viewCount: v.viewCount,
          publishedAt: v.publishedAt,
          duration: v.duration,
          category,
          rank: i + 1,
          rawData: v.rawData,
        },
      })
    )
  );
}
