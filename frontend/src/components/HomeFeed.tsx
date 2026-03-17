"use client";

import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { Loader2, ChevronRight } from "lucide-react";
import Link from "next/link";
import { YTVideoCard, YTVideoCardSkeleton } from "./video/YTVideoCard";
import { useHomepageFeedApi } from "@/hooks/useHomepageFeedApi";

export function HomeFeed() {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    error,
  } = useHomepageFeedApi();

  const { ref: sentinelRef, inView } = useInView({ threshold: 0, rootMargin: "600px" });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <div className="h-6 bg-white/10 rounded animate-pulse w-48"></div>
          <div className="flex gap-4 overflow-x-hidden">
            <YTVideoCardSkeleton count={6} />
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-6 bg-white/10 rounded animate-pulse w-36"></div>
          <div className="flex gap-4 overflow-x-hidden">
            <YTVideoCardSkeleton count={6} />
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.pages.length === 0) {
    return (
      <div className="py-20 text-center text-white/40">No feed available.</div>
    );
  }

  // Aggregate sections across pages
  const sections: { title: string; videos: any[] }[] = [];
  for (const page of data.pages) {
    for (const s of page.sections) {
      // try to merge with existing section title if present
      const existing = sections.find((x) => x.title === s.title);
      if (existing) {
        existing.videos.push(...s.videos);
      } else {
        sections.push({ title: s.title || "", videos: [...s.videos] });
      }
    }
  }

  return (
    <div className="space-y-10">
      {sections.filter(s => s.videos.length > 0).map((section, idx) => (
        <section key={`${section.title}-${idx}`} className="space-y-4">
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white hover:text-white/80 transition-colors">
              {section.title || "Recommended"}
            </h2>
            <Link
              href={`/section/${(section.title || "recommended").toLowerCase().replace(/\s+/g, '-')}`}
              className="flex items-center gap-1 text-sm text-white/70 hover:text-white transition-colors"
            >
              <span>View all</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Horizontal Scrollable Row */}
          <div className="relative">
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
              {section.videos.map((v: any) => (
                <div key={v.id} className="flex-shrink-0 w-80">
                  <YTVideoCard video={v} />
                </div>
              ))}
            </div>

            {/* Gradient fade on right */}
            <div className="absolute top-0 right-0 h-full w-20 bg-gradient-to-l from-[#0f0f0f] to-transparent pointer-events-none" />
          </div>
        </section>
      ))}

      {/* Loading more sections */}
      {isFetchingNextPage && (
        <div className="space-y-4">
          <div className="h-6 bg-white/10 rounded animate-pulse w-32"></div>
          <div className="flex gap-4 overflow-x-hidden">
            <YTVideoCardSkeleton count={6} />
          </div>
        </div>
      )}

      {/* Sentinel */}
      <div ref={sentinelRef} className="h-6" aria-hidden="true" />

      {/* Loading indicator */}
      {isFetchingNextPage && (
        <div className="flex items-center justify-center gap-2 py-4 text-white/40">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs">Loading more…</span>
        </div>
      )}

      {!hasNextPage && (
        <div className="text-center py-8 text-white/30 text-sm">
          You've seen it all
        </div>
      )}
    </div>
  );
}
