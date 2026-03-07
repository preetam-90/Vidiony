"use client";

import { useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { VideoCard } from "@/components/VideoCard";
import { useCategoryVideos } from "@/hooks/useCategoryVideos";
import { CategoryRowSkeleton } from "@/components/SkeletonLoader";
import type { VideoCardData } from "@/lib/api";

interface CategoryRowProps {
  title: string;
  category: string;
  emoji?: string;
}

export function CategoryRow({ title, category, emoji }: CategoryRowProps) {
  const { data: videos, isLoading } = useCategoryVideos(category);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeft(scrollLeft > 10);
    setShowRight(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -600 : 600,
      behavior: "smooth",
    });
  };

  if (isLoading) return <CategoryRowSkeleton />;
  if (!videos?.length) return null;

  return (
    <div className="space-y-4">
      {/* Row header */}
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl font-bold text-white">
          {emoji && <span>{emoji}</span>}
          {title}
        </h2>
        <button className="text-sm font-medium text-violet-400 transition hover:text-violet-300">
          See all →
        </button>
      </div>

      {/* Scrollable row */}
      <div className="group/row relative">
        {/* Left arrow */}
        {showLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute -left-2 top-1/3 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/80 text-white shadow-xl opacity-0 transition-all duration-200 group-hover/row:opacity-100 hover:bg-white hover:text-black"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="no-scrollbar flex gap-4 overflow-x-auto scroll-smooth pb-2"
        >
          {videos.slice(0, 12).map((video: VideoCardData) => (
            <div key={video.id} className="w-[280px] shrink-0 lg:w-[300px]">
              <VideoCard video={video} />
            </div>
          ))}
        </div>

        {/* Right arrow */}
        {showRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute -right-2 top-1/3 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/80 text-white shadow-xl opacity-0 transition-all duration-200 group-hover/row:opacity-100 hover:bg-white hover:text-black"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
