"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

type VideoThumb = { url: string; width: number; height: number };
export type VideoCardData = {
  id: string;
  title: string;
  thumbnails: VideoThumb[];
  duration?: string;
  viewCount?: string;
  publishedAt?: string;
  channelName?: string;
  channelId?: string;
  channelThumbnail?: VideoThumb | null;
};

export type HomeSection = { title: string; videos: VideoCardData[] };

export function useHomepageFeedApi() {
  return useInfiniteQuery< { sections: HomeSection[]; continuationToken: string | null }, Error>({
    queryKey: ["home-feed", "api"],
    initialPageParam: null,
    staleTime: 1 * 60 * 1000,
    queryFn: async ({ pageParam }) => {
      const token = (pageParam ?? "") as string;
      const url = `/api/home-feed${token ? `?continuation=${encodeURIComponent(token)}` : ""}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        throw new Error(`Failed to fetch home feed: ${res.status}`);
      }
      const data = await res.json();
      // Ensure shape
      return {
        sections: Array.isArray(data.sections) ? data.sections : [],
        continuationToken: data.continuationToken ?? null,
      };
    },
    getNextPageParam: (lastPage) => {
      return lastPage.continuationToken ?? undefined;
    },
  });
}
