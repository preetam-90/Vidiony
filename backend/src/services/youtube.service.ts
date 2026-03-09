/**
 * YouTube Service
 *
 * - Metadata (search, feed, video details, channel, comments):
 *     → youtubei.js Innertube singleton
 *
 * - Stream URLs:
 *     → yt-dlp subprocess.
 *       youtubei.js v16.0.1 cannot decipher the current YouTube player's
 *       signature algorithm (XOR-obfuscated, patterns changed in early 2026).
 *       yt-dlp (updated continuously) uses the ANDROID_VR client which
 *       returns pre-signed URLs that don't need JS-based deciphering.
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getInnertube, resetInnertube } from "../innertube.js";
import { getCachedData, setCachedData } from "./cache.service.js";

const execFileAsync = promisify(execFile);

// Path to the yt-dlp binary (must be installed: pip install yt-dlp)
const YTDLP_BIN = process.env.YTDLP_PATH || "yt-dlp";

export { resetInnertube as resetInstance };

// ---------------------------------------------------------------------------
// Shared types
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

export interface ChapterInfo {
  time: number;
  label: string;
}

export interface StoryboardInfo {
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
  duration: number; // seconds
  thumbnails: VideoThumbnail[];
  tags: string[];
  category: string;
  isLive: boolean;
  formats: FormatMetadata[];
  captions: CaptionTrackInfo[];
  chapters: ChapterInfo[];
  storyboardSpec: string | null;
  storyboard: StoryboardInfo | null;
}

export interface CaptionTrackInfo {
  id: string;       // "en", "fr", "en.auto"
  label: string;    // "English", "English (auto-generated)"
  language: string; // BCP-47 code e.g. "en"
  isAuto: boolean;  // true = ASR auto-generated
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

export interface StreamFormat {
  itag: number;
  url: string;
  mimeType: string;
  container: string;
  qualityLabel: string | null;
  contentLength?: number;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

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

function getThumbnails(item: unknown): VideoThumbnail[] {
  if (!item || !Array.isArray(item)) return [];
  return item.map((t: any) => ({
    url: t.url ?? "",
    width: t.width ?? 0,
    height: t.height ?? 0,
  }));
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

function parseCount(val: unknown): number {
  const str = getText(val).replace(/[^0-9.]/g, "");
  const n = parseFloat(str);
  return isNaN(n) ? 0 : n;
}

function mapToVideoCard(v: any): VideoCardData {
  return {
    id: getVideoId(v) ?? "",
    title: getText(v.title),
    thumbnails: getThumbnails(v.thumbnails),
    duration: getText(v.duration),
    viewCount: getText(v.view_count ?? v.short_view_count),
    publishedAt: getText(v.published),
    channelName: getText(v.author?.name ?? v.author),
    channelId: v.author?.id ?? "",
    channelThumbnail: v.author?.thumbnails?.[0]
      ? {
          url: v.author.thumbnails[0].url,
          width: v.author.thumbnails[0].width ?? 0,
          height: v.author.thumbnails[0].height ?? 0,
        }
      : null,
  };
}

// ---------------------------------------------------------------------------
// Feed
// ---------------------------------------------------------------------------

export async function getFeed(page: number = 1, limit: number = 8): Promise<VideoCardData[]> {
  const cacheKey = "yt:feed:all";
  const allVideos: VideoCardData[] =
    (await getCachedData<VideoCardData[]>(cacheKey)) ?? (await fetchFeedVideos());

  const start = (page - 1) * limit;
  return allVideos.slice(start, start + limit);
}

async function fetchFeedVideos(): Promise<VideoCardData[]> {
  const cacheKey = "yt:feed:all";
  const cached = await getCachedData<VideoCardData[]>(cacheKey);
  if (cached) return cached;

  const yt = await getInnertube();
  let rawVideos: any[] = [];

  try {
    const trending = await yt.getTrending();
    rawVideos = trending.videos ?? [];
  } catch (err) {
    console.warn("[YouTubeService] getTrending() failed:", (err as any)?.message);
  }

  if (rawVideos.length === 0) {
    try {
      const home = await yt.getHomeFeed();
      rawVideos = (home.videos ?? (home as any).contents ?? []) as any[];
    } catch (homeErr) {
      console.warn("[YouTubeService] getHomeFeed() failed:", (homeErr as any)?.message);
      try {
        const results = await yt.search("trending 2025", { sort_by: "relevance" });
        rawVideos = results.results ?? [];
      } catch (searchErr) {
        console.error("[YouTubeService] All feed methods failed:", (searchErr as any)?.message);
      }
    }
  }

  const videos: VideoCardData[] = rawVideos
    .filter((v: any) => getVideoId(v))
    .slice(0, 24)
    .map(mapToVideoCard);

  await setCachedData(cacheKey, videos, 180);
  return videos;
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export async function search(query: string): Promise<VideoCardData[]> {
  const cacheKey = `yt:search:${query}`;
  const cached = await getCachedData<VideoCardData[]>(cacheKey);
  if (cached) return cached;

  const yt = await getInnertube();
  const results = await yt.search(query);

  const videos: VideoCardData[] = (results.results ?? [])
    .filter((item: any) => getVideoId(item))
    .slice(0, 20)
    .map(mapToVideoCard);

  await setCachedData(cacheKey, videos, 120);
  return videos;
}

export async function getSearchSuggestions(query: string): Promise<string[]> {
  const yt = await getInnertube();
  return yt.getSearchSuggestions(query);
}

// ---------------------------------------------------------------------------
// Video details
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Caption extraction helper
// ---------------------------------------------------------------------------

/**
 * Pull caption track metadata from youtubei.js info.captions.
 * We only need language codes and labels here — the actual VTT content
 * is fetched on-demand via the /captions/:videoId proxy endpoint.
 *
 * youtubei.js exposes caption tracks under info.captions.caption_tracks.
 * Each track has: language_code, name (Text|string), kind ("asr"=auto), vss_id.
 */
function extractCaptions(info: any, videoId: string): CaptionTrackInfo[] {
  try {
    const captionTracks: any[] =
      info?.captions?.caption_tracks ??           // youtubei.js v10+
      info?.player_overlays?.caption_tracks ??    // older shape
      [];

    if (!Array.isArray(captionTracks) || captionTracks.length === 0) return [];

    const seen = new Set<string>();
    return captionTracks.reduce<CaptionTrackInfo[]>((acc, track) => {
      const langCode: string = track.language_code ?? track.languageCode ?? "";
      if (!langCode) return acc;

      // vss_id "a.en" = auto-generated, ".en" = manual
      const isAuto =
        track.kind === "asr" ||
        (typeof track.vss_id === "string" && track.vss_id.startsWith("a."));

      const id = isAuto ? `${langCode}.auto` : langCode;
      if (seen.has(id)) return acc;
      seen.add(id);

      const rawLabel =
        track.name?.text ??      // Text object
        track.name?.toString?.() ??
        track.name ??
        langCode;

      // Strip any existing "(auto-generated)" suffix before we re-add it
      const cleanLabel = String(rawLabel).replace(/\s*\(auto-generated\)\s*$/i, "").trim();

      acc.push({
        id,
        label: isAuto ? `${cleanLabel} (auto-generated)` : cleanLabel,
        language: langCode,
        isAuto,
      });

      return acc;
    }, []);
  } catch {
    return [];
  }
}

