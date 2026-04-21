/**
 * API client — all backend calls go through here.
 *
 * Two base URLs:
 *  API_BASE  → /api/yt  (legacy youtubei.js routes, proxied by Next.js)
 *  API_V2    → /api/v2  (new routes: auth, search, trending, user, live, channels)
 */

const API_BASE = "/api/yt";
const API_V2 = "/api/v2";

// Note: access tokens are stored in HttpOnly cookies set by the backend.
// Frontend MUST use `credentials: "include"` for authenticated requests.
export function getAccessToken(): string | null { return null; }
export function setAccessToken(_token: string): void { /* no-op; tokens are HttpOnly cookies */ }
export function clearAccessToken(): void { /* no-op */ }

// ─── Core fetcher ──────────────────────────────────────────────────────────────
async function fetcher<T>(
  base: string,
  path: string,
  init?: RequestInit & { skipAuth?: boolean }
): Promise<T> {
  const { skipAuth, ...rest } = init ?? {};
  const hasBody = rest.body !== undefined && rest.body !== null;
  const isFormData = typeof FormData !== "undefined" && rest.body instanceof FormData;

  const res = await fetch(`${base}${path}`, {
    ...rest,
    credentials: "include", // send cookies
    headers: {
      ...(hasBody && !isFormData ? { "Content-Type": "application/json" } : {}),
      ...rest.headers,
    },
  });

  // Auto-refresh on 401
  if (res.status === 401 && !skipAuth && !path.includes("/auth/refresh")) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      return fetcher(base, path, init);
    }
  }

  if (!res.ok) {
    const body: unknown = await res.json().catch(() => ({}));
    const errorValue = typeof body === "object" && body !== null
      ? (body as { error?: unknown }).error
      : undefined;
    const msg =
      (typeof errorValue === "object" && errorValue !== null
        ? (errorValue as { message?: string }).message
        : undefined) ??
      (typeof errorValue === "string" ? errorValue : undefined) ??
      `API ${res.status}`;
    throw new Error(msg);
  }

  return res.json() as Promise<T>;
}

async function tryRefreshToken(): Promise<boolean> {
  try {
    const res = await fetch(`${API_V2}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Shorthand helpers
const yt = <T>(path: string, init?: RequestInit) =>
  fetcher<T>(API_BASE, path, init);
const v2 = <T>(path: string, init?: RequestInit & { skipAuth?: boolean }) =>
  fetcher<T>(API_V2, path, init);

// ─── Types ─────────────────────────────────────────────────────────────────────

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

export interface ChapterData {
  time: number;
  label: string;
}

export interface StoryboardData {
  templateUrl: string;
  thumbnailWidth: number;
  thumbnailHeight: number;
  thumbnailCount: number;
  columns: number;
  rows: number;
  storyboardCount: number;
  interval: number;
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
  captions: CaptionTrackMeta[];
  chapters: ChapterData[];
  storyboardSpec: string | null;
  storyboard: StoryboardData | null;
}

export interface CaptionTrackMeta {
  id: string;
  label: string;
  language: string;
  isAuto: boolean;
}

export interface ChannelInfo {
  id: string;
  name: string;
  handle?: string;
  description: string;
  thumbnails: VideoThumbnail[];
  banners: VideoThumbnail[];
  subscriberCount: string;
  videoCount: string;
  isVerified?: boolean;
  links?: Array<{ title: string; url: string }>;
  tabs?: string[];
}

export interface ChannelAbout {
  description: string;
  subscriberCount: string;
  videoCount: string;
  totalViewCount: string;
  joinedDate: string | null;
  links: Array<{ title: string; url: string }>;
  country: string | null;
}

export interface ChannelVideo {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  viewCount: string;
  publishedAt: string;
}

export interface ChannelVideoItem {
  type: "video" | "playlist" | "post";
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  viewCount: string;
  publishedAt: string;
  videoCount: number | null;
  content?: string;
  authorName?: string;
  authorAvatar?: string;
  mediaImages?: string[];
  likeCount?: number | null;
  commentCount?: number | null;
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

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  name: string | null;
  avatar: string | null;
  verified: boolean;
  youtubeChannelId?: string | null;
  youtubeHandle?: string | null;
}

export interface SearchFilters {
  type?: "video" | "channel" | "playlist" | "all";
  sort?: "relevance" | "upload_date" | "view_count" | "rating";
  upload_date?: "hour" | "today" | "week" | "month" | "year";
  duration?: "short" | "medium" | "long";
}

export interface SearchResult {
  type: "video" | "channel" | "playlist";
  id: string;
  title?: string;
  name?: string;
  thumbnails?: VideoThumbnail[];
  thumbnail?: string;
  channelName?: string;
  channelId?: string;
  viewCount?: string;
  publishedAt?: string;
  duration?: string;
  videoCount?: number;
  subscriberCount?: string;
  isVerified?: boolean;
  handle?: string;
}

export interface LiveInfo {
  success: boolean;
  videoId: string;
  title: string;
  channelName: string;
  channelId: string;
  viewers: string | null;
  startTime: string | null;
  thumbnails: VideoThumbnail[];
  hlsManifestUrl: string | null;
  dashManifestUrl: string | null;
  isLive: boolean;
  isUpcoming?: boolean;
  formats?: Array<{
    itag: number;
    quality: string | null;
    mimeType: string;
    hasAudio: boolean;
    hasVideo: boolean;
    url: string | null;
  }>;
}

export interface TrendingVideo {
  videoId: string;
  title: string;
  channelName: string;
  channelId: string;
  thumbnail: string;
  viewCount: string;
  publishedAt: string;
  duration: string;
  category: string;
}

export interface WatchHistoryItem {
  id: string;          // DB entry id
  videoId: string;     // the actual video id
  title: string;
  thumbnail: string;
  channelName: string;
  duration: number | null;
  progress: number;    // position in seconds
  watchedAt: number;   // timestamp
}

export interface WatchLaterItem {
  id: string;
  videoId: string;
  title: string | null;
  thumbnail: string | null;
  channelName: string | null;
  channelId: string | null;
  duration: string | null;
  addedAt: string;
}

export interface Playlist {
  id: string;
  title: string;
  videoCount: number;
  thumbnail: string | null;
  isPrivate: boolean;
  lastUpdated?: string;
}

export interface YTHistoryVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelName: string;
  channelId: string;
  channelThumbnail: string | null;
  duration: string;
  viewCount: string;
  publishedAt: string;
  isLive: boolean;
}

export interface YTHistorySection {
  title: string; // "Today", "Yesterday", "This week", etc.
  videos: YTHistoryVideo[];
}

export interface YTSubscription {
  channelId: string;
  channelName: string;
  thumbnail: string | null;
  subscriberCount: string;
  videoCount: string;
  hasNewVideos: boolean;
}

export interface YTNotification {
  id: string;
  title: string;
  sentAt: string;
  videoId: string | null;
  thumbnail: string | null;
  channelName: string;
  isRead: boolean;
}

export interface GuideItem {
  id: string;
  title: string;
  url: string;
  iconType: string;
  thumbnail?: string;
}

export interface GuideSection {
  title: string | null;
  items: GuideItem[];
}

export interface GuideData {
  sections: GuideSection[];
}

// ─── API object ────────────────────────────────────────────────────────────────

export const api = {
  // ── Legacy /api/yt routes (always available, no auth needed) ──────────────

  getFeed: (page = 1, limit = 8) =>
    fetcher<{ videos: VideoCardData[] }>("", `/api/feed?page=${page}&limit=${limit}`),

  getGuide: () =>
    yt<GuideData>("/guide"),

  search: (q: string) =>
    yt<{ videos: VideoCardData[] }>(`/search?q=${encodeURIComponent(q)}`),

  getVideo: (id: string) =>
    yt<{ video: VideoDetails }>(`/video/${id}`),

  getRelated: (id: string) =>
    yt<{ videos: VideoCardData[] }>(`/video/${id}/related`),

  getComments: (id: string, page = 0, sort: "top" | "new" = "top") =>
    yt<{ comments: CommentData[]; hasMore: boolean; totalCount: string | null }>(
      `/video/${id}/comments?page=${page}&sort=${sort}`
    ),

  getChannel: (id: string) =>
    v2<{ success: boolean; channel: ChannelInfo }>(`/channels/${id}`, { skipAuth: true }),

  getChannelPopular: (id: string) =>
    v2<{ success: boolean; channelId: string; items: ChannelVideo[] }>(
      `/channels/${id}/popular`,
      { skipAuth: true }
    ),

  getChannelAbout: (id: string) =>
    v2<{ success: boolean; channelId: string; about: ChannelAbout }>(
      `/channels/${id}/about`,
      { skipAuth: true }
    ),

  streamUrl: (videoId: string, quality?: string) => {
    const base = `${API_BASE}/stream/${videoId}`;
    return quality ? `${base}?quality=${encodeURIComponent(quality)}` : base;
  },

  mergeStreamUrl: (videoId: string, quality: string) =>
    `${API_BASE}/merged-stream/${videoId}?quality=${encodeURIComponent(quality)}`,

  captionUrl: (videoId: string, language: string, isAuto: boolean) => {
    const base = `${API_BASE}/captions/${videoId}?lang=${encodeURIComponent(language)}`;
    return isAuto ? `${base}&kind=asr` : base;
  },

  // ── Auth (/api/v2/auth) ────────────────────────────────────────────────────

  auth: {
    refresh: () =>
      v2<{ success: boolean }>("/auth/refresh", { method: "POST", skipAuth: true }),

    logout: () =>
      v2<{ success: boolean }>("/auth/logout", { method: "POST" }),

    me: () =>
      v2<{ user: AuthUser }>("/auth/me"),

    /** Returns the backend Google OAuth URL (profile + YouTube scopes) */
    googleLoginUrl: () =>
      `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/auth/google`,

    // ── Session management
    getSessions: () => v2<{ sessions: Array<{ id: string; ipAddress?: string | null; userAgent?: string | null; createdAt: string; expiresAt: string; lastUsedAt?: string | null }> }>("/auth/sessions"),
    revokeSession: (id: string) => v2<{ success: boolean }>(`/auth/session/${id}`, { method: "DELETE" }),
    revokeAllSessions: () => v2<{ success: boolean }>(`/auth/sessions`, { method: "DELETE" }),
  },

  // ── Enhanced search (/api/v2/search) ──────────────────────────────────────

  searchV2: (q: string, filters: SearchFilters = {}) => {
    const params = new URLSearchParams({ q });
    if (filters.type) params.set("type", filters.type);
    if (filters.sort) params.set("sort", filters.sort);
    if (filters.upload_date) params.set("upload_date", filters.upload_date);
    if (filters.duration) params.set("duration", filters.duration);
    return v2<{ success: boolean; results: SearchResult[]; estimatedResults: number }>(
      `/search?${params}`,
      { skipAuth: true }
    );
  },

  searchSuggestions: (q: string) =>
    v2<{ suggestions: string[] }>(
      `/search/suggestions?q=${encodeURIComponent(q)}`,
      { skipAuth: true }
    ),

  // ── Trending (/api/v2/trending) ────────────────────────────────────────────

  getTrending: (category = "trending", region = "US") =>
    fetcher<{ videos: TrendingVideo[]; category: string; cachedAt: string | null }>(
      "",
      `/api/trending?category=${category}&region=${region}`,
      { skipAuth: true }
    ),

  // ── Video actions (/api/v2/videos) ─────────────────────────────────────────

  likeVideo: (id: string) =>
    v2<{ success: boolean }>(`/videos/${id}/like`, { method: "POST" }),

  dislikeVideo: (id: string) =>
    v2<{ success: boolean }>(`/videos/${id}/dislike`, { method: "POST" }),

  removeVideoRating: (id: string) =>
    v2<{ success: boolean }>(`/videos/${id}/like`, { method: "DELETE" }),

  postComment: (id: string, text: string) =>
    v2<{ success: boolean }>(`/videos/${id}/comments`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),

  getVideoState: (id: string, channelId?: string) =>
    v2<{ success: boolean; liked: boolean; disliked: boolean; subscribed: boolean }>(
      `/videos/${id}/state${channelId ? `?channelId=${encodeURIComponent(channelId)}` : ""}`
    ),

  downloadUrl: (id: string, quality = "best") => {
    const params = new URLSearchParams();
    if (quality === "audio") {
      params.set("quality", "best");
      params.set("format", "audio");
    } else {
      params.set("quality", quality);
    }

    return `${API_V2}/videos/${id}/download?${params.toString()}`;
  },

  getTranscript: (id: string, lang = "en") =>
    v2<{ transcript: Array<{ text: string; start: number; duration: number }> }>(
      `/videos/${id}/transcript?lang=${lang}`,
      { skipAuth: true }
    ),

  // ── Channel videos (/api/v2/channels) ─────────────────────────────────────

  getChannelVideos: (
    id: string,
    tab: "videos" | "shorts" | "live" | "playlists" | "podcasts" | "posts" = "videos",
    continuation?: string
  ) =>
    v2<{ success: boolean; channelId: string; tab: string; items: ChannelVideoItem[]; continuation: string | null }>(
      `/channels/${id}/videos?tab=${tab}${continuation ? `&continuation=${encodeURIComponent(continuation)}` : ''}`,
      { skipAuth: true }
    ),

  // ── Live (/api/v2/live) ────────────────────────────────────────────────────

  getLiveInfo: (videoId: string) =>
    v2<LiveInfo>(`/live/${videoId}`, { skipAuth: true }),

  // ── User history (/api/v2/user/history) ───────────────────────────────────

  user: {
    getHistory: () =>
      v2<{ items: WatchHistoryItem[] }>("/user/history"),

    recordHistory: (item: Omit<WatchHistoryItem, "watchedAt">) =>
      v2<{ success: boolean }>("/user/history", {
        method: "POST",
        body: JSON.stringify(item),
      }),

    removeFromHistory: (videoId: string) =>
      v2<{ success: boolean }>(`/user/history/${videoId}`, { method: "DELETE" }),

    clearHistory: () =>
      v2<{ success: boolean }>("/user/history/clear", { method: "DELETE" }),

    getSubscriptions: () =>
      v2<{ subscriptions: Array<{ channelId: string; channelName: string; thumbnail: string | null }> }>(
        "/user/subscriptions"
      ),

    subscribe: (channelId: string) =>
      v2<{ success: boolean }>(`/user/subscriptions/${channelId}`, { method: "POST" }),

    unsubscribe: (channelId: string) =>
      v2<{ success: boolean }>(`/user/subscriptions/${channelId}`, { method: "DELETE" }),

    getSubscriptionFeed: () =>
      v2<{ videos: VideoCardData[] }>("/user/subscriptions/feed"),

    getPlaylists: () =>
      v2<{ playlists: Playlist[] }>("/user/playlists"),

    createPlaylist: (title: string, isPrivate = false) =>
      v2<{ playlist: Playlist }>("/user/playlists", {
        method: "POST",
        body: JSON.stringify({ title, isPrivate }),
      }),

    addToPlaylist: (playlistId: string, videoId: string) =>
      v2<{ success: boolean }>(`/user/playlists/${playlistId}/videos`, {
        method: "POST",
        body: JSON.stringify({ videoId }),
      }),

    // ── YouTube account data (requires YouTube OAuth connected) ─────────────

    /** Real YouTube watch history from Google account, grouped by date */
    getYouTubeHistory: () =>
      v2<{ sections: YTHistorySection[]; hasMore: boolean }>("/user/youtube/history"),

    /** User's liked videos playlist from YouTube */
    getLikedVideos: () =>
      v2<{ videos: YTHistoryVideo[]; total: number }>("/user/youtube/liked"),

    /** User's Watch Later playlist from YouTube */
    getWatchLater: () =>
      v2<{ videos: YTHistoryVideo[] }>("/user/youtube/watch-later"),

    // ── Watch Later (Vidion-native) ─────────────────────────────────────────

    /** Get paginated Watch Later list */
    getWatchLaterList: (page = 1, limit = 20, sort: "newest" | "oldest" = "newest") =>
      v2<{ items: WatchLaterItem[]; total: number; page: number; hasMore: boolean }>(
        `/user/watch-later?page=${page}&limit=${limit}&sort=${sort}`
      ),

    /** Add a video to Watch Later */
    addToWatchLater: (data: { videoId: string; title?: string; thumbnail?: string; channelName?: string; channelId?: string; duration?: string }) =>
      v2<{ success: boolean; item: WatchLaterItem }>("/user/watch-later", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    /** Remove a video from Watch Later */
    removeFromWatchLater: (videoId: string) =>
      v2<{ success: boolean }>(`/user/watch-later/${videoId}`, { method: "DELETE" }),

    /** Check if a single video is saved */
    checkWatchLater: (videoId: string) =>
      v2<{ saved: boolean }>(`/user/watch-later/check/${videoId}`),

    /** Batch check multiple video IDs */
    checkWatchLaterBatch: (ids: string[]) =>
      v2<{ saved: Record<string, boolean> }>(
        `/user/watch-later/check?ids=${ids.join(",")}`
      ),

    /** Clear all Watch Later items */
    clearWatchLater: () =>
      v2<{ success: boolean }>("/user/watch-later/clear", { method: "DELETE" }),

    /** Subscribed channels list from YouTube */
    getYouTubeSubscriptions: () =>
      v2<{ subscriptions: YTSubscription[] }>("/user/youtube/subscriptions"),

    /** Check if user is subscribed to a specific YouTube channel */
    getYouTubeSubscriptionStatus: (channelId: string) =>
      v2<{ success: boolean; subscribed: boolean }>(`/user/youtube/subscriptions/${channelId}/status`),

    /** Latest videos from subscribed channels */
    getYouTubeFeed: () =>
      v2<{ videos: VideoCardData[] }>("/user/youtube/feed"),

    /** YouTube notifications */
    getNotifications: () =>
      v2<{ notifications: YTNotification[]; unseenCount: number }>("/user/youtube/notifications"),

    /** User's YouTube playlists */
    getYouTubePlaylists: () =>
      v2<{ playlists: Playlist[] }>("/user/youtube/playlists"),
  },
};
