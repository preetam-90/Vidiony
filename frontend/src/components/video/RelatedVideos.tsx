"use client";

import Link from "next/link";
import { useRelatedVideos } from "@/hooks/useYoutube";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, Clock } from "lucide-react";

interface RelatedVideosProps {
  videoId: string;
}

function getBestThumb(thumbnails: { url: string; width: number; height: number }[]) {
  if (!thumbnails?.length) return null;
  // Pick medium resolution or last
  return thumbnails.find((t) => t.width >= 320) ?? thumbnails[thumbnails.length - 1];
}

export function RelatedVideos({ videoId }: RelatedVideosProps) {
  const { data: videos, isLoading } = useRelatedVideos(videoId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-2">
            <Skeleton className="aspect-video w-40 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!videos?.length) return null;

  return (
    <div>
      <h3 className="mb-3 font-semibold">Related Videos</h3>
      <div className="space-y-3">
        {videos.map((video) => {
          const thumb = getBestThumb(video.thumbnails);
          return (
            <Link
              key={video.id}
              href={`/watch/${video.id}`}
              className="flex gap-2 group"
            >
              <div className="relative aspect-video w-40 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                {thumb ? (
                  <img
                    src={thumb.url}
                    alt={video.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                    <Play className="h-6 w-6" />
                  </div>
                )}
                {video.duration && (
                  <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[10px] text-white font-medium">
                    {video.duration}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="line-clamp-2 text-sm font-medium group-hover:text-primary transition-colors">
                  {video.title}
                </h4>
                <p className="mt-1 text-xs text-muted-foreground truncate">
                  {video.channelName}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  {video.viewCount && <span>{video.viewCount} views</span>}
                  {video.publishedAt && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-3 w-3" />
                        {video.publishedAt}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
