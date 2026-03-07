"use client";

import { useEffect, useRef } from "react";
import { useInView } from "react-intersection-observer";
import Link from "next/link";
import { Play, RefreshCw, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { YTVideoCard } from "@/components/video/YTVideoCard";
import { YTVideoCardSkeleton } from "@/components/video/YTVideoCard";
import type { VideoCardData } from "@/lib/api";

interface HomeVideoSectionProps {
  videos: VideoCardData[];
  isLoading?: boolean;
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
  isFetchingNextPage?: boolean;
  error?: Error | null;
}

export function HomeVideoSection({
  videos,
  isLoading,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
  error,
}: HomeVideoSectionProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "100px",
  });

  // Trigger fetch when sentinel comes into view
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && fetchNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Error state
  if (error && !isLoading) {
    return (
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-6 text-center">
            <p className="text-destructive text-sm mb-3">
              Failed to load videos. Please try again.
            </p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </section>
    );
  }

  // Loading state (initial)
  if (isLoading && videos.length === 0) {
    return (
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Trending Videos</h2>
          </div>
          <YTVideoCardSkeleton count={12} />
        </div>
      </section>
    );
  }

  const featuredVideo = videos[0];
  const gridVideos = videos.slice(1);

  return (
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Trending Videos</h2>
        </div>

        {/* Featured Video */}
        {featuredVideo && (
          <div className="mb-12">
            <Link href={`/watch/${featuredVideo.id}`} className="group block">
              <div className="relative overflow-hidden rounded-xl bg-card shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-primary/20">
                {/* Thumbnail */}
                <div className="relative aspect-video sm:aspect-[21/9] overflow-hidden bg-muted">
                  {(() => {
                    const thumb = featuredVideo.thumbnails?.find((t) => t.width >= 640) ||
                      featuredVideo.thumbnails?.[featuredVideo.thumbnails.length - 1];
                    return thumb ? (
                      <img
                        src={thumb.url}
                        alt={featuredVideo.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="eager"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                        <Play className="h-12 w-12" />
                      </div>
                    );
                  })()}
                  {/* Gradient overlay for text readability */}
                  <div className="absolute inset-0 video-gradient" />

                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 opacity-80 shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:opacity-100">
                      <Play className="ml-1 h-8 w-8 fill-primary text-primary" />
                    </div>
                  </div>

                  {/* Duration */}
                  {featuredVideo.duration && (
                    <div className="absolute bottom-3 right-3 rounded-md bg-black/80 px-2 py-1 text-sm font-medium text-white">
                      {featuredVideo.duration}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5">
                  <h3 className="text-lg sm:text-xl font-bold leading-tight mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {featuredVideo.title}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="font-medium">{featuredVideo.channelName}</span>
                    <span>•</span>
                    <span>{featuredVideo.viewCount} views</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      {featuredVideo.publishedAt}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Video Grid */}
        {gridVideos.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {gridVideos.map((video) => (
              <YTVideoCard key={video.id} video={video} />
            ))}
          </div>
        )}

        {/* Loading More Indicator */}
        {isFetchingNextPage && (
          <div className="mt-8">
            <YTVideoCardSkeleton count={4} />
          </div>
        )}

        {/* Infinite Scroll Sentinel */}
        {hasNextPage && !isLoading && (
          <div ref={ref} className="h-10 mt-8 flex items-center justify-center">
            {isFetchingNextPage ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading more...</span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Scroll for more</span>
            )}
          </div>
        )}

        {/* End of content */}
        {!hasNextPage && videos.length > 0 && (
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>You've reached the end!</p>
          </div>
        )}
      </div>
    </section>
  );
}
