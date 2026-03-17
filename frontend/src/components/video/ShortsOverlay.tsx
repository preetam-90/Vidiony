"use client";

import Link from "next/link";
import { User, Verified } from "lucide-react";
import type { VideoThumbnail } from "@/lib/api";

interface ShortsOverlayProps {
  title: string;
  description?: string;
  channelName: string;
  channelId?: string;
  channelThumbnail?: VideoThumbnail | null;
  isVerified?: boolean;
  caption?: string;
  viewCount?: string;
}

export function ShortsOverlay({
  title,
  description,
  channelName,
  channelId,
  channelThumbnail,
  isVerified = false,
  caption,
  viewCount,
}: ShortsOverlayProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 p-4 pb-20">
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
      
      <div className="relative space-y-3">
        {channelId ? (
          <Link
            href={`/channel/${channelId}`}
            className="flex items-center gap-2 group"
          >
            <div className="h-9 w-9 rounded-full bg-white/10 overflow-hidden flex-shrink-0">
              {channelThumbnail ? (
                <img
                  src={channelThumbnail.url}
                  alt={channelName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white/60" />
                </div>
              )}
            </div>
            <span className="text-sm font-semibold text-white group-hover:underline">
              {channelName}
            </span>
            {isVerified && (
              <Verified className="h-4 w-4 text-blue-400" />
            )}
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-white/10 overflow-hidden flex-shrink-0">
              {channelThumbnail ? (
                <img
                  src={channelThumbnail.url}
                  alt={channelName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white/60" />
                </div>
              )}
            </div>
            <span className="text-sm font-semibold text-white">{channelName}</span>
          </div>
        )}

        <h2 className="text-base font-semibold text-white leading-tight line-clamp-2">
          {title}
        </h2>

        {caption && (
          <p className="text-sm text-white/80 line-clamp-2">{caption}</p>
        )}

        {description && (
          <p className="text-xs text-white/60 line-clamp-2">{description}</p>
        )}

        {viewCount && (
          <p className="text-xs text-white/50">{viewCount} views</p>
        )}
      </div>
    </div>
  );
}
