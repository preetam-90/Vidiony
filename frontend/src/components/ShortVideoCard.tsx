"use client";

import Link from "next/link";
import { Play } from "lucide-react";
import type { VideoCardData } from "@/lib/api";

interface ShortVideoCardProps {
  video: VideoCardData;
}

export function ShortVideoCard({ video }: ShortVideoCardProps) {
  const thumb =
    video.thumbnails?.find((t) => t.width >= 320) ??
    video.thumbnails?.[video.thumbnails.length - 1];

  return (
    <Link href={`/watch/${video.id}`} className="group block">
      <div className="relative w-[160px] overflow-hidden rounded-xl bg-[#181818] transition-all duration-300 hover:translate-y-[-4px] hover:shadow-lg hover:shadow-violet-500/10">
        {/* Vertical thumbnail */}
        <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-white/5">
          {thumb && (
            <img
              src={thumb.url}
              alt={video.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

          {/* Duration */}
          {video.duration && (
            <div className="absolute top-2 right-2 rounded-md bg-red-600/90 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {video.duration}
            </div>
          )}

          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-xl">
              <Play className="ml-0.5 h-4 w-4 fill-[#0f0f0f] text-[#0f0f0f]" />
            </div>
          </div>

          {/* Bottom info */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="line-clamp-2 text-xs font-semibold leading-tight text-white">
              {video.title}
            </h3>
            <p className="mt-1 text-[10px] text-white/60">{video.viewCount}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
