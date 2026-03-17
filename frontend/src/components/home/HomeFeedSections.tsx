"use client";

import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { Loader2, ChevronRight } from "lucide-react";
import Link from "next/link";
import { HomeVideoCard } from "./HomeVideoCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useHomepageFeedApi } from "@/hooks/useHomepageFeedApi";

/**
 * HomeFeedSections — renders YouTube home feed sections
 * (from getHomeFeed / getTrending via the backend /api/home-feed).
 * Each section is a horizontal scrollable row.
 */
export function HomeFeedSections() {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useHomepageFeedApi();

  const { ref: sentinelRef, inView } = useInView({
    threshold: 0,
    rootMargin: "600px",
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  /* ── Loading ─────────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="space-y-12">
        {Array.from({ length: 3 }).map((_, i) => (
          <section key={i} className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-11 w-11 rounded-[14px]" />
              <Skeleton className="h-5 w-40" />
            </div>
            <div className="flex gap-3 overflow-hidden">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="w-[280px] shrink-0">
                  <Skeleton className="aspect-video w-full rounded-xl" />
                  <div className="flex gap-2.5 p-2.5">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  if (!data || data.pages.length === 0) return null;

  /* ── Aggregate sections across pages ─────────────────────────── */
  const sections: { title: string; videos: any[] }[] = [];
  for (const page of data.pages) {
    for (const s of page.sections) {
      const existing = sections.find((x) => x.title === s.title);
      if (existing) {
        existing.videos.push(...s.videos);
      } else {
        sections.push({ title: s.title || "", videos: [...s.videos] });
      }
    }
  }

  const validSections = sections.filter((s) => s.videos.length > 0);
  if (!validSections.length) return null;

  return (
    <div className="space-y-12">
      {validSections.map((section, idx) => (
        <section key={`${section.title}-${idx}`} className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2
              className="text-[17px] font-extrabold tracking-tight text-white sm:text-lg"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {section.title || "Recommended"}
            </h2>
            <Link
              href={`/section/${(section.title || "recommended")
                .toLowerCase()
                .replace(/\s+/g, "-")}`}
              className="group flex items-center gap-1 rounded-full bg-white/[0.04] px-3.5 py-1.5 text-[11px] font-semibold text-white/35 ring-1 ring-white/[0.06] transition-all hover:bg-white/[0.08] hover:text-white/60"
            >
              See all
              <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Horizontal scroll row */}
          <div className="group/row relative">
            <div className="no-scrollbar flex gap-3 overflow-x-auto scroll-smooth pb-1">
              {section.videos.map((v: any, vidIdx: number) => (
                <div key={v.id} className="w-[280px] shrink-0 lg:w-[300px]">
                  <HomeVideoCard video={v} index={vidIdx} />
                </div>
              ))}
            </div>
            {/* Right gradient fade */}
            <div className="pointer-events-none absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-[#09090b] to-transparent" />
          </div>
        </section>
      ))}

      {/* Loading more */}
      {isFetchingNextPage && (
        <section className="space-y-4">
          <Skeleton className="h-5 w-36" />
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-[280px] shrink-0">
                <Skeleton className="aspect-video w-full rounded-xl" />
              </div>
            ))}
          </div>
        </section>
      )}

      <div ref={sentinelRef} className="h-4" aria-hidden="true" />

      {isFetchingNextPage && (
        <div className="flex items-center justify-center gap-2 py-3 text-white/20">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span className="text-[11px] font-medium tracking-wide">
            Loading more…
          </span>
        </div>
      )}
    </div>
  );
}
