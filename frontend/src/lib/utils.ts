import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface ResolvedURL {
  type: "video" | "channel" | "playlist" | "invalid";
  id: string;
}

const YOUTUBE_VIDEO_REGEX = /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;
const YOUTUBE_CHANNEL_REGEX = /(?:youtube\.com\/(?:@|channel\/|user\/)|@)([a-zA-Z0-9_-]+)/;
const YOUTUBE_PLAYLIST_REGEX = /youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)/;

export function extractVideoId(url: string): string | null {
  const videoMatch = url.match(YOUTUBE_VIDEO_REGEX);
  if (videoMatch) return videoMatch[1];
  return null;
}

export function extractChannelId(url: string): string | null {
  const channelMatch = url.match(YOUTUBE_CHANNEL_REGEX);
  if (channelMatch) return channelMatch[1];
  return null;
}

export function extractPlaylistId(url: string): string | null {
  const playlistMatch = url.match(YOUTUBE_PLAYLIST_REGEX);
  if (playlistMatch) return playlistMatch[1];
  return null;
}

export function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function resolveURL(input: string): ResolvedURL | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (!isValidUrl(trimmed) && !trimmed.includes("youtube.com") && !trimmed.includes("youtu.be")) {
    return null;
  }

  const videoId = extractVideoId(trimmed);
  if (videoId) {
    return { type: "video", id: videoId };
  }

  const playlistId = extractPlaylistId(trimmed);
  if (playlistId) {
    return { type: "playlist", id: playlistId };
  }

  const channelId = extractChannelId(trimmed);
  if (channelId) {
    return { type: "channel", id: channelId };
  }

  return null;
}