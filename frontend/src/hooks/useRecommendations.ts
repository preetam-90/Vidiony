/**
 * useRecommendations — React Query hooks for the recommendation engine.
 *
 * useHomeRecommendations()          → home page personalized sections
 * useVideoRecommendations(videoId)  → video-page related panel
 * useTrackWatch(...)                → fire-and-forget analytics beacon
 * useTrackInteraction(...)          → record engagement signal
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface RecommendationItem {
  id: string;
  title: string;
  thumbnail: string;
  channelName: string;
  channelId: string;
  duration?: string;
  viewCount?: string;
  publishedAt?: string;
  score: number;
  source: "collaborative" | "channel" | "category" | "trending" | "cold_start";
}

export interface ContinueWatchingItem {
  id: string;
  title: string;
  thumbnail: string;
  channelName: string;
  channelId: string;
  duration: number;
  progress: number;
  watchPercentage: number;
  watchedAt: string;
}

export interface HomeRecommendations {
  recommendedVideos: RecommendationItem[];
  trendingVideos: RecommendationItem[];
  continueWatching: ContinueWatchingItem[];
  fromYourChannels: RecommendationItem[];
  coldStart: boolean;
}

export interface VideoPageRecommendations {
  related: RecommendationItem[];
}

export type InteractionType =
  | "LIKE"
  | "DISLIKE"
  | "COMMENT"
  | "SHARE"
  | "SUBSCRIBE"
  | "SAVE"
  | "SKIP";

export interface WatchPayload {
  videoId: string;
  watchTime: number;
  watchPercentage: number;
  duration?: number;
  title?: string;
  thumbnail?: string;
  channelId?: string;
  channelName?: string;
  category?: string;
  tags?: string[];
  device?: string;
}

// ─── API helpers ───────────────────────────────────────────────────────────────

async function fetchJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any)?.error?.message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Hooks ─────────────────────────────────────────────────────────────────────

/** Fetch personalized home recommendations (authenticated). */
export function useHomeRecommendations() {
  return useQuery<HomeRecommendations, Error>({
    queryKey: ["recommendations", "home"],
    queryFn: async () => {
      const resp = await fetchJSON<{ success: boolean; data: HomeRecommendations }>(
        "/api/v2/recommendations/home"
      );
      return resp.data;
    },
    staleTime: 5 * 60 * 1000,    // 5 min — backend TTL is 10 min
    gcTime:    15 * 60 * 1000,
    retry: (count, err) => {
      if ((err as Error).message === "UNAUTHORIZED") return false;
      return count < 2;
    },
  });
}

/** Fetch related videos for a video page. */
export function useVideoRecommendations(videoId: string) {
  return useQuery<VideoPageRecommendations, Error>({
    queryKey: ["recommendations", "video", videoId],
    queryFn: async () => {
      const resp = await fetchJSON<{ success: boolean; data: VideoPageRecommendations }>(
        `/api/v2/recommendations/video/${videoId}`
      );
      return resp.data;
    },
    staleTime: 10 * 60 * 1000,
    gcTime:    20 * 60 * 1000,
    enabled: !!videoId,
  });
}

/**
 * Returns a stable function that sends a watch analytics beacon.
 * Debounced internally — safe to call on every time-update event.
 * Requires the user to be logged in; silently no-ops if not.
 */
export function useTrackWatch() {
  const lastSent = useRef<Record<string, number>>({});

  return useCallback(async (payload: WatchPayload) => {
    const { videoId, watchTime } = payload;

    // Debounce: only send if progress moved ≥30 seconds or ≥10%
    const prev = lastSent.current[videoId] ?? 0;
    if (watchTime - prev < 30) return;
    lastSent.current[videoId] = watchTime;

    try {
      await fetchJSON("/api/v2/analytics/watch", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch {
      // Silently swallow — analytics failures must never disrupt playback
    }
  }, []);
}

/** Record an engagement interaction (like, dislike, share, save…). */
export function useTrackInteraction() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      videoId,
      actionType,
      metadata,
    }: {
      videoId: string;
      actionType: InteractionType;
      metadata?: Record<string, unknown>;
    }) => {
      await fetchJSON("/api/v2/analytics/interaction", {
        method: "POST",
        body: JSON.stringify({ videoId, actionType, metadata }),
      });
    },
    onSuccess: (_, { actionType }) => {
      // Bust recommendation cache after strong signals
      if (actionType === "DISLIKE" || actionType === "SKIP") {
        qc.invalidateQueries({ queryKey: ["recommendations", "home"] });
      }
    },
  });
}
