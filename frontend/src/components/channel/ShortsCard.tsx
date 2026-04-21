"use client";

import Link from "next/link";
import Image from "next/image";
import { ChannelVideoItem } from "@/lib/api";

interface ChannelShortsCardProps {
  item: ChannelVideoItem;
}

export function ChannelShortsCard({ item }: ChannelShortsCardProps) {
  if (!item.thumbnail) {
    return null;
  }

  return (
    <Link href={`/watch/${item.id}`} className="group block">
      {/* Shorts use portrait/vertical thumbnails — YouTube style */}
      <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-[#1a1a1a]">
        <Image
          src={item.thumbnail}
          alt={item.title}
          fill
          className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
          unoptimized
        />

        {/* Gradient overlay at bottom for title readability */}
        <div className="absolute inset-x-0 bottom-0 h-[50%] bg-gradient-to-t from-black/60 to-transparent" />

        {/* Duration badge */}
        {item.duration && (
          <div className="absolute bottom-2 left-2 rounded px-1.5 py-0.5 text-xs font-medium text-white bg-black/60">
            {item.duration}
          </div>
        )}
      </div>

      {/* Title + meta */}
      <div className="mt-2">
        <h3 className="text-sm font-medium line-clamp-2 text-white group-hover:text-[#3ea6ff] transition-colors leading-snug">
          {item.title}
        </h3>
        <div className="mt-1 flex items-center gap-1 text-xs text-[#aaa]">
          {item.viewCount && <span>{item.viewCount} views</span>}
          {item.viewCount && item.publishedAt && <span className="mx-1">•</span>}
          {item.publishedAt && <span>{item.publishedAt}</span>}
        </div>
      </div>
    </Link>
  );
}
