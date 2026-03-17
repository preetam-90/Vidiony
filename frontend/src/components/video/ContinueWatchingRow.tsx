"use client";

import Link from "next/link";
import { Clock, Play } from "lucide-react";
import { useState } from "react";
import { HoverVideoPlayer } from "./HoverVideoPlayer";
import type { ContinueWatchingItem } from "@/hooks/useRecommendations";

interface ContinueWatchingRowProps {
  items: ContinueWatchingItem[];
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function ContinueWatchingItemCard({ item }: { item: ContinueWatchingItem }) {
  const [isHovered, setIsHovered] = useState(false);
  const remainingSecs = item.duration - item.progress;

  return (
    <Link
      href={`/watch/${item.id}?t=${item.progress}`}
      className="group relative w-[220px] shrink-0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-white/5">
        {item.thumbnail ? (
          <HoverVideoPlayer
            videoId={item.id}
            thumbnailUrl={item.thumbnail}
            isHovered={isHovered}
            imageClassName="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Play className="h-8 w-8 text-white/20" />
          </div>
        )}

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10">
          <div
            className="h-full bg-red-500 transition-all"
            style={{ width: `${item.watchPercentage}%` }}
          />
        </div>

        {/* Resume overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/70 backdrop-blur-sm pointer-events-none z-30">
            <Play className="h-4 w-4 fill-white text-white" />
          </div>
        </div>

        {/* Duration badge */}
        {item.duration > 0 && (
          <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-medium text-white z-30">
            {formatDuration(remainingSecs)} left
          </span>
        )}
      </div>

      {/* Metadata */}
      <div className="mt-2 space-y-0.5 px-0.5">
        <h4 className="line-clamp-2 text-xs font-medium leading-snug text-white/90 transition-colors group-hover:text-white">
          {item.title}
        </h4>
        <p className="truncate text-[11px] text-white/40">{item.channelName}</p>
        <div className="flex items-center gap-1 text-[10px] text-white/30">
          <Clock className="h-2.5 w-2.5" />
          <span>{timeAgo(item.watchedAt)}</span>
          <span>·</span>
          <span>{item.watchPercentage}% watched</span>
        </div>
      </div>
    </Link>
  );
}

export function ContinueWatchingRow({ items }: ContinueWatchingRowProps) {
  if (items.length === 0) return null;

  return (
    <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
      {items.map((item) => (
        <ContinueWatchingItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
