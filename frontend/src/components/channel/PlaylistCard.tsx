"use client";

import Link from "next/link";
import Image from "next/image";
import { Play } from "lucide-react";
import { ChannelVideoItem } from "@/lib/api";

interface ChannelPlaylistCardProps {
  item: ChannelVideoItem;
}

export function ChannelPlaylistCard({ item }: ChannelPlaylistCardProps) {
  const videoCount = item.videoCount ?? 0;

  // Skip rendering if thumbnail is invalid
  if (!item.thumbnail) {
    return null;
  }

  return (
    <Link href={`/playlist/${item.id}`} className="group block">
      {/* Thumbnail with playlist overlay */}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-[#1a1a1a]">
        <Image
          src={item.thumbnail}
          alt={item.title}
          fill
          className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
          unoptimized
        />

        {/* YouTube-style right panel */}
        <div className="absolute inset-y-0 right-0 w-[35%] bg-black/70 backdrop-blur-[1px] flex flex-col items-center justify-center gap-0.5">
          <Play className="h-4 w-4 text-white fill-white" />
          <span className="text-white text-xs font-semibold">{videoCount}</span>
          <span className="text-white/70 text-[10px]">videos</span>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
      </div>

      {/* Info */}
      <div className="mt-2">
        <h3 className="text-sm font-medium line-clamp-2 text-white group-hover:text-[#3ea6ff] transition-colors leading-snug">
          {item.title}
        </h3>
        <p className="text-xs text-[#aaa] mt-1">
          {videoCount} video{videoCount !== 1 ? "s" : ""}
        </p>
      </div>
    </Link>
  );
}
