"use client";

import { useEffect, useRef } from "react";
import { useInView } from "react-intersection-observer";
import { Loader2, Flame } from "lucide-react";
import { VideoCard } from "@/components/VideoCard";
import { FeaturedHeroVideo } from "@/components/FeaturedHeroVideo";
import { VideoGridSkeleton, HeroSkeleton } from "@/components/SkeletonLoader";
import { useInfiniteFeed } from "@/hooks/useInfiniteFeed";
import type { VideoCardData } from "@/lib/api";

interface InfiniteVideoFeedProps {
  category?: string;
  showHero?: boolean;
}

export function InfiniteVideoFeed({
  category = "all",
  showHero = false,
}: InfiniteVideoFeedProps) {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteFeed(category);

  // Sentinel — sits 600 px below the last card, fires before the user reaches it
  const { ref: sentinelRef, inView } = useInView({
    threshold: 0,
    rootMargin: "600px",
  });

  // Trigger next page load when sentinel enters the viewport
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Flatten pages and deduplicate by video id
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

  // ── Initial loading ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        {showHero && <HeroSkeleton />}
        <VideoGridSkeleton count={12} />
      </div>
    );
  }

  if (!videos.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-white/30">
        <Flame className="mb-3 h-8 w-8 opacity-40" />
        <p className="text-sm">No videos found for this category.</p>
      </div>
    );
  }

  const heroVideo = showHero ? videos[0] : null;
  const gridVideos = showHero ? videos.slice(1) : videos;

  return (
    <div className="space-y-6">
      {/* Featured hero — first video only */}
      {heroVideo && <FeaturedHeroVideo video={heroVideo} />}

      {/* Main video grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {gridVideos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>

      {/* Skeleton placeholders while next batch loads */}
      {isFetchingNextPage && (
        <div className="pt-2">
          <VideoGridSkeleton count={8} />
        </div>
      )}

      {/* Invisible sentinel — scroll trigger */}
      <div ref={sentinelRef} className="h-4" aria-hidden="true" />

      {/* Subtle loading indicator below the grid */}
      {isFetchingNextPage && (
        <div className="flex items-center justify-center gap-2 py-2 text-white/30">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs tracking-wide">Loading more videos…</span>
        </div>
      )}

      {/* End-of-feed */}
      {!hasNextPage && videos.length > 0 && (
        <div className="flex flex-col items-center gap-1 py-10 text-white/20">
          <div className="mb-2 h-px w-24 bg-white/10" />
          <p className="text-xs tracking-widest uppercase">You&apos;ve seen it all</p>
        </div>
      )}
    </div>
  );
}