function extractChapters(info: any): ChapterInfo[] {
  const rawChapters = [
    getNestedValue(info, ["player_overlays", "decorated_player_bar", "player_bar", "markers_map", 0, "value", "chapters"]),
    getNestedValue(info, ["playerOverlays", "decoratedPlayerBar", "playerBar", "markersMap", 0, "value", "chapters"]),
    getNestedValue(info, ["player_response", "playerOverlays", "decoratedPlayerBar", "playerBar", "markersMap", 0, "value", "chapters"]),
  ].find(Array.isArray) as any[] | undefined;

  if (!rawChapters || rawChapters.length === 0) return [];

  return rawChapters
    .map((item) => ({
      time: Math.floor(Number(getNestedValue(item, ["time_range_start_millis"]) ?? 0) / 1000),
      label: getText(getNestedValue(item, ["title"]) ?? getNestedValue(item, ["chapter_title"]) ?? "").trim(),
    }))
    .filter((chapter, index, list) => chapter.time >= 0 && chapter.label && list.findIndex((item) => item.time === chapter.time) === index)
    .sort((a, b) => a.time - b.time);
}

function extractStoryboard(info: any): StoryboardInfo | null {
  const board =
    getNestedValue(info, ["storyboards", "boards", 0]) ??
    getNestedValue(info, ["player_response", "storyboards", "boards", 0]);

  if (!board || typeof board !== "object") return null;

  const templateUrl = String(getNestedValue(board, ["template_url"]) ?? "");
  const thumbnailWidth = Number(getNestedValue(board, ["thumbnail_width"]) ?? 0);
  const thumbnailHeight = Number(getNestedValue(board, ["thumbnail_height"]) ?? 0);
  const thumbnailCount = Number(getNestedValue(board, ["thumbnail_count"]) ?? 0);
  const columns = Number(getNestedValue(board, ["columns"]) ?? 0);
  const rows = Number(getNestedValue(board, ["rows"]) ?? 0);
  const storyboardCount = Number(getNestedValue(board, ["storyboard_count"]) ?? 0);
  const interval = Number(getNestedValue(board, ["interval"]) ?? 0);

  if (!templateUrl || thumbnailWidth <= 0 || thumbnailHeight <= 0 || columns <= 0 || rows <= 0) {
    return null;
  }

  return {
    templateUrl,
    thumbnailWidth,
    thumbnailHeight,
    thumbnailCount,
    columns,
    rows,
    storyboardCount,
    interval,
  };
}

function extractStoryboardSpec(info: any): string | null {
  const spec =
    getNestedValue(info, ["player_response", "storyboards", "playerStoryboardSpecRenderer", "spec"]) ??
    getNestedValue(info, ["player_response", "storyboards", "playerLiveStoryboardSpecRenderer", "spec"]) ??
    getNestedValue(info, ["storyboards", "playerStoryboardSpecRenderer", "spec"]) ??
    getNestedValue(info, ["storyboards", "playerLiveStoryboardSpecRenderer", "spec"]);

  return typeof spec === "string" && spec.trim().length > 0 ? spec : null;
}

export async function getVideoDetails(videoId: string): Promise<VideoDetails> {
  const cacheKey = `yt:video:v2:${videoId}`;
  const cached = await getCachedData<VideoDetails>(cacheKey);
  if (cached) return cached;

  const yt = await getInnertube();
  const info = await yt.getInfo(videoId);
  const basic = info.basic_info;

  const formats: FormatMetadata[] = [
    ...(info.streaming_data?.formats ?? []),
    ...(info.streaming_data?.adaptive_formats ?? []),
  ].map((f: any) => ({
    itag: f.itag ?? 0,
    mimeType: f.mime_type ?? "",
    qualityLabel: f.quality_label ?? null,
    bitrate: f.bitrate ?? 0,
    container: (f.mime_type ?? "").split(";")[0]?.split("/")[1] ?? "",
    codecs: (f.mime_type ?? "").match(/codecs="([^"]+)"/)?.[1] ?? "",
    width: f.width ?? null,
    height: f.height ?? null,
    fps: f.fps ?? null,
    hasAudio: Boolean(f.has_audio ?? f.audio_quality),
    hasVideo: Boolean(f.has_video ?? f.quality_label),
  }));

  const details: VideoDetails = {
    id: videoId,
    title: getText(basic.title),
    description: getText(basic.short_description),
    channelId: basic.channel_id ?? "",
    channelName: getText(basic.author),
    channelThumbnail: null,
    publishedAt: getText((info as any).primary_info?.published?.text ?? ""),
    viewCount: basic.view_count ?? 0,
    likeCount: (info as any).basic_info?.like_count ?? null,
    duration: basic.duration ?? 0,
    thumbnails: getThumbnails(basic.thumbnail),
    tags: basic.tags ?? [],
    category: getText(basic.category),
    isLive: basic.is_live ?? false,
    formats,
    captions: extractCaptions(info, videoId),
    chapters: extractChapters(info),
    storyboardSpec: extractStoryboardSpec(info),
    storyboard: extractStoryboard(info),
  };

  await setCachedData(cacheKey, details, 300);
  return details;
}

