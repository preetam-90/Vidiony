"use client";

import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { Loader2 } from "lucide-react";
import { VideoCard } from "@/components/VideoCard";
import { VideoGridSkeleton } from "@/components/SkeletonLoader";
import { useInfiniteFeed } from "@/hooks/useInfiniteFeed";

export function InfiniteVideoFeed() {
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteFeed();

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "400px",
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const videos = data?.pages.flatMap((page) => page.videos) ?? [];

  if (isLoading) {
    return <VideoGridSkeleton count={12} />;
  }

  if (!videos.length) return null;

  return (
    <div className="space-y-6">
      {/* Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>

      {/* Loading more */}
      {isFetchingNextPage && (
        <div className="pt-4">
          <VideoGridSkeleton count={4} />
        </div>
      )}

      {/* Sentinel */}
      {hasNextPage && (
        <div ref={ref} className="flex h-20 items-center justify-center">
          {isFetchingNextPage && (
            <div className="flex items-center gap-2 text-white/40">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Discovering more...</span>
            </div>
          )}
        </div>
      )}

      {/* End */}
      {!hasNextPage && videos.length > 0 && (
        <div className="py-8 text-center">
          <p className="text-sm text-white/30">You&apos;ve explored it all 🎉</p>
        </div>
      )}
    </div>
  );
}
