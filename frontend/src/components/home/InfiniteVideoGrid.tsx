"use client";

import { useEffect, memo } from "react";
import { useInView } from "react-intersection-observer";
import { Loader2, Flame } from "lucide-react";
import { HomeVideoCard } from "./HomeVideoCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useInfiniteFeed } from "@/hooks/useInfiniteFeed";
import type { VideoCardData } from "@/lib/api";

interface InfiniteVideoGridProps {
  category?: string;
}

function InfiniteVideoGridInner({ category = "all" }: InfiniteVideoGridProps) {
  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useInfiniteFeed(category);

  // Sentinel 600px before the bottom
  const { ref: sentinelRef, inView } = useInView({
    threshold: 0,
    rootMargin: "600px",
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Flatten + dedupe
  const videos: VideoCardData[] = [];
  const seen = new Set<string>();
  for (const page of data?.pages ?? []) {
    for (const v of page.videos) {
      if (!seen.has(v.id)) {
        seen.add(v.id);
        videos.push(v);
      }
    }
  }

  /* ── Loading skeleton ──────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-video w-full rounded-xl" />
            <div className="flex gap-2.5 px-0.5">
              <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-2.5 w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  /* ── Empty state ───────────────────────────────────────────── */
  if (!videos.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-white/20">
        <Flame className="mb-3 h-8 w-8 opacity-30" />
        <p className="text-sm font-medium">No videos found</p>
        <p className="mt-1 text-xs text-white/10">
          Try switching categories above
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {videos.map((video, idx) => (
          <HomeVideoCard key={video.id} video={video} index={idx % 20} />
        ))}
      </div>

      {/* Skeleton loading for next page */}
      {isFetchingNextPage && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-video w-full rounded-xl" />
              <div className="flex gap-2.5 px-0.5">
                <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invisible sentinel */}
      <div ref={sentinelRef} className="h-4" aria-hidden="true" />

      {/* Loading indicator */}
      {isFetchingNextPage && (
        <div className="flex items-center justify-center gap-2 py-2 text-white/20">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span className="text-[11px] font-medium tracking-wide">
            Loading more videos…
          </span>
        </div>
      )}

      {/* End of feed */}
      {!hasNextPage && videos.length > 0 && (
        <div className="flex flex-col items-center gap-2 py-10 text-white/10">
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
          <p className="text-[10px] font-bold uppercase tracking-[0.2em]">
            You&apos;ve reached the end
          </p>
        </div>
      )}
    </div>
  );
}

export const InfiniteVideoGrid = memo(InfiniteVideoGridInner);
