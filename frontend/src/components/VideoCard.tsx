"use client";

import Link from "next/link";
import { Play, Clock } from "lucide-react";
import { useState } from "react";
import { usePlayerStore } from "@/store/playerStore";
import { HoverVideoPlayer } from "./video/HoverVideoPlayer";
import { useInView } from "react-intersection-observer";
import { WatchLaterButton } from "@/components/video/WatchLaterButton";
import { VideoOptionsMenu } from "@/components/video/VideoOptionsMenu";
import type { VideoCardData } from "@/lib/api";

interface VideoCardProps {
  video: VideoCardData;
  priority?: boolean;
}

function getBestThumb(thumbnails: { url: string; width: number; height: number }[]) {
  if (!thumbnails?.length) return null;
  return thumbnails.find((t) => t.width >= 320) ?? thumbnails[thumbnails.length - 1];
}

export function VideoCard({ video, priority = false }: VideoCardProps) {
  const thumb = getBestThumb(video.thumbnails);
  const channelThumb = video.channelThumbnail;
  const [isHovered, setIsHovered] = useState(false);
  const isAnyPlaying = usePlayerStore((s) => s.isPlaying);

  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: "200px",
  });

  return (
    <Link href={`/watch/${video.id}`} className="group block" ref={ref} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <div className="relative overflow-hidden rounded-xl bg-[#181818] transition-all duration-300 hover:translate-y-[-4px] hover:shadow-xl hover:shadow-violet-500/10 hover:ring-1 hover:ring-white/10">
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden bg-white/5">
          {(priority || inView) && thumb ? (
            <HoverVideoPlayer
              videoId={video.id}
              thumbnailUrl={thumb.url}
              isHovered={isHovered}
              imageClassName="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
            />
          ) : (
            <div className="h-full w-full bg-white/5" />
          )}

          {/* Duration badge */}
          {video.duration && (
            <div className="absolute bottom-2 right-2 rounded-md bg-black/85 px-1.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
              {video.duration}
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/30">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 opacity-0 shadow-2xl transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 scale-75">
              <Play className="ml-0.5 h-5 w-5 fill-[#0f0f0f] text-[#0f0f0f]" />
            </div>
          </div>

          {/* Top gradient for Netflix feel */}
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#181818] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>

        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
        </div>

        {/* Content */}
        <div className="flex gap-3 p-3">
          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white/10 ring-2 ring-transparent transition-all group-hover:ring-violet-500/50">
            {channelThumb ? (
              <img src={channelThumb.url} alt="" className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white/60">
                {video.channelName?.charAt(0) ?? "?"}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-white/95 transition-colors group-hover:text-white">
              {video.title}
            </h3>
            <p className="mt-1 truncate text-xs font-medium text-white/50 transition-colors group-hover:text-white/70">
              {video.channelName}
            </p>
            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-white/40">
              {video.viewCount && <span>{video.viewCount}</span>}
              {video.publishedAt && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    {video.publishedAt}
                  </span>
                </>
              )}
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
      </div>
    </Link>
  );
}