// ---------------------------------------------------------------------------
// Stream URL via yt-dlp
// ---------------------------------------------------------------------------

export async function getStreamFormat(
  videoId: string,
  options: { quality?: string; type?: "video" | "audio" | "video+audio" } = {}
): Promise<StreamFormat> {
  const { quality = "360p", type = "video+audio" } = options;

  let fmtSelector: string;
  if (type === "audio") {
    fmtSelector = "bestaudio[ext=m4a]/bestaudio";
  } else if (type === "video") {
    const h = qualityToHeight(quality);
    fmtSelector = `bestvideo[height<=${h}][ext=mp4]/bestvideo[height<=${h}]`;
  } else {
    // Combined only — used for the initial "auto" load (itag 18 style)
    const h = qualityToHeight(quality);
    fmtSelector = `best[height<=${h}][ext=mp4]/best[height<=${h}]/best[ext=mp4]/best`;
  }

  const url = `https://www.youtube.com/watch?v=${videoId}`;
  let stdout: string;
  try {
    const result = await execFileAsync(YTDLP_BIN, [
      "-f", fmtSelector,
      "--get-url", "--no-playlist", "--no-warnings", url,
    ], { timeout: 30_000 });
    stdout = result.stdout.trim();
  } catch (err: unknown) {
    throw new Error(`yt-dlp failed for ${videoId}: ${err instanceof Error ? err.message : String(err)}`);
  }

  const streamUrl = stdout.split("\n")[0]?.trim();
  if (!streamUrl?.startsWith("http")) {
    throw new Error(`yt-dlp returned no usable URL for ${videoId}`);
  }

  let itag = 0;
  try { itag = parseInt(new URL(streamUrl).searchParams.get("itag") ?? "0", 10) || 0; } catch {}

  return { itag, url: streamUrl, mimeType: type === "audio" ? "audio/mp4" : "video/mp4", container: "mp4", qualityLabel: quality };
}

/**
 * Get SEPARATE video-only + audio-only URLs for adaptive quality streaming.
 * Uses a SINGLE yt-dlp call with a combined format selector (bestvideo+bestaudio).
 * When yt-dlp needs to merge two streams, --get-url outputs them on separate lines.
 * Using one process avoids the double-request rate-limit that kills parallel calls.
 */
