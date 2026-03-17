"use client";
import { useState } from "react";

import Link from "next/link";
import { Clock, Play } from "lucide-react";
import { usePathname } from "next/navigation";
import { HoverVideoPlayer } from "./HoverVideoPlayer";
import { WatchLaterButton } from "./WatchLaterButton";
import { AddToQueueButton } from "./AddToQueueButton";
import { usePlayerStore } from "@/store/playerStore";
import { VideoOptionsMenu } from "./VideoOptionsMenu";
import type { VideoCardData } from "@/lib/api";

interface ExtendedVideoCardData extends VideoCardData {
  description?: string;
}

interface Props {
  video: ExtendedVideoCardData;
}

function getBestThumb(thumbnails: { url: string; width: number; height: number }[]) {
  if (!thumbnails?.length) return null;
  return thumbnails.find((t) => t.width >= 480) ?? thumbnails[thumbnails.length - 1];
}

export function SearchResultCard({ video }: Props) {
  const thumb = getBestThumb(video.thumbnails);
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname();
  const isWatchPage = pathname.startsWith("/watch/");

  const isAnyPlaying = usePlayerStore((s) => s.isPlaying);

  return (
    <Link 
      href={`/watch/${video.id}`} 
      className="block group" 
      onMouseEnter={() => setIsHovered(true)} 
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex gap-4 items-start rounded-xl border border-white/6 bg-white/[0.02] p-3 hover:bg-white/[0.04] transition-colors">
        {/* Thumbnail with Video Hover Preview */}
        <div className="flex-shrink-0 w-40 md:w-56 aspect-video rounded-lg overflow-hidden bg-muted relative">
          {thumb ? (
            <HoverVideoPlayer
              videoId={video.id}
              thumbnailUrl={thumb.url}
              isHovered={isHovered}
              disableAutoplay={isAnyPlaying || isWatchPage}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground bg-black">
              <Play className="h-6 w-6" />
            </div>
          )}

          {/* Duration Badge */}
          {video.duration && (
            <div className="absolute bottom-2 right-2 rounded-md bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white z-10">
              {video.duration}
            </div>
          )}

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

        {/* Details on the right */}
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold line-clamp-2 text-white/95">{video.title}</h3>
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="font-medium text-sm text-muted-foreground truncate">{video.channelName}</span>
            {video.viewCount && <span className="truncate">• {video.viewCount} views</span>}
            {video.publishedAt && (
              <span className="flex items-center gap-1">
                • <Clock className="h-3 w-3" /> {video.publishedAt}
              </span>
            )}
          </div>

          {video.description && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{video.description}</p>
          )}

          <div className="mt-3 flex items-center gap-2">
            {/* Channel avatar placeholder */}
            <div className="h-8 w-8 rounded-full overflow-hidden bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
              {video.channelName?.charAt(0) ?? "?"}
            </div>
            <div className="text-xs text-muted-foreground">{video.channelName}</div>
          </div>

          <div className="flex justify-end mt-2">
            <VideoOptionsMenu
              videoId={video.id}
              title={video.title}
              thumbnail={thumb?.url}
              channelName={video.channelName}
              channelId={video.channelId}
              duration={video.duration}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
