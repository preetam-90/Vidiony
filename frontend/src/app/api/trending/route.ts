/**
 * GET /api/trending?region=IN&category=trending
 *
 * Fetches trending/popular videos using youtubei.js search as a fallback
 * since the getTrending() endpoint is broken in youtubei.js v16.
 * Uses multiple search queries sorted by view count to simulate trending.
 */

import { NextRequest, NextResponse } from "next/server";
import { Innertube } from "youtubei.js";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrendingVideoData {
  videoId: string;
  title: string;
  channelName: string;
  channelId: string;
  channelThumbnail: string;
  thumbnail: string;
  viewCount: string;
  publishedAt: string;
  duration: string;
  category: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getText(val: unknown): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  const obj = val as Record<string, unknown>;
  if (typeof obj.text === "string") return obj.text;
  if (Array.isArray(obj.runs))
    return (obj.runs as Array<{ text?: string }>).map((r) => r.text ?? "").join("");
  return String(val);
}

function getBestThumb(thumbnails: unknown): string {
  if (!Array.isArray(thumbnails) || thumbnails.length === 0) return "";
  const sorted = [...thumbnails].sort(
    (a: any, b: any) => (b.width ?? 0) - (a.width ?? 0)
  );
  return sorted[0]?.url ?? "";
}

function parseViewCount(viewStr: string): number {
  if (!viewStr) return 0;
  const cleaned = viewStr.replace(/[^\d]/g, "");
  return parseInt(cleaned, 10) || 0;
}

function formatViewCount(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B views`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K views`;
  return `${n} views`;
}

// ─── Search queries per category ──────────────────────────────────────────────

const CATEGORY_QUERIES: Record<string, string[]> = {
  trending: ["new release", "viral video", "breaking news today"],
  music: ["new song", "music video official", "latest album release"],
  gaming: ["gaming highlights", "new game trailer", "esports tournament"],
  movies: ["movie trailer official", "new film release", "movie review"],
  news: ["breaking news today", "news headlines", "latest update live"],
};

const REGION_LANG: Record<string, { location: string; lang: string }> = {
  IN: { location: "IN", lang: "hi" },
  US: { location: "US", lang: "en" },
  GB: { location: "GB", lang: "en" },
  JP: { location: "JP", lang: "ja" },
  DE: { location: "DE", lang: "de" },
  FR: { location: "FR", lang: "fr" },
  BR: { location: "BR", lang: "pt" },
  CA: { location: "CA", lang: "en" },
  AU: { location: "AU", lang: "en" },
  KR: { location: "KR", lang: "ko" },
};

// ─── In-memory cache ──────────────────────────────────────────────────────────

const cache = new Map<string, { data: TrendingVideoData[]; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// ─── Innertube singleton ──────────────────────────────────────────────────────

const ytInstances = new Map<string, Innertube>();

async function getYT(region: string): Promise<Innertube> {
  const config = REGION_LANG[region] ?? { location: region, lang: "en" };
  const key = `${config.location}-${config.lang}`;

  if (!ytInstances.has(key)) {
    const yt = await Innertube.create({
      retrieve_player: false,
      location: config.location,
      lang: config.lang,
    });
    ytInstances.set(key, yt);
  }
  return ytInstances.get(key)!;
}

// ─── Fetch trending via search ────────────────────────────────────────────────

function mapVideo(v: any, category: string): TrendingVideoData | null {
  const id = v.id ?? v.videoId;
  if (!id) return null;
  const title = getText(v.title);
  if (!title) return null;

  return {
    videoId: id,
    title,
    channelName: getText(v.author?.name ?? v.author) || "Unknown",
    channelId: v.author?.id ?? v.author?.channel_id ?? "",
    channelThumbnail: v.author?.thumbnails?.[0]?.url ?? "",
    thumbnail: getBestThumb(v.thumbnails),
    viewCount: getText(v.view_count ?? v.short_view_count),
    publishedAt: getText(v.published),
    duration: getText(v.duration),
    category,
  };
}

async function fetchTrending(
  region: string,
  category: string
): Promise<TrendingVideoData[]> {
  const cacheKey = `${region}:${category}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const yt = await getYT(region);
  const queries = CATEGORY_QUERIES[category] ?? CATEGORY_QUERIES.trending;

  const allVideos: TrendingVideoData[] = [];
  const seenIds = new Set<string>();

  for (const query of queries) {
    try {
      const results = await yt.search(query, {
        sort_by: "view_count",
        upload_date: "today",
      });

      const videos = (results.results ?? []).filter(
        (v: any) => v.type === "Video"
      );

      for (const v of videos) {
        const mapped = mapVideo(v, category);
        if (mapped && !seenIds.has(mapped.videoId)) {
          seenIds.add(mapped.videoId);
          allVideos.push(mapped);
        }
      }
    } catch (err) {
      console.error(`[API/trending] Query "${query}" failed:`, (err as Error).message);
    }
  }

  // Also try "week" upload date for more content
  if (allVideos.length < 20) {
    try {
      const results = await yt.search(queries[0], {
        sort_by: "view_count",
        upload_date: "week",
      });
      const videos = (results.results ?? []).filter(
        (v: any) => v.type === "Video"
      );
      for (const v of videos) {
        const mapped = mapVideo(v, category);
        if (mapped && !seenIds.has(mapped.videoId)) {
          seenIds.add(mapped.videoId);
          allVideos.push(mapped);
        }
      }
    } catch {
      // ignore
    }
  }

  // Sort by view count (highest first)
  allVideos.sort((a, b) => {
    const aViews = parseViewCount(a.viewCount);
    const bViews = parseViewCount(b.viewCount);
    return bViews - aViews;
  });

  // Normalize view counts to English format
  const normalized = allVideos.map((v) => ({
    ...v,
    viewCount: formatViewCount(parseViewCount(v.viewCount)),
  }));

  const result = normalized.slice(0, 50);
  cache.set(cacheKey, { data: result, timestamp: Date.now() });
  return result;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const region = (searchParams.get("region") ?? "IN").toUpperCase();
  const category = (searchParams.get("category") ?? "trending").toLowerCase();

  try {
    const videos = await fetchTrending(region, category);

    return NextResponse.json(
      {
        success: true,
        videos,
        category,
        region,
        count: videos.length,
        cachedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
        },
      }
    );
  } catch (err) {
    console.error("[API/trending] Error:", (err as Error).message);

    // Try fallback to backend
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
      const res = await fetch(
        `${backendUrl}/trending?category=${category}&region=${region}`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.videos?.length > 0) {
          return NextResponse.json({
            success: true,
            videos: data.videos.map((v: any) => ({
              videoId: v.id ?? v.videoId,
              title: v.title,
              channelName: v.channelName,
              channelId: v.channelId,
              channelThumbnail: v.channelThumb ?? "",
              thumbnail: v.thumbnail,
              viewCount: v.viewCount,
              publishedAt: v.publishedAt,
              duration: v.duration,
              category,
            })),
            category,
            region,
            cachedAt: data.lastUpdated,
          });
        }
      }
    } catch {
      // Backend also failed
    }

    return NextResponse.json(
      {
        success: false,
        videos: [],
        category,
        region,
        error: "Failed to fetch trending videos",
      },
      { status: 502 }
    );
  }
}
