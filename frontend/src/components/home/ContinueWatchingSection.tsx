"use client";

import Link from "next/link";
import { Play, Clock } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HoverVideoPlayer } from "@/components/video/HoverVideoPlayer";
import { SectionHeader } from "./SectionHeader";
import type { ContinueWatchingItem } from "@/hooks/useRecommendations";

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

function ContinueCard({ item }: { item: ContinueWatchingItem }) {
  const [isHovered, setIsHovered] = useState(false);
  const remainingSecs = Math.max(0, item.duration - item.progress);

  return (
    <Link
      href={`/watch/${item.id}?t=${item.progress}`}
      className="group relative w-[260px] shrink-0 sm:w-[280px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="overflow-hidden rounded-xl bg-white/[0.02] ring-1 ring-white/[0.06] transition-all duration-500 hover:bg-white/[0.04] hover:ring-white/[0.1] hover:shadow-2xl hover:shadow-red-500/5 hover:-translate-y-1">
        {/* Thumbnail */}
        <div className="relative aspect-video w-full overflow-hidden">
          {item.thumbnail ? (
            <HoverVideoPlayer
              videoId={item.id}
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
              style={{ width: `${Math.min(item.watchPercentage, 100)}%` }}
            />
          </div>

          {/* Resume overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/30">
            <div className="flex h-11 w-11 scale-75 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-2xl transition-all duration-300 group-hover:scale-100 group-hover:opacity-100">
              <Play className="ml-0.5 h-4 w-4 fill-[#09090b] text-[#09090b]" />
            </div>
          </div>

          {/* Time remaining badge */}
          {item.duration > 0 && (
            <span className="absolute right-2 top-2 z-20 rounded-md bg-black/70 px-1.5 py-0.5 text-[9px] font-bold text-white/80 backdrop-blur-sm">
              {formatDuration(remainingSecs)} left
            </span>
          )}
        </div>

        {/* Metadata */}
        <div className="space-y-1 p-3">
          <h4 className="line-clamp-2 text-[12px] font-semibold leading-snug text-white/85 transition-colors group-hover:text-white">
            {item.title}
          </h4>
          <div className="flex items-center justify-between">
            <p className="truncate text-[10px] font-medium text-white/35">
              {item.channelName}
            </p>
            <div className="flex shrink-0 items-center gap-1 text-[9px] text-white/20">
              <Clock className="h-2.5 w-2.5" />
              <span>{timeAgo(item.watchedAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

interface ContinueWatchingSectionProps {
  items: ContinueWatchingItem[];
}

export function ContinueWatchingSection({
  items,
}: ContinueWatchingSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const checkScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeft(scrollLeft > 8);
    setShowRight(scrollLeft < scrollWidth - clientWidth - 8);
  }, []);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: dir === "left" ? -300 : 300,
      behavior: "smooth",
    });
  };

  if (!items.length) return null;

  return (
    <section className="space-y-5">
      <SectionHeader
        icon={<Play className="h-5 w-5 text-white" />}
        title="Continue Watching"
        subtitle="Pick up where you left off"
        accentColor="from-red-500 to-orange-500"
        href="/history"
      />

      <div className="group/row relative">
        {showLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute -left-1 top-[40%] z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/80 text-white shadow-xl ring-1 ring-white/10 opacity-0 transition-all duration-200 group-hover/row:opacity-100 hover:bg-white hover:text-black hover:scale-105"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="no-scrollbar flex gap-3 overflow-x-auto scroll-smooth pb-1"
        >
          {items.map((item) => (
            <ContinueCard key={item.id} item={item} />
          ))}
        </div>

        {showRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute -right-1 top-[40%] z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/80 text-white shadow-xl ring-1 ring-white/10 opacity-0 transition-all duration-200 group-hover/row:opacity-100 hover:bg-white hover:text-black hover:scale-105"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </section>
  );
}
