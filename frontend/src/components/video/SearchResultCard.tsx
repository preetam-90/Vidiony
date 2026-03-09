"use client";

import Link from "next/link";
import { Clock, Play } from "lucide-react";
import type { VideoCardData } from "@/lib/api";

interface ExtendedVideoCardData extends VideoCardData {
  description?: string;
}

interface Props {
  video: ExtendedVideoCardData;
}

function getBestThumb(thumbnails: { url: string; width: number; height: number }[]) {
  if (!thumbnails?.length) return null;
  return thumbnails.find((t) => t.width >= 480) ?? thumbnails[thumbnails.length - 1];
}

export function SearchResultCard({ video }: Props) {
  const thumb = getBestThumb(video.thumbnails);

  return (
    <Link href={`/watch/${video.id}`} className="block">
      <div className="flex gap-4 items-start rounded-xl border border-white/6 bg-white/[0.02] p-3 hover:bg-white/[0.04] transition-colors">
        {/* Thumbnail on the left */}
        <div className="flex-shrink-0 w-40 md:w-56 aspect-video rounded-lg overflow-hidden bg-muted relative">
          {thumb ? (
            <img src={thumb.url} alt={video.title} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground">
              <Play className="h-6 w-6" />
            </div>
          )}

          {video.duration && (
            <div className="absolute bottom-2 right-2 rounded-md bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
              {video.duration}
            </div>
          )}
        </div>

        {/* Details on the right */}
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold line-clamp-2 text-white/95">{video.title}</h3>
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="font-medium text-sm text-muted-foreground truncate">{video.channelName}</span>
            {video.viewCount && <span className="truncate">• {video.viewCount} views</span>}
            {video.publishedAt && (
              <span className="flex items-center gap-1">
                • <Clock className="h-3 w-3" /> {video.publishedAt}
              </span>
            )}
          </div>

          {video.description && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{video.description}</p>
          )}

          <div className="mt-3 flex items-center gap-2">
            {/* Channel avatar placeholder */}
            <div className="h-8 w-8 rounded-full overflow-hidden bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
              {video.channelName?.charAt(0) ?? "?"}
            </div>
            <div className="text-xs text-muted-foreground">{video.channelName}</div>
          </div>
        </div>
      </div>
    </Link>
  );
}
