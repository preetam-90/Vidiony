"use client";

import Link from "next/link";
import { Play, Clock } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { HoverVideoPlayer } from "./HoverVideoPlayer";
import { WatchLaterButton } from "./WatchLaterButton";
import { AddToQueueButton } from "./AddToQueueButton";
import { VideoOptionsMenu } from "./VideoOptionsMenu";
import { usePlayerStore } from "@/store/playerStore";
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
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname();
  const isWatchPage = pathname.startsWith("/watch/");
  const isAnyPlaying = usePlayerStore((s) => s.isPlaying);

  return (
    <Link 
      href={`/watch/${video.id}`} 
      className="group block" 
      onMouseEnter={() => setIsHovered(true)} 
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden rounded-xl bg-card transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
        {/* Thumbnail with Video Hover Preview */}
        <div className="relative aspect-video overflow-hidden bg-muted">
          {thumb ? (
            <HoverVideoPlayer
              videoId={video.id}
              thumbnailUrl={thumb.url}
              isHovered={isHovered}
              disableAutoplay={isAnyPlaying || isWatchPage}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground bg-black">
              <Play className="h-8 w-8" />
            </div>
          )}

          {/* Duration Badge */}
          {video.duration && (
            <div className="absolute bottom-2 right-2 rounded-md bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white z-10">
              {video.duration}
            </div>
          )}

          {/* Play Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20 z-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:opacity-100">
              <Play className="ml-1 h-5 w-5 fill-primary text-primary" />
            </div>
          </div>

          {/* Watch Later Icon */}
          <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
            {isAnyPlaying && (
              <WatchLaterButton
                videoId={video.id}
                title={video.title}
                thumbnail={thumb?.url}
                channelName={video.channelName}
                channelId={video.channelId}
                duration={video.duration}
                variant="icon"
              />
            )}
            {isWatchPage && (
              <AddToQueueButton
                videoId={video.id}
                className="flex h-7 w-7 items-center justify-center rounded-md bg-black/60 text-white/80 backdrop-blur-sm transition-all hover:bg-white hover:text-black hover:scale-110"
              />
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="flex gap-3 p-3">
          {/* Channel Avatar */}
          <div className="h-9 w-9 flex-shrink-0 rounded-full overflow-hidden bg-muted">
            {channelThumb ? (
              <img 
                src={channelThumb.url} 
                alt="channel" 
                className="h-full w-full object-cover" 
              />
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

          <VideoOptionsMenu
            videoId={video.id}
            title={video.title}
            thumbnail={thumb?.url}
            channelName={video.channelName}
            channelId={video.channelId}
            duration={video.duration}
          />
        </div>
    </Link>
  );
}

/** Skeleton placeholder for loading state */
export function YTVideoCardSkeleton({ count = 8 }: { count?: number }) {
  return (
    <>
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
    </>
  );
}
