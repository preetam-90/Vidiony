import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useRecentVideos() {
  return useQuery({
    queryKey: ["recent-videos"],
    queryFn: () => api.getFeed(2, 8),
    staleTime: 3 * 60 * 1000,
    select: (data) => data.videos,
  });
}
