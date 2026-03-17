"use client";

import Link from "next/link";
import { Radio, Eye } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { useCategoryVideos } from "@/hooks/useCategoryVideos";
import { Skeleton } from "@/components/ui/skeleton";
import type { VideoCardData } from "@/lib/api";

function LiveCard({ video }: { video: VideoCardData }) {
  const thumb =
    video.thumbnails?.find((t) => t.width >= 480) ??
    video.thumbnails?.find((t) => t.width >= 320) ??
    video.thumbnails?.[video.thumbnails.length - 1];

  return (
    <Link
      href={`/watch/${video.id}`}
      className="group block w-[300px] shrink-0 lg:w-[340px]"
    >
      <div className="overflow-hidden rounded-xl bg-white/[0.02] ring-1 ring-red-500/15 transition-all duration-500 hover:ring-red-500/30 hover:shadow-2xl hover:shadow-red-500/8 hover:-translate-y-1">
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden">
          {thumb ? (
            <img
              src={thumb.url}
              alt={video.title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full bg-white/[0.03]" />
          )}

          {/* Red line at top */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-red-500 via-red-400 to-red-500" />

          {/* LIVE indicator */}
          <div className="absolute left-2.5 top-2.5 z-20 flex items-center gap-1.5 rounded-md bg-red-600 px-2 py-0.5 shadow-lg shadow-red-600/30">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
            </span>
            <span className="text-[9px] font-black uppercase tracking-wider text-white">
              LIVE
            </span>
          </div>

          {/* Viewer count */}
          {video.viewCount && (
            <div className="absolute bottom-2.5 right-2.5 z-20 flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold text-white/80 backdrop-blur-sm">
              <Eye className="h-2.5 w-2.5 text-red-400" />
              {video.viewCount} watching
            </div>
          )}

          {/* Hover gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>

        {/* Content */}
        <div className="flex gap-2.5 p-3">
          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-white/[0.06] ring-1 ring-red-500/20">
            {video.channelThumbnail ? (
              <img
                src={video.channelThumbnail.url}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-red-600 to-red-700 text-[10px] font-bold text-white">
                {video.channelName?.charAt(0)?.toUpperCase() ?? "?"}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-[12px] font-semibold leading-snug text-white/85 transition-colors group-hover:text-white">
              {video.title}
            </h3>
            <p className="mt-0.5 truncate text-[11px] font-medium text-white/35">
              {video.channelName}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function LiveStreamSection() {
  const { data: videos, isLoading } = useCategoryVideos("live");
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
      left: dir === "left" ? -380 : 380,
      behavior: "smooth",
    });
  };

  if (isLoading) {
    return (
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-[14px]" />
          <Skeleton className="h-5 w-28" />
        </div>
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-[300px] shrink-0 lg:w-[340px]">
              <Skeleton className="aspect-video w-full rounded-xl" />
              <div className="flex gap-2.5 p-3">
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
        icon={<Radio className="h-5 w-5 text-white" />}
        title="Live Now"
        subtitle="Happening right now"
        accentColor="from-red-600 to-red-500"
      />

      <div className="group/row relative">
        {showLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute -left-1 top-[35%] z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/80 text-white shadow-xl ring-1 ring-white/10 opacity-0 transition-all group-hover/row:opacity-100 hover:bg-white hover:text-black"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="no-scrollbar flex gap-3 overflow-x-auto scroll-smooth pb-1"
        >
          {videos.slice(0, 10).map((video: VideoCardData) => (
            <LiveCard key={video.id} video={video} />
          ))}
        </div>

        {showRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute -right-1 top-[35%] z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/80 text-white shadow-xl ring-1 ring-white/10 opacity-0 transition-all group-hover/row:opacity-100 hover:bg-white hover:text-black"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </section>
  );
}