export async function getAdaptiveStreamUrls(
  videoId: string,
  quality: string,
): Promise<{ videoUrl: string; audioUrl: string }> {
  const h = qualityToHeight(quality);
  const ytUrl = `https://www.youtube.com/watch?v=${videoId}`;

  // Single yt-dlp call — outputs 2 lines: video URL then audio URL.
  // Fallback chain: mp4 video+m4a audio → any video+any audio
  const fmtSelector =
    `bestvideo[height<=${h}][ext=mp4]+bestaudio[ext=m4a]` +
    `/bestvideo[height<=${h}]+bestaudio`;

  let stdout: string;
  try {
    const result = await execFileAsync(YTDLP_BIN, [
      "-f", fmtSelector,
      "--get-url",
      "--no-playlist",
      "--no-warnings",
      ytUrl,
    ], { timeout: 40_000 });
    stdout = result.stdout.trim();
  } catch (err: unknown) {
    throw new Error(
      `yt-dlp failed for ${videoId} @ ${quality}: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  const lines = stdout.split("\n").map(l => l.trim()).filter(l => l.startsWith("http"));

  if (lines.length < 2) {
    throw new Error(
      `yt-dlp returned ${lines.length} URL(s) for ${videoId} @ ${quality} (expected 2). ` +
      `This quality may not have separate video+audio streams.`
    );
  }

  return { videoUrl: lines[0], audioUrl: lines[1] };
}

function qualityToHeight(quality: string): number {
  const map: Record<string, number> = {
    "144p": 144,
    "240p": 240,
    "360p": 360,
    "480p": 480,
    "720p": 720,
    "1080p": 1080,
    "1440p": 1440,
    "2160p": 2160,
    best: 9999,
  };
  return map[quality] ?? 480;
}

// ---------------------------------------------------------------------------
// Related videos
// ---------------------------------------------------------------------------

export async function getRelatedVideos(videoId: string): Promise<VideoCardData[]> {
  const cacheKey = `yt:related:${videoId}`;
  const cached = await getCachedData<VideoCardData[]>(cacheKey);
  if (cached) return cached;

  const yt = await getInnertube();
  const info = await yt.getInfo(videoId);
  const related: any[] = (info as any).related_videos ?? (info as any).watch_next_feed ?? [];

  const videos: VideoCardData[] = (Array.isArray(related) ? related : [])
    .filter((item: any) => getVideoId(item))
    .slice(0, 16)
    .map(mapToVideoCard);

  await setCachedData(cacheKey, videos, 300);
  return videos;
}

// ---------------------------------------------------------------------------
// Comments — paginated via in-memory continuation cache
// ---------------------------------------------------------------------------

// Continuation cache: stores Comments objects keyed by `${videoId}:${sort}:${page}`
// so that page N+1 can call getContinuation() on page N's object.
// TTL of 10 minutes; cleaned up passively.
interface ContinuationEntry {
  obj: any; // youtubei.js Comments instance
  expiresAt: number;
}
const _contCache = new Map<string, ContinuationEntry>();
const CONT_TTL_MS = 10 * 60 * 1000;

function setCont(key: string, obj: any) {
  _contCache.set(key, { obj, expiresAt: Date.now() + CONT_TTL_MS });
  // Passive GC: prune stale entries
  if (_contCache.size > 500) {
    const now = Date.now();
    for (const [k, v] of _contCache) {
      if (v.expiresAt < now) _contCache.delete(k);
    }
  }
}

function getCont(key: string): any | null {
  const entry = _contCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) { _contCache.delete(key); return null; }
  return entry.obj;
}

function mapComments(thread: any): CommentData[] {
  return (thread.contents ?? []).map((c: any) => {
    const comment = c.comment ?? c;
    return {
      id: comment.comment_id ?? "",
      text: getText(comment.content),
      authorName: getText(comment.author?.name),
      authorThumbnail: comment.author?.thumbnails?.[0]
        ? { url: comment.author.thumbnails[0].url, width: 0, height: 0 }
        : null,
      likeCount: parseCount(comment.vote_count),
      publishedAt: getText(comment.published),
      replyCount: comment.reply_count ?? 0,
      isCreator: comment.is_member ?? false,
    };
  });
}

export async function getComments(
  videoId: string,
  sort: "TOP_COMMENTS" | "NEWEST_FIRST" = "TOP_COMMENTS",
  page = 0,
): Promise<{ comments: CommentData[]; hasMore: boolean; totalCount: string | null }> {
  const pageKey = `${videoId}:${sort}:${page}`;

  // Page 0 — try Redis cache first
  if (page === 0) {
    const cacheKey = `yt:comments:${videoId}:${sort}`;
    const cached = await getCachedData<{ comments: CommentData[]; hasMore: boolean; totalCount: string | null }>(cacheKey);
    if (cached) return cached;

    const yt = await getInnertube();
    const thread = await yt.getComments(videoId, sort);
    const comments = mapComments(thread);

    // Store the thread object for continuation on page 1
    if (thread.has_continuation) {
      setCont(pageKey, thread);
    }

    // Extract total comment count from header if available
    const totalCount = getText((thread.header as any)?.title) || null;

    const result = { comments, hasMore: thread.has_continuation ?? false, totalCount };
    await setCachedData(cacheKey, result, 180);
    return result;
  }

  // Page > 0 — need the previous page's continuation object
  const prevKey = `${videoId}:${sort}:${page - 1}`;
  const prevThread = getCont(prevKey);

  if (!prevThread) {
    // Previous page evicted — client must restart from page 0
    throw new Error("CONTINUATION_EXPIRED");
  }

  if (!prevThread.has_continuation) {
    return { comments: [], hasMore: false, totalCount: null };
  }

  const thread = await prevThread.getContinuation();
  const comments = mapComments(thread);

  if (thread.has_continuation) {
    setCont(pageKey, thread);
  }

  return { comments, hasMore: thread.has_continuation ?? false, totalCount: null };
}

// ---------------------------------------------------------------------------
// Channel
// ---------------------------------------------------------------------------

export async function getChannelInfo(channelId: string): Promise<ChannelInfo> {
  const cacheKey = `yt:channel:${channelId}`;
  const cached = await getCachedData<ChannelInfo>(cacheKey);
  if (cached) return cached;

  const yt = await getInnertube();
  const channel = await yt.getChannel(channelId);

  const info: ChannelInfo = {
    id: channelId,
    name: getText(channel.metadata?.title ?? (channel as any).title),
    description: getText(channel.metadata?.description),
    thumbnails: getThumbnails(channel.metadata?.thumbnail ?? []),
    banners: getThumbnails((channel as any).header?.banner?.thumbnails ?? []),
    subscriberCount: getText(
      (channel as any).header?.subscriber_count ??
      (channel.metadata as any)?.subscriber_count
    ),
    videoCount: getText((channel as any).header?.videos_count ?? ""),
  };

  await setCachedData(cacheKey, info, 600);
  return info;
}

// ---------------------------------------------------------------------------
// Caption VTT — yt-dlp downloads the subtitle file reliably (youtubei.js
// base_url requires session auth that cannot be replicated with plain fetch)
// ---------------------------------------------------------------------------

/**
 * Download a WebVTT subtitle file for a video via yt-dlp.
 * yt-dlp handles all YouTube auth/signing internally.
 *
 * @param videoId  YouTube video ID
 * @param lang     BCP-47 language code e.g. "en", "fr"
 * @param isAuto   true = auto-generated (ASR) track, false = manual
 */
export async function getCaptionVtt(
  videoId: string,
  lang: string,
  isAuto: boolean,
): Promise<string> {
  const ytUrl   = `https://www.youtube.com/watch?v=${videoId}`;
  // Unique temp path per request to avoid collisions
  const tmpBase = join(tmpdir(), `vtt-${videoId}-${lang}-${Date.now()}`);

  const args: string[] = [
    isAuto ? "--write-auto-sub" : "--write-sub",
    "--sub-lang", lang,
    "--sub-format", "vtt",
    "--convert-subs", "vtt",   // ensure output is always WebVTT
    "--skip-download",
    "--no-playlist",
    "--no-warnings",
    "-o", tmpBase,
    ytUrl,
  ];

  try {
    await execFileAsync(YTDLP_BIN, args, { timeout: 40_000 });
  } catch (err: unknown) {
    throw new Error(
      `yt-dlp caption failed for ${videoId}/${lang}: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  // yt-dlp writes  <tmpBase>.<lang>.vtt
  const vttPath = `${tmpBase}.${lang}.vtt`;

  let content: string;
  try {
    content = await readFile(vttPath, "utf-8");
  } catch {
    throw new Error(`Caption file not found after yt-dlp for ${videoId}/${lang}`);
  } finally {
    unlink(vttPath).catch(() => {}); // cleanup regardless
  }

  return content.trim();
}
