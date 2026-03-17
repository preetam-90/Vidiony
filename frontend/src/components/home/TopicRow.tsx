"use client";

import { useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HomeVideoCard } from "./HomeVideoCard";
import { SectionHeader } from "./SectionHeader";
import { useCategoryVideos } from "@/hooks/useCategoryVideos";
import { Skeleton } from "@/components/ui/skeleton";
import type { VideoCardData } from "@/lib/api";

interface TopicRowProps {
  title: string;
  category: string;
  icon: React.ReactNode;
  accentColor?: string;
}

export function TopicRow({
  title,
  category,
  icon,
  accentColor = "from-violet-500 to-indigo-500",
}: TopicRowProps) {
  const { data: videos, isLoading } = useCategoryVideos(category);
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
      left: dir === "left" ? -480 : 480,
      behavior: "smooth",
    });
  };

  if (isLoading) {
    return (
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-[14px]" />
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-[260px] shrink-0 lg:w-[280px]">
              <Skeleton className="aspect-video w-full rounded-xl" />
              <div className="mt-2 space-y-1.5">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3 w-2/3" />
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
      <SectionHeader icon={icon} title={title} accentColor={accentColor} />

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
            <div key={video.id} className="w-[260px] shrink-0 lg:w-[280px]">
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
