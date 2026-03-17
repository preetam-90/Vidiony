"use client";

import { useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { HomeVideoCard } from "./HomeVideoCard";
import { SectionHeader } from "./SectionHeader";
import { useCategoryVideos } from "@/hooks/useCategoryVideos";
import type { VideoCardData } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * 🔥 Hyped Right Now — trending / momentum-ranked videos.
 * Horizontal scrollable row with rank badges for top 5.
 */
export function HypedSection() {
  const { data: videos, isLoading } = useCategoryVideos("tech-news");
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
      left: dir === "left" ? -400 : 400,
      behavior: "smooth",
    });
  };

  if (isLoading) {
    return (
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-[14px]" />
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-[280px] shrink-0 space-y-2 lg:w-[300px]">
              <Skeleton className="aspect-video w-full rounded-xl" />
              <div className="flex gap-2.5">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!videos?.length) return null;

  return (
    <section className="space-y-5">
      <SectionHeader
        icon={<Flame className="h-5 w-5 text-white" />}
        title="🔥 Hyped Right Now"
        subtitle="Rapidly gaining momentum"
        accentColor="from-orange-500 to-red-500"
        href="/trending"
      />

      <div className="group/row relative">
        {showLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute -left-1 top-[35%] z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/80 text-white shadow-xl ring-1 ring-white/10 opacity-0 transition-all duration-200 group-hover/row:opacity-100 hover:bg-white hover:text-black hover:scale-105"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="no-scrollbar flex gap-3 overflow-x-auto scroll-smooth pb-1"
        >
          {videos.slice(0, 12).map((video: VideoCardData, idx: number) => (
            <div key={video.id} className="relative w-[280px] shrink-0 lg:w-[300px]">
              {/* Rank badge for top 5 */}
              {idx < 5 && (
                <div className="absolute -left-1.5 -top-1.5 z-30 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-600 text-[10px] font-black text-white shadow-lg shadow-red-500/30 ring-2 ring-[#09090b]">
                  {idx + 1}
                </div>
              )}
              <HomeVideoCard video={video} index={idx} />
            </div>
          ))}
        </div>

        {showRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute -right-1 top-[35%] z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/80 text-white shadow-xl ring-1 ring-white/10 opacity-0 transition-all duration-200 group-hover/row:opacity-100 hover:bg-white hover:text-black hover:scale-105"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </section>
  );
}
