/**
 * GET /api/feed?continuation=token
 *
 * Fetches personalized user feed from the backend.
 * Uses home-feed endpoint from Fastify backend.
 */

import { NextRequest, NextResponse } from "next/server";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FeedVideo {
  id: string;
  title: string;
  thumbnails: Array<{ url: string; width: number; height: number }>;
  duration: string;
  viewCount: string;
  publishedAt: string;
  channelName: string;
  channelId: string;
  channelThumbnail: { url: string; width: number; height: number } | null;
}

interface FeedSection {
  title: string;
  videos: FeedVideo[];
}

interface FeedResponse {
  videos: FeedVideo[];
  sections: FeedSection[];
  continuationToken: string | null;
  success: boolean;
  error?: string;
}

interface BackendFeedResponse {
  sections?: unknown[];
  continuationToken?: string | null;
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

function mapVideo(v: any): FeedVideo {
  return {
    id: v.id ?? "",
    title: getText(v.title),
    thumbnails: v.thumbnails ?? [],
    duration: getText(v.duration),
    viewCount: getText(v.viewCount),
    publishedAt: getText(v.publishedAt),
    channelName: getText(v.channelName),
    channelId: v.channelId ?? "",
    channelThumbnail: v.channelThumbnail ?? null,
  };
}

function normalizeSection(item: any): FeedSection {
  const title = getText(item.title);
  const candidates = item.contents ?? item.items ?? item.videos ?? [];
  const rawVideos = Array.isArray(candidates) ? candidates : [];
  const videos = rawVideos.filter((v: any) => v.id).map(mapVideo);
  return { title: title || "", videos };
}

// ─── Fetch feed ───────────────────────────────────────────────────────────────

async function fetchFeed(continuation?: string, cookieHeader?: string): Promise<FeedResponse> {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  const url = new URL(`${backendUrl}/api/home-feed`);
  if (continuation) url.searchParams.set("continuation", continuation);

  const res = await fetch(url.toString(), {
    headers: {
      cookie: cookieHeader ?? "",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (res.status === 401) {
    throw new Error("AUTH_REQUIRED");
  }

  if (!res.ok) {
    throw new Error(`Backend returned ${res.status}`);
  }

  const data = (await res.json()) as BackendFeedResponse;
  const sections: FeedSection[] = (data.sections ?? []).map((item) => normalizeSection(item));
  const videos = sections.flatMap((section: FeedSection) => section.videos);

  return {
    videos,
    sections,
    continuationToken: data.continuationToken ?? null,
    success: true,
  };
}

// ─── Route handler ────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const continuation = searchParams.get("continuation") ?? undefined;
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? "8")));
  const cookieHeader = request.headers.get("cookie") ?? undefined;

  try {
    const feed = await fetchFeed(continuation, cookieHeader);

    const start = (page - 1) * limit;
    const pagedVideos = feed.videos.slice(start, start + limit);

    return NextResponse.json(
      {
        success: true,
        videos: pagedVideos,
        sections: feed.sections,
        continuationToken: feed.continuationToken,
        count: feed.videos.length,
      },
      {
        headers: {
          "Cache-Control": continuation
            ? "private, max-age=0"
            : "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (err) {
    const message = (err as Error).message;
    if (message === "AUTH_REQUIRED") {
      return NextResponse.json(
        {
          success: false,
          videos: [],
          sections: [],
          continuationToken: null,
          error: "AUTH_REQUIRED",
        },
        { status: 401 }
      );
    }
    console.error("[API/feed] Error:", message);

    return NextResponse.json(
      {
        success: false,
        videos: [],
        sections: [],
        continuationToken: null,
        error: "Failed to fetch feed",
      },
      { status: 502 }
    );
  }
}
