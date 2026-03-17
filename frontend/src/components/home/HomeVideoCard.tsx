"use client";

import Link from "next/link";
import { Play, Eye } from "lucide-react";
import { useState, memo } from "react";
import { useInView } from "react-intersection-observer";
import { usePathname } from "next/navigation";
import { HoverVideoPlayer } from "@/components/video/HoverVideoPlayer";
import { WatchLaterButton } from "@/components/video/WatchLaterButton";
import { AddToQueueButton } from "@/components/video/AddToQueueButton";
import { VideoOptionsMenu } from "@/components/video/VideoOptionsMenu";
import { usePlayerStore } from "@/store/playerStore";
import type { VideoCardData } from "@/lib/api";

interface HomeVideoCardProps {
  video: VideoCardData;
  priority?: boolean;
  index?: number;
}

function getBestThumb(
  thumbnails: { url: string; width: number; height: number }[]
) {
  if (!thumbnails?.length) return null;
  return (
    thumbnails.find((t) => t.width >= 320) ??
    thumbnails[thumbnails.length - 1]
  );
}

function HomeVideoCardInner({
  video,
  priority = false,
  index = 0,
}: HomeVideoCardProps) {
  const thumb = getBestThumb(video.thumbnails);
  const channelThumb = video.channelThumbnail;
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname();
  const isWatchPage = pathname.startsWith("/watch/");
  const isAnyPlaying = usePlayerStore((s) => s.isPlaying);

  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: "400px",
  });

  return (
    <Link
      href={`/watch/${video.id}`}
      className="group block animate-fade-in-up"
      ref={ref}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
    >
      <div className="relative overflow-hidden rounded-xl bg-white/[0.02] ring-1 ring-white/[0.05] transition-all duration-500 hover:-translate-y-1 hover:bg-white/[0.04] hover:ring-white/[0.1] hover:shadow-2xl hover:shadow-black/40">
        {/* ── Thumbnail ─────────────────────────────────────────── */}
        <div className="relative aspect-video overflow-hidden bg-white/[0.02]">
          {(priority || inView) && thumb ? (
            <HoverVideoPlayer
              videoId={video.id}
              thumbnailUrl={thumb.url}
              isHovered={isHovered}
              imageClassName="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              disableAutoplay={isAnyPlaying || isWatchPage}
            />
          ) : (
            <div className="h-full w-full animate-pulse bg-white/[0.03]" />
          )}

          {/* Duration badge */}
          {video.duration && (
            <div className="absolute bottom-2 right-2 z-20 rounded-md bg-black/80 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-white/90 backdrop-blur-sm">
              {video.duration}
            </div>
          )}

          {/* Center play button on hover */}
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/20">
            <div className="flex h-12 w-12 scale-50 items-center justify-center rounded-full bg-white/95 opacity-0 shadow-2xl transition-all duration-300 group-hover:scale-100 group-hover:opacity-100">
              <Play className="ml-0.5 h-5 w-5 fill-[#09090b] text-[#09090b]" />
            </div>
          </div>

          {/* Quick actions — top right */}
          <div className="absolute right-2 top-2 z-20 flex flex-col gap-1 translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
            {isAnyPlaying && (
              <>
                <WatchLaterButton
                  videoId={video.id}
                  title={video.title}
                  thumbnail={thumb?.url}
                  channelName={video.channelName}
                  channelId={video.channelId}
                  duration={video.duration}
                  variant="icon"
                />
                <AddToQueueButton
                  videoId={video.id}
                  className="flex h-7 w-7 items-center justify-center rounded-md bg-black/60 text-white/80 backdrop-blur-sm transition-all hover:bg-white hover:text-black hover:scale-110"
                />
              </>
            )}
          </div>
        </div>

        {/* ── Content ───────────────────────────────────────────── */}
        <div className="flex gap-2.5 p-3">
          {/* Channel avatar */}
          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-white/[0.06] ring-1 ring-white/[0.06] transition-all duration-300 group-hover:ring-violet-500/30">
            {channelThumb ? (
              <img
                src={channelThumb.url}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-600 to-indigo-600 text-[10px] font-bold text-white">
                {video.channelName?.charAt(0)?.toUpperCase() ?? "?"}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <h3 className="line-clamp-2 text-[13px] font-semibold leading-[1.35] text-white/90 transition-colors duration-200 group-hover:text-white">
              {video.title}
            </h3>
            <p className="truncate text-[11px] font-medium text-white/35 transition-colors duration-200 group-hover:text-violet-400/70">
              {video.channelName}
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-white/25">
              {video.viewCount && (
                <span className="flex items-center gap-0.5">
                  <Eye className="h-2.5 w-2.5" />
                  {video.viewCount}
                </span>
              )}
              {video.viewCount && video.publishedAt && (
                <span className="text-white/10">·</span>
              )}
              {video.publishedAt && <span>{video.publishedAt}</span>}
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

export const HomeVideoCard = memo(HomeVideoCardInner);
