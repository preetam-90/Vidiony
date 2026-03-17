"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const CATEGORIES = [
  { id: "all", label: "All", emoji: "✨" },
  { id: "gaming", label: "Gaming", emoji: "🎮" },
  { id: "music", label: "Music", emoji: "🎵" },
  { id: "programming", label: "Programming", emoji: "💻" },
  { id: "podcasts", label: "Podcasts", emoji: "🎙️" },
  { id: "ai", label: "AI", emoji: "🤖" },
  { id: "news", label: "News", emoji: "📰" },
  { id: "live", label: "Live", emoji: "🔴" },
  { id: "science", label: "Science", emoji: "🔬" },
  { id: "sports", label: "Sports", emoji: "⚽" },
  { id: "cooking", label: "Cooking", emoji: "🍳" },
  { id: "film", label: "Film & TV", emoji: "🎬" },
  { id: "education", label: "Education", emoji: "📚" },
  { id: "fitness", label: "Fitness", emoji: "💪" },
  { id: "travel", label: "Travel", emoji: "✈️" },
  { id: "design", label: "Design", emoji: "🎨" },
];

export { CATEGORIES };

interface CategoryChipsProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export function CategoryChips({
  activeCategory,
  onCategoryChange,
}: CategoryChipsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const checkScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeft(scrollLeft > 8);
    setShowRight(scrollLeft < scrollWidth - clientWidth - 8);
  }, []);

  useEffect(() => {
    checkScroll();
    activeRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeCategory, checkScroll]);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: dir === "left" ? -260 : 260,
      behavior: "smooth",
    });
  };

  return (
    <div className="sticky top-14 z-40 -mx-4 bg-[#09090b]/90 px-4 backdrop-blur-2xl lg:-mx-8 lg:px-8">
      {/* Top edge line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />

      <div className="relative py-3">
        {/* Left fade + arrow */}
        {showLeft && (
          <>
            <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-16 bg-gradient-to-r from-[#09090b] via-[#09090b]/80 to-transparent" />
            <button
              onClick={() => scroll("left")}
              className="absolute left-0 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/[0.08] text-white/70 shadow-lg backdrop-blur-md ring-1 ring-white/[0.08] transition-all duration-200 hover:bg-white/[0.14] hover:text-white hover:scale-105"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
          </>
        )}

        {/* Scrollable chips */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="no-scrollbar flex gap-2 overflow-x-auto"
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                ref={isActive ? activeRef : undefined}
                onClick={() => onCategoryChange(cat.id)}
                className={`group relative shrink-0 rounded-xl px-4 py-2 text-[13px] font-semibold transition-all duration-300 ${
                  isActive
                    ? "bg-white text-[#09090b] shadow-lg shadow-white/10"
                    : "bg-white/[0.05] text-white/50 ring-1 ring-white/[0.06] hover:bg-white/[0.09] hover:text-white/80 hover:ring-white/[0.1]"
                }`}
              >
                <span className="relative flex items-center gap-1.5 whitespace-nowrap">
                  <span className={`text-xs transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`}>
                    {cat.emoji}
                  </span>
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right fade + arrow */}
        {showRight && (
          <>
            <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-16 bg-gradient-to-l from-[#09090b] via-[#09090b]/80 to-transparent" />
            <button
              onClick={() => scroll("right")}
              className="absolute right-0 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/[0.08] text-white/70 shadow-lg backdrop-blur-md ring-1 ring-white/[0.08] transition-all duration-200 hover:bg-white/[0.14] hover:text-white hover:scale-105"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>

      {/* Bottom edge line */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
    </div>
  );
}
