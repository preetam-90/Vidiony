"use client";

import Link from "next/link";
import { useState } from "react";
import { Trash2, Play, Clock } from "lucide-react";
import { HoverVideoPlayer } from "@/components/video/HoverVideoPlayer";
import { WatchLaterButton } from "@/components/video/WatchLaterButton";
import { AddToQueueButton } from "@/components/video/AddToQueueButton";
import { usePlayerStore } from "@/store/playerStore";
import type { WatchHistoryItem } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export interface HistoryVideoCardProps {
  item: WatchHistoryItem;
  onRemove: (videoId: string) => void;
  isInHistory: boolean; // true if this card is in the history grid (not in continue watching)
}

function formatTime(s?: number) {
  if (!s || isNaN(s)) return "0:00";
  const sec = Math.floor(s);
  const m = Math.floor(sec / 60);
  const r = sec % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function getRelativeTimeFromMs(ms: number) {
  const date = new Date(ms);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays} days ago`;
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks} weeks ago`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths} months ago`;
  return `${Math.floor(diffInDays / 365)} years ago`;
}

export function HistoryVideoCard({
  item,
  onRemove,
  isInHistory = true,
}: HistoryVideoCardProps) {
  const percent = item.duration !== null && item.duration > 0 ? Math.min(100, Math.max(0, Math.round(((item.progress ?? 0) / Math.max(1, item.duration)) * 100))) : 0;
  const isAnyPlaying = usePlayerStore((s) => s.isPlaying);
  const [isHovered, setIsHovered] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Link
      href={`/watch/${item.videoId}`}
      className="group relative flex flex-col overflow-hidden rounded-xl bg-white/[0.02] ring-1 ring-white/[0.06] transition-all duration-500 hover:bg-white/[0.04] hover:ring-white/[0.1] hover:shadow-2xl hover:shadow-red-500/5 hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail with hover video player */}
      <div className="relative aspect-video w-full overflow-hidden">
        {item.thumbnail ? (
          <HoverVideoPlayer
            videoId={item.videoId}
            thumbnailUrl={item.thumbnail}
            isHovered={isHovered}
            imageClassName="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-white/[0.03]">
            <Play className="h-8 w-8 text-white/15" />
          </div>
        )}

        {/* Progress bar — full-width at bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-20 h-[3px] bg-white/[0.08]">
          <div
            className="h-full rounded-r-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Duration badge */}
        {item.duration && item.progress && (
          <span className="absolute bottom-2 right-2 rounded-md bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white z-20">
            {formatTime(item.progress)} / {formatTime(item.duration)}
          </span>
        )}

        {/* Hover actions: Watch Later, Add to Queue, More */}
        <div className="absolute top-2 right-2 z-20 flex flex-col gap-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
          {isAnyPlaying && (
            <WatchLaterButton
              videoId={item.videoId}
              title={item.title}
              thumbnail={item.thumbnail}
              channelName={item.channelName}
              duration={item.duration}
              variant="icon"
            />
          )}
          <AddToQueueButton
            videoId={item.videoId}
            className="flex h-7 w-7 items-center justify-center rounded-md bg-black/60 text-white/80 backdrop-blur-sm transition-all hover:bg-white hover:text-black hover:scale-110"
          />
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleOpen}
              className="p-1 rounded hover:bg-white/10"
            >
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
        </div>

        {/* Hover play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/30">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-2xl transition-all duration-300 group-hover:scale-100 group-hover:opacity-100">
            <Play className="ml-0.5 h-4 w-4 fill-[#09090b] text-[#09090b]" />
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="space-y-2 p-4">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white/95 transition-colors group-hover:text-white">
          {item.title}
        </h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-medium text-sm text-muted-foreground truncate">{item.channelName}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {getRelativeTimeFromMs(Number(item.watchedAt))}
          </span>
        </div>
      </div>

      {/* Remove button (if in history grid) */}
      {isInHistory && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onRemove(item.videoId);
          }}
          className="mt-2 w-full text-xs font-medium text-destructive hover:text-destructive/80"
        >
          Remove from history
        </button>
      )}

      {/* Dropdown menu for remove (triggered by the more button above) */}
      <DropdownMenuContent
        side="right"
        align="end"
        className="w-48 bg-white/[0.05] backdrop-blur-xl border border-white/10"
      >
        <DropdownMenuItem onSelect={() => {
          onRemove(item.videoId);
          handleClose();
        }}>
          Remove from history
        </DropdownMenuItem>
      </DropdownMenuContent>
    </Link>
  );
}