/**
 * TanStack Query hooks for all YouTube API endpoints.
 * Provides caching, background refetching, and loading/error states.
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

/** Home / trending feed */
export function useFeed() {
  return useQuery({
    queryKey: ["feed"],
    queryFn: () => api.getFeed(),
    staleTime: 3 * 60 * 1000, // 3 min
    select: (data) => data.videos,
  });
}

/** Search videos */
export function useSearch(query: string) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () => api.search(query),
    enabled: query.length > 0,
    staleTime: 2 * 60 * 1000,
    select: (data) => data.videos,
  });
}

/** Video details */
export function useVideo(id: string) {
  return useQuery({
    queryKey: ["video", id],
    queryFn: () => api.getVideo(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    select: (data) => data.video,
  });
}

/** Related videos */
export function useRelatedVideos(id: string) {
  return useQuery({
    queryKey: ["related", id],
    queryFn: () => api.getRelated(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    select: (data) => data.videos,
  });
}

/** Channel info */
export function useChannel(id: string) {
  return useQuery({
    queryKey: ["channel", id],
    queryFn: () => api.getChannel(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
    select: (data) => data.channel,
  });
}

/** Channel popular videos (sorted by viewCount) */
export function useChannelPopular(id: string) {
  return useQuery({
    queryKey: ["channel-popular", id],
    queryFn: () => api.getChannelPopular(id),
    enabled: !!id,
    staleTime: 60 * 60 * 1000, // 1 hour
    select: (data) => data.items,
  });
}

/** Channel about info with joinedDate */
export function useChannelAbout(id: string) {
  return useQuery({
    queryKey: ["channel-about", id],
    queryFn: () => api.getChannelAbout(id),
    enabled: !!id,
    staleTime: 4 * 60 * 60 * 1000, // 4 hours
    select: (data) => data.about,
  });
}
