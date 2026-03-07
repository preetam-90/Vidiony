"use client";

import Link from "next/link";
import { Play, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { VideoCardData } from "@/lib/api";

interface YTVideoCardProps {
  video: VideoCardData;
}

function getBestThumb(thumbnails: { url: string; width: number; height: number }[]) {
  if (!thumbnails?.length) return null;
  return thumbnails.find((t) => t.width >= 320) ?? thumbnails[thumbnails.length - 1];
}

export function YTVideoCard({ video }: YTVideoCardProps) {
  const thumb = getBestThumb(video.thumbnails);
  const channelThumb = video.channelThumbnail;

  return (
    <Link href={`/watch/${video.id}`} className="group block">
      <div className="relative overflow-hidden rounded-xl bg-card transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden bg-muted">
          {thumb ? (
            <img
              src={thumb.url}
              alt={video.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground">
              <Play className="h-8 w-8" />
            </div>
          )}
          {/* Duration */}
          {video.duration && (
            <div className="absolute bottom-2 right-2 rounded-md bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
              {video.duration}
            </div>
          )}
          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:opacity-100">
              <Play className="ml-1 h-5 w-5 fill-primary text-primary" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex gap-3 p-3">
          {/* Channel avatar */}
          <div className="h-9 w-9 flex-shrink-0 rounded-full overflow-hidden bg-muted">
            {channelThumb ? (
              <img src={channelThumb.url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground font-bold">
                {video.channelName?.charAt(0) ?? "?"}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug group-hover:text-primary transition-colors">
              {video.title}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground truncate font-medium">
              {video.channelName}
            </p>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
              {video.viewCount && <span>{video.viewCount} views</span>}
              {video.publishedAt && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {video.publishedAt}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

/** Skeleton placeholder for loading state */
export function YTVideoCardSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl">
          <div className="aspect-video animate-pulse bg-muted rounded-t-xl" />
          <div className="flex gap-3 p-3">
            <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
