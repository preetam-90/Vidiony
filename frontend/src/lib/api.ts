/**
 * API client — all backend calls go through here.
 * Easy to swap base URL via env var.
 */

// With the Next.js rewrites in next.config.ts, /api/* and /proxy/* are proxied
// to the Fastify backend on the same origin — no CORS issues at all.
// Override with NEXT_PUBLIC_API_URL only if you move the backend to a different host.
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api/yt";

async function fetcher<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any).error ?? `API ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Types (mirrors backend service types)
// ---------------------------------------------------------------------------

export interface VideoThumbnail {
  url: string;
  width: number;
  height: number;
}

export interface FormatMetadata {
  itag: number;
  mimeType: string;
  qualityLabel: string | null;
  bitrate: number;
  container: string;
  codecs: string;
  width: number | null;
  height: number | null;
  fps: number | null;
  hasAudio: boolean;
  hasVideo: boolean;
}

export interface VideoCardData {
  id: string;
  title: string;
  thumbnails: VideoThumbnail[];
  duration: string;
  viewCount: string;
  publishedAt: string;
  channelName: string;
  channelId: string;
  channelThumbnail: VideoThumbnail | null;
}

export interface VideoDetails {
  id: string;
  title: string;
  description: string;
  channelId: string;
  channelName: string;
  channelThumbnail: VideoThumbnail | null;
  publishedAt: string;
  viewCount: number;
  likeCount: number | null;
  duration: number;
  thumbnails: VideoThumbnail[];
  tags: string[];
  category: string;
  isLive: boolean;
  formats: FormatMetadata[];
  /** Caption tracks returned by the backend (may be empty for some videos) */
  captions: CaptionTrackMeta[];
}

/** Caption track info from the backend (no VTT URL — we build that client-side) */
export interface CaptionTrackMeta {
  id: string;       // "en", "fr", "en.auto"
  label: string;    // "English", "English (auto-generated)"
  language: string; // BCP-47 code
  isAuto: boolean;
}

export interface ChannelInfo {
  id: string;
  name: string;
  description: string;
  thumbnails: VideoThumbnail[];
  banners: VideoThumbnail[];
  subscriberCount: string;
  videoCount: string;
}

export interface CommentData {
  id: string;
  text: string;
  authorName: string;
  authorThumbnail: VideoThumbnail | null;
  likeCount: number;
  publishedAt: string;
  replyCount: number;
  isCreator: boolean;
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export const api = {
  /** Trending / home feed with pagination */
  getFeed: (page: number = 1, limit: number = 8) =>
    fetcher<{ videos: VideoCardData[] }>(`/feed?page=${page}&limit=${limit}`),

  /** Search videos */
  search: (q: string) => fetcher<{ videos: VideoCardData[] }>(`/search?q=${encodeURIComponent(q)}`),

  /** Video details + format metadata */
  getVideo: (id: string) => fetcher<{ video: VideoDetails }>(`/video/${id}`),

  /** Related videos */
  getRelated: (id: string) => fetcher<{ videos: VideoCardData[] }>(`/video/${id}/related`),

  /** Comments */
  getComments: (id: string) => fetcher<{ comments: CommentData[] }>(`/video/${id}/comments`),

  /** Channel info */
  getChannel: (id: string) => fetcher<{ channel: ChannelInfo }>(`/channel/${id}`),

  /** Build proxied stream URL (for <video src>) — optional quality label e.g. "720p" */
  streamUrl: (videoId: string, quality?: string) => {
    const base = `${API_BASE}/stream/${videoId}`;
    return quality ? `${base}?quality=${encodeURIComponent(quality)}` : base;
  },

  /**
   * Direct merged-stream URL — ffmpeg merges video+audio on the server.
   * Use this as the video src for any explicit quality selection.
   * The response is a streamable fragmented MP4 (no JSON wrapper).
   */
  mergeStreamUrl: (videoId: string, quality: string) =>
    `${API_BASE}/merged-stream/${videoId}?quality=${encodeURIComponent(quality)}`,

  /**
   * Proxied VTT caption URL.
   * YouTube's timedtext endpoint has CORS headers that block browser requests,
   * so we pipe it through the backend.
   *
   * @param isAuto  pass true for auto-generated (ASR) tracks
   */
  captionUrl: (videoId: string, language: string, isAuto: boolean) => {
    const base = `${API_BASE}/captions/${videoId}?lang=${encodeURIComponent(language)}`;
    return isAuto ? `${base}&kind=asr` : base;
  },
};
