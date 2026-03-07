"use client";

import Link from "next/link";
import { Play, Eye, Clock } from "lucide-react";
import type { VideoCardData } from "@/lib/api";

interface FeaturedHeroVideoProps {
  video: VideoCardData;
}

export function FeaturedHeroVideo({ video }: FeaturedHeroVideoProps) {
  const thumb =
    video.thumbnails?.find((t) => t.width >= 1280) ??
    video.thumbnails?.find((t) => t.width >= 640) ??
    video.thumbnails?.[video.thumbnails.length - 1];

  return (
    <Link href={`/watch/${video.id}`} className="group block">
      <div className="relative overflow-hidden rounded-2xl bg-[#181818]">
        {/* Background thumbnail - full bleed */}
        <div className="relative aspect-[21/9] overflow-hidden md:aspect-[2.5/1]">
          {thumb && (
            <img
              src={thumb.url}
              alt={video.title}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              loading="eager"
            />
          )}

          {/* Multi-layer gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f0f] via-[#0f0f0f]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent" />

          {/* Content overlay - left side */}
          <div className="absolute inset-0 flex items-end p-6 sm:items-center sm:p-10 md:p-14">
            <div className="max-w-xl space-y-4">
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/20 px-3 py-1 text-xs font-semibold text-violet-300 backdrop-blur-sm ring-1 ring-violet-500/30">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400" />
                FEATURED
              </div>

              {/* Title */}
              <h1 className="text-2xl font-bold leading-tight text-white sm:text-3xl md:text-4xl lg:text-5xl">
                {video.title}
              </h1>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-white/60">
                <span className="font-medium text-white/80">{video.channelName}</span>
                <span className="h-1 w-1 rounded-full bg-white/30" />
                {video.viewCount && (
                  <>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      {video.viewCount}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-white/30" />
                  </>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {video.publishedAt}
                </span>
              </div>

              {/* CTA Button */}
              <div className="flex items-center gap-3 pt-2">
                <div className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0f0f0f] shadow-2xl shadow-white/20 transition-all duration-300 group-hover:shadow-white/30 group-hover:scale-105">
                  <Play className="h-4 w-4 fill-[#0f0f0f]" />
                  Watch Now
                </div>
                {video.duration && (
                  <div className="rounded-full bg-white/10 px-4 py-3 text-sm font-medium text-white/80 backdrop-blur-sm">
                    {video.duration}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
