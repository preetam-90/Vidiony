"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRelatedVideos, useSearch } from "@/hooks/useYoutube";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, Clock } from "lucide-react";
import type { VideoCardData } from "@/lib/api";
import { HoverVideoPlayer } from "./HoverVideoPlayer";

interface RelatedVideosProps {
  videoId: string;
  fallbackQuery?: string;
}

const INITIAL_BATCH = 8;
const LOAD_MORE_BATCH = 8;

function getBestThumb(thumbnails: { url: string; width: number; height: number }[]) {
  if (!thumbnails?.length) return null;
  return thumbnails.find((t) => t.width >= 320) ?? thumbnails[thumbnails.length - 1];
}

function RelatedVideoCard({ video, thumb }: { video: VideoCardData; thumb: { url: string } | null }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      href={`/watch/${video.id}`}
      className="group flex gap-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-video w-40 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
        {thumb ? (
          <HoverVideoPlayer
            videoId={video.id}
            thumbnailUrl={thumb.url}
            isHovered={isHovered}
            imageClassName="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Play className="h-6 w-6" />
          </div>
        )}
        {video.duration && (
          <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[10px] font-medium text-white pointer-events-none z-30">
            {video.duration}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="line-clamp-2 text-sm font-medium transition-colors group-hover:text-primary">
          {video.title}
        </h4>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {video.channelName}
        </p>
        <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
          {video.viewCount && <span>{video.viewCount} views</span>}
          {video.publishedAt && (
            <>
              <span>•</span>
              <span className="flex items-center gap-0.5">
                <Clock className="h-3 w-3" />
                {video.publishedAt}
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

export function RelatedVideos({ videoId, fallbackQuery = "" }: RelatedVideosProps) {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH);

  const { data: relatedVideos, isLoading: isLoadingRelated } = useRelatedVideos(videoId);
  const { data: searchedVideos, isLoading: isLoadingSearch } = useSearch(fallbackQuery);

  const fallbackVideos = useMemo(
    () => searchedVideos?.filter((video) => video.id !== videoId) ?? [],
    [searchedVideos, videoId]
  );

  const allVideos = useMemo(
    () => (relatedVideos?.length ? relatedVideos : fallbackVideos),
    [relatedVideos, fallbackVideos]
  );

  const recommendedVideos = allVideos.slice(0, visibleCount);
  const hasMore = visibleCount < allVideos.length;
  const isLoading = isLoadingRelated || (!relatedVideos?.length && !!fallbackQuery && isLoadingSearch);
  const heading = relatedVideos?.length ? "Recommended Videos" : "More to watch";

  useEffect(() => {
    setVisibleCount(INITIAL_BATCH);
  }, [videoId, fallbackQuery, relatedVideos?.length, fallbackVideos.length]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;

        setVisibleCount((current) => Math.min(current + LOAD_MORE_BATCH, allVideos.length));
      },
      {
        root: null,
        rootMargin: "300px 0px",
        threshold: 0.1,
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [allVideos.length, hasMore]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-2">
            <Skeleton className="aspect-video w-40 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!recommendedVideos.length) return null;

  return (
    <div>
      <h3 className="mb-3 font-semibold">{heading}</h3>
      <div className="space-y-3">
        {recommendedVideos.map((video) => {
          const thumb = getBestThumb(video.thumbnails);
          return <RelatedVideoCard key={video.id} video={video} thumb={thumb} />;
        })}

        {hasMore && (
          <div ref={loadMoreRef} className="space-y-3 pt-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-2 opacity-70">
                <Skeleton className="aspect-video w-40 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
