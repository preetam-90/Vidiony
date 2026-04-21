"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Play } from "lucide-react";
import { ChannelVideoItem } from "@/lib/api";
import { cn } from "@/lib/utils";
import { VideoOptionsMenu } from "@/components/video/VideoOptionsMenu";

interface ChannelVideoCardProps {
  item: ChannelVideoItem;
  variant?: "default" | "horizontal" | "vertical";
  channelName?: string;
  className?: string;
}

export function ChannelVideoCard({ item, variant = "default", channelName, className }: ChannelVideoCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (variant === "default" || variant === "vertical") {
    return (
      <Link
        href={`/watch/${item.id}`}
        className={cn("group block", className)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative aspect-video rounded-xl overflow-hidden bg-[#1a1a1a]">
          <Image
            src={item.thumbnail}
            alt={item.title}
            fill
            className={cn(
              "object-cover transition-transform duration-200",
              isHovered && "scale-[1.02]"
            )}
            unoptimized
          />

          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />

          {item.duration && (
            <div className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
              {item.duration}
            </div>
          )}

          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-10 h-10 rounded-full bg-black/70 flex items-center justify-center">
              <Play className="h-5 w-5 text-white fill-white ml-0.5" />
            </div>
          </div>
        </div>

        <div className="mt-2 flex gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium line-clamp-2 text-white group-hover:text-[#3ea6ff] transition-colors leading-snug">
              {item.title}
            </h3>
            {channelName && (
              <div className="mt-1 text-xs text-[#aaa] truncate">
                {channelName}
              </div>
            )}
            <div className={cn("flex items-center gap-1 text-xs text-[#aaa]", !channelName && "mt-1")}>
              {item.viewCount && <span>{item.viewCount} views</span>}
              {item.viewCount && item.publishedAt && <span className="mx-1">•</span>}
              {item.publishedAt && <span>{item.publishedAt}</span>}
            </div>
          </div>

          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <VideoOptionsMenu
              videoId={item.id}
              title={item.title}
              thumbnail={item.thumbnail}
            />
          </div>
        </div>
      </Link>
    );
  }

  // Horizontal card (for home tab featured row)
  return (
    <Link
      href={`/watch/${item.id}`}
      className={cn("group flex gap-3", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail */}
      <div className="relative w-[168px] sm:w-[196px] md:w-[210px] flex-shrink-0 aspect-video rounded-lg overflow-hidden bg-[#1a1a1a]">
        <Image
          src={item.thumbnail}
          alt={item.title}
          fill
          className={cn(
            "object-cover transition-transform duration-200",
            isHovered && "scale-[1.02]"
          )}
          unoptimized
        />

        {/* Duration badge */}
        {item.duration && (
          <div className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
            {item.duration}
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
      </div>

      {/* Meta */}
      <div className="flex-1 min-w-0 py-0.5">
        <h3 className="text-sm font-medium line-clamp-2 text-white group-hover:text-[#3ea6ff] transition-colors leading-snug">
          {item.title}
        </h3>
        <div className="mt-1.5 flex items-center gap-1 text-xs text-[#aaa]">
          {item.viewCount && <span>{item.viewCount} views</span>}
          {item.viewCount && item.publishedAt && <span className="mx-1">•</span>}
          {item.publishedAt && <span>{item.publishedAt}</span>}
        </div>
      </div>
    </Link>
  );
}

/** Skeleton for loading states */
export function ChannelVideoCardSkeleton({ count = 8 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="aspect-video rounded-xl bg-[#1a1a1a] animate-pulse" />
          <div className="space-y-1.5 px-0.5">
            <div className="h-4 w-[90%] rounded bg-[#1a1a1a] animate-pulse" />
            <div className="h-3 w-[60%] rounded bg-[#1a1a1a] animate-pulse" />
          </div>
        </div>
      ))}
    </>
  );
}
