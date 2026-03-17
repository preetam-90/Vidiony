"use client";

import Link from "next/link";
import Image from "next/image";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlaylistCardProps {
  id: string;
  title: string;
  thumbnail: string;
  videoCount: number | string | null;
  className?: string;
}

export function PlaylistCard({ id, title, thumbnail, videoCount, className }: PlaylistCardProps) {
  const count =
    typeof videoCount === "string"
      ? parseInt(videoCount) || 0
      : videoCount ?? 0;

  if (!thumbnail) return null;

  return (
    <Link href={`/playlist/${id}`} className={cn("group block", className)}>
      {/* Thumbnail with stacked pages overlay — YouTube style */}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-[#1a1a1a]">
        <Image
          src={thumbnail}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          unoptimized
        />

        {/* Dark right-side panel with video count — identical to YouTube */}
        <div className="absolute inset-y-0 right-0 w-[38%] bg-black/75 backdrop-blur-[2px] flex flex-col items-center justify-center gap-1 group-hover:bg-black/85 transition-colors">
          <Play className="h-5 w-5 text-white fill-white" />
          <span className="text-white text-xs font-semibold leading-tight">{count}</span>
          <span className="text-white/70 text-[10px]">videos</span>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
      </div>

      {/* Info */}
      <div className="mt-2.5">
        <h3 className="font-semibold text-sm line-clamp-2 text-white group-hover:text-[#3ea6ff] transition-colors leading-snug">
          {title}
        </h3>
        <p className="text-xs text-[#aaaaaa] mt-1">View full playlist</p>
      </div>
    </Link>
  );
}
