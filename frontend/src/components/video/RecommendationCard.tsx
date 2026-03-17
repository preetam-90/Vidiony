"use client";

import Link from "next/link";
import { Play, Users, TrendingUp, Heart } from "lucide-react";
import { useState } from "react";
import { HoverVideoPlayer } from "./HoverVideoPlayer";
import { WatchLaterButton } from "./WatchLaterButton";
import { AddToQueueButton } from "./AddToQueueButton";
import { VideoOptionsMenu } from "./VideoOptionsMenu";
import { usePlayerStore } from "@/store/playerStore";
import type { RecommendationItem } from "@/hooks/useRecommendations";
import { Skeleton } from "@/components/ui/skeleton";

interface RecommendationCardProps {
  video: RecommendationItem;
  variant?: "grid" | "list";
}

const SOURCE_BADGE: Record<
  RecommendationItem["source"],
  { label: string; icon: React.ReactNode; color: string }
> = {
  collaborative: { label: "Trending with peers", icon: <Users className="h-2.5 w-2.5" />,      color: "text-sky-400" },
  channel:       { label: "Your channel",         icon: <Heart className="h-2.5 w-2.5" />,       color: "text-pink-400" },
  category:      { label: "Based on history",     icon: <Play className="h-2.5 w-2.5" />,         color: "text-violet-400" },
  trending:      { label: "Trending",              icon: <TrendingUp className="h-2.5 w-2.5" />,  color: "text-amber-400" },
  cold_start:    { label: "Popular",               icon: <TrendingUp className="h-2.5 w-2.5" />,  color: "text-white/40" },
};

// ─── Grid card (home page) ─────────────────────────────────────────────────────
function GridCard({ video }: { video: RecommendationItem }) {
  const badge = SOURCE_BADGE[video.source];
  const [isHovered, setIsHovered] = useState(false);
  const isAnyPlaying = usePlayerStore((s) => s.isPlaying);

  return (
    <Link href={`/watch/${video.id}`} className="group flex flex-col gap-2" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden rounded-xl bg-white/5">
        {video.thumbnail ? (
          <HoverVideoPlayer
            videoId={video.id}
            thumbnailUrl={video.thumbnail}
            isHovered={isHovered}
            imageClassName="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            disableAutoplay={isAnyPlaying}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Play className="h-8 w-8 text-white/20" />
          </div>
        )}
        {video.duration && (
          <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
            {video.duration}
          </span>
        )}
        {/* Hover play */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm ring-1 ring-white/20">
            <Play className="h-5 w-5 fill-white text-white" />
          </div>
        </div>

        <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
          {isAnyPlaying && (
            <WatchLaterButton
              videoId={video.id}
              title={video.title}
              thumbnail={video.thumbnail}
              channelName={video.channelName}
              channelId={video.channelId}
              duration={video.duration}
              variant="icon"
            />
          )}
          <AddToQueueButton
            videoId={video.id}
            className="flex h-7 w-7 items-center justify-center rounded-md bg-black/60 text-white/80 backdrop-blur-sm transition-all hover:bg-white hover:text-black hover:scale-110"
          />
        </div>
      </div>

      {/* Metadata */}
      <div className="space-y-1 px-0.5">
        <h4 className="line-clamp-2 text-sm font-medium leading-snug text-white/90 transition-colors group-hover:text-white">
          {video.title}
        </h4>
        <p className="truncate text-xs text-white/50">{video.channelName}</p>
        <div className="flex items-center gap-2">
          {video.viewCount && (
            <span className="text-[11px] text-white/30">{video.viewCount} views</span>
          )}
          {video.publishedAt && (
            <span className="text-[11px] text-white/30">· {video.publishedAt}</span>
          )}
        </div>
        {/* Source badge */}
        <div className={`flex items-center gap-1 ${badge.color}`}>
          {badge.icon}
          <span className="text-[10px] font-medium uppercase tracking-wide opacity-70">
            {badge.label}
          </span>
        </div>

        <div className="flex justify-end pt-1">
          <VideoOptionsMenu
            videoId={video.id}
            title={video.title}
            thumbnail={video.thumbnail}
            channelName={video.channelName}
            channelId={video.channelId}
            duration={video.duration}
          />
        </div>
      </div>
    </Link>
  );
}

// ─── List card (sidebar) ───────────────────────────────────────────────────────
function ListCard({ video }: { video: RecommendationItem }) {
  const [isHovered, setIsHovered] = useState(false);
  const isAnyPlaying = usePlayerStore((s) => s.isPlaying);

  return (
    <Link href={`/watch/${video.id}`} className="group flex gap-3" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <div className="relative aspect-video w-40 shrink-0 overflow-hidden rounded-lg bg-white/5">
        {video.thumbnail ? (
          <HoverVideoPlayer
            videoId={video.id}
            thumbnailUrl={video.thumbnail}
            isHovered={isHovered}
            imageClassName="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            disableAutoplay
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Play className="h-6 w-6 text-white/20" />
          </div>
        )}
        {video.duration && (
          <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[10px] font-medium text-white">
            {video.duration}
          </span>
        )}

        <div className="absolute top-1 right-1 z-10 flex flex-col gap-0.5 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
          {isAnyPlaying && (
            <WatchLaterButton
              videoId={video.id}
              title={video.title}
              thumbnail={video.thumbnail}
              channelName={video.channelName}
              channelId={video.channelId}
              duration={video.duration}
              variant="icon"
            />
          )}
          <AddToQueueButton
            videoId={video.id}
            className="flex h-6 w-6 items-center justify-center rounded-md bg-black/60 text-white/80 backdrop-blur-sm transition-all hover:bg-white hover:text-black hover:scale-110"
          />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="line-clamp-2 text-sm font-medium leading-snug text-white/90 transition-colors group-hover:text-white">
          {video.title}
        </h4>
        <p className="mt-0.5 truncate text-xs text-white/40">{video.channelName}</p>
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-white/30">
          {video.viewCount && <span>{video.viewCount} views</span>}
          {video.publishedAt && (
            <>
              <span>·</span>
              <span>{video.publishedAt}</span>
            </>
          )}
        </div>

        <div className="flex justify-end">
          <VideoOptionsMenu
            videoId={video.id}
            title={video.title}
            thumbnail={video.thumbnail}
            channelName={video.channelName}
            channelId={video.channelId}
            duration={video.duration}
          />
        </div>
      </div>
    </Link>
  );
}

// ─── Public API ────────────────────────────────────────────────────────────────

export function RecommendationCard({ video, variant = "grid" }: RecommendationCardProps) {
  return variant === "grid" ? <GridCard video={video} /> : <ListCard video={video} />;
}

// ─── Skeleton placeholders ─────────────────────────────────────────────────────

export function RecommendationGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-video w-full rounded-xl" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}

export function RecommendationListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="aspect-video w-40 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
