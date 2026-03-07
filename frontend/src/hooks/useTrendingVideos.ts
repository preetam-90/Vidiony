/**
 * Hook for trending videos — fetches a single larger batch for the homepage grid.
 * Uses a standard query (not infinite) so all videos arrive in one shot.
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useTrendingVideos() {
  return useQuery({
    queryKey: ["trending-videos-home"],
    queryFn: async () => {
      // Fetch two pages in parallel so we have 16 videos for hero + grid
      const [page1, page2] = await Promise.all([
        api.getFeed(1, 8),
        api.getFeed(2, 8),
      ]);
      return {
        videos: [...page1.videos, ...page2.videos],
      };
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}
