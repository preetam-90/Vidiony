"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const CATEGORIES = [
  { id: "all",           label: "All" },
  { id: "ai",           label: "Artificial Intelligence" },
  { id: "programming",  label: "Programming" },
  { id: "system-design",label: "System Design" },
  { id: "cybersecurity",label: "Cybersecurity" },
  { id: "cloud",        label: "Cloud Computing" },
  { id: "data-science", label: "Data Science" },
  { id: "devops",       label: "DevOps" },
];

export { CATEGORIES };

interface CategoryStripProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export function CategoryStrip({ activeCategory, onCategoryChange }: CategoryStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  const [showLeft,  setShowLeft]  = useState(false);
  const [showRight, setShowRight] = useState(true);

  const checkScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeft(scrollLeft > 10);
    setShowRight(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  // Scroll active pill into view whenever it changes
  useEffect(() => {
    activeRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeCategory]);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  };

  return (
    <div className="relative">
      {/* Left fade + arrow */}
      {showLeft && (
        <>
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-16 bg-gradient-to-r from-[#0f0f0f] to-transparent" />
          <button
            onClick={() => scroll("left")}
            className="absolute left-1 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-[#272727] text-white/80 shadow-lg transition hover:bg-[#3a3a3a]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </>
      )}

      {/* Pills row */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="no-scrollbar flex gap-2 overflow-x-auto px-1 py-3"
      >
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              ref={isActive ? activeRef : undefined}
              onClick={() => onCategoryChange(cat.id)}
              className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-white text-[#0f0f0f] shadow-lg shadow-white/10"
                  : "bg-[#272727] text-white/70 hover:bg-[#3a3a3a] hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Right fade + arrow */}
      {showRight && (
        <>
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-16 bg-gradient-to-l from-[#0f0f0f] to-transparent" />
          <button
            onClick={() => scroll("right")}
            className="absolute right-1 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-[#272727] text-white/80 shadow-lg transition hover:bg-[#3a3a3a]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
}
