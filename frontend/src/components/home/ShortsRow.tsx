"use client";

import Link from "next/link";
import { Play, Zap } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HoverVideoPlayer } from "@/components/video/HoverVideoPlayer";
import { SectionHeader } from "./SectionHeader";
import { useCategoryVideos } from "@/hooks/useCategoryVideos";
import { Skeleton } from "@/components/ui/skeleton";
import type { VideoCardData } from "@/lib/api";

function ShortCard({ video }: { video: VideoCardData }) {
  const thumb =
    video.thumbnails?.find((t) => t.width >= 320) ??
    video.thumbnails?.[video.thumbnails.length - 1];
  const [isHovered, setIsHovered] = useState(false);

  return (
      <Link
        href={`/shorts/${video.id}`}
      className="group block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative w-[140px] overflow-hidden rounded-xl bg-white/[0.02] ring-1 ring-white/[0.06] transition-all duration-500 hover:-translate-y-1.5 hover:ring-red-500/20 hover:shadow-2xl hover:shadow-red-500/10 sm:w-[156px]">
        <div className="relative aspect-[9/16] overflow-hidden">
          {thumb ? (
            <HoverVideoPlayer
              videoId={video.id}
              thumbnailUrl={thumb.url}
              isHovered={isHovered}
              imageClassName="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-white/[0.03]" />
          )}

          {/* Gradient overlay — always visible */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

          {/* Shorts badge */}
          <div className="absolute left-1.5 top-1.5 z-20 flex items-center gap-0.5 rounded-md bg-red-500/90 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white">
            <Zap className="h-2 w-2" />
            Short
          </div>

          {/* Duration */}
          {video.duration && (
            <div className="absolute right-1.5 top-1.5 z-20 rounded-md bg-black/50 px-1 py-0.5 text-[8px] font-bold text-white/70 backdrop-blur-sm">
              {video.duration}
            </div>
          )}

          {/* Play overlay */}
          <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100">
            <div className="flex h-10 w-10 scale-50 items-center justify-center rounded-full bg-white/90 shadow-2xl transition-transform duration-300 group-hover:scale-100">
              <Play className="ml-0.5 h-4 w-4 fill-[#09090b] text-[#09090b]" />
            </div>
          </div>

          {/* Bottom info */}
          <div className="absolute bottom-0 left-0 right-0 z-10 p-2.5">
            <h3 className="line-clamp-2 text-[10px] font-semibold leading-tight text-white/90">
              {video.title}
            </h3>
            {video.viewCount && (
              <p className="mt-0.5 text-[9px] font-medium text-white/40">
                {video.viewCount}
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function ShortsRow() {
  const { data: videos, isLoading } = useCategoryVideos("shorts");
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

  if (isLoading) {
    return (
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-[14px]" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="flex gap-2.5 overflow-hidden">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton
              key={i}
              className="aspect-[9/16] w-[140px] shrink-0 rounded-xl sm:w-[156px]"
            />
          ))}
        </div>
      </section>
    );
  }

  if (!videos?.length) return null;

  return (
    <section className="space-y-5">
      {/* Visual break — horizontal line */}
      <div className="h-px bg-gradient-to-r from-transparent via-red-500/15 to-transparent" />

      <SectionHeader
        icon={<Zap className="h-5 w-5 text-white" />}
        title="Shorts"
        subtitle="Quick bites · under 60 seconds"
        accentColor="from-red-500 to-pink-500"
        badge="NEW"
      />

      <div className="group/row relative">
        {showLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute -left-1 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/80 text-white shadow-xl ring-1 ring-white/10 opacity-0 transition-all group-hover/row:opacity-100 hover:bg-white hover:text-black"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="no-scrollbar flex gap-2.5 overflow-x-auto scroll-smooth pb-1"
        >
          {videos.slice(0, 14).map((video) => (
            <ShortCard key={video.id} video={video} />
          ))}
        </div>

        {showRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute -right-1 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/80 text-white shadow-xl ring-1 ring-white/10 opacity-0 transition-all group-hover/row:opacity-100 hover:bg-white hover:text-black"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Visual break — horizontal line */}
      <div className="h-px bg-gradient-to-r from-transparent via-red-500/15 to-transparent" />
    </section>
  );
}
