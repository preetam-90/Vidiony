import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useInfiniteFeed() {
  return useInfiniteQuery({
    queryKey: ["infinite-feed"],
    queryFn: ({ pageParam = 3 }) => api.getFeed(pageParam, 12),
    staleTime: 3 * 60 * 1000,
    initialPageParam: 3,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.videos.length < 12) return undefined;
      return 3 + allPages.length;
    },
  });
}
