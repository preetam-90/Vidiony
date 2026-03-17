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

export function useSectionFeed(sectionTitle: string) {
  return useInfiniteQuery< { sections: { title: string; videos: VideoCardData[] }[]; continuationToken: string | null }, Error>({
    queryKey: ["section-feed", sectionTitle],
    enabled: !!sectionTitle && sectionTitle.trim().length > 0,
    initialPageParam: null,
    staleTime: 1 * 60 * 1000,
    queryFn: async ({ pageParam }) => {
      const token = pageParam ?? "";
      const url = `/api/home-feed${token ? `?continuation=${encodeURIComponent(String(token))}` : ""}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        throw new Error(`Failed to fetch section feed: ${res.status}`);
      }
      const data = await res.json();

      // For section pages, we want to collect videos from all sections that match
      // the requested section, or if it's a generic section, collect from related sections
      const sectionVideos: VideoCardData[] = [];
      let foundExactMatch = false;

      for (const section of data.sections) {
        const sectionName = section.title.toLowerCase();
        const requestedName = sectionTitle.toLowerCase();

        // Exact match or close match
        if (sectionName.includes(requestedName) || requestedName.includes(sectionName)) {
          sectionVideos.push(...section.videos);
          foundExactMatch = true;
        }
      }

      // If no exact match, this might be a new section - return some videos anyway
      if (!foundExactMatch && data.sections.length > 0) {
        // Return videos from the first available section
        sectionVideos.push(...data.sections[0].videos);
      }

      return {
        sections: sectionVideos.length > 0 ? [{ title: sectionTitle, videos: sectionVideos }] : [],
        continuationToken: data.continuationToken ?? null,
      };
    },
    getNextPageParam: (lastPage) => {
      return lastPage.continuationToken ?? undefined;
    },
  });
}