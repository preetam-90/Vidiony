"use client";

import Link from "next/link";
import Image from "next/image";
import { Play } from "lucide-react";
import { ChannelVideo } from "@/lib/api";
import { cn } from "@/lib/utils";

interface FeaturedVideoCardProps {
  video: ChannelVideo;
  className?: string;
}

export function FeaturedVideoCard({ video, className }: FeaturedVideoCardProps) {
  if (!video.thumbnail) return null;

  return (
    <Link href={`/watch/${video.id}`} className={cn("group block", className)}>
      {/* YouTube-style: wide thumbnail left + text right on sm+ */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Thumbnail */}
        <div className="relative sm:w-[340px] md:w-[400px] lg:w-[480px] flex-shrink-0 aspect-video rounded-xl overflow-hidden bg-[#1a1a1a]">
          <Image
            src={video.thumbnail}
            alt={video.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            unoptimized
            priority
          />

          {/* Hover overlay with play button */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-300 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-200">
              <Play className="h-6 w-6 text-white fill-white ml-1" />
            </div>
          </div>

          {/* Duration badge */}
          {video.duration && (
            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 rounded text-xs font-medium text-white">
              {video.duration}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-2 pt-1 flex-1 min-w-0">
          <h3 className="font-semibold text-base sm:text-lg leading-snug line-clamp-3 group-hover:text-[#3ea6ff] transition-colors">
            {video.title}
          </h3>
          <div className="flex items-center flex-wrap gap-1 text-sm text-[#aaaaaa]">
            {video.viewCount && <span>{video.viewCount} views</span>}
            {video.viewCount && video.publishedAt && <span className="mx-1">•</span>}
            {video.publishedAt && <span>{video.publishedAt}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}
