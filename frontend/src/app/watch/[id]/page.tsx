"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useVideo } from "@/hooks/useYoutube";
import { useWatchHistory } from "@/store/watch-history";
import { useLikes } from "@/store/likes";
import { Navbar } from "@/components/layout/navbar";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { CommentSection } from "@/components/video/CommentSection";
import { RelatedVideos } from "@/components/video/RelatedVideos";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import type { CaptionTrack } from "@/hooks/usePlayerState";
import {
  ChevronLeft,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Eye,
  Clock,
  User,
} from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

function formatNumber(num: number) {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

export default function WatchPage() {
  const params = useParams();
  const videoId = params.id as string;
  const { data: video, isLoading, error } = useVideo(videoId);
  const addToHistory = useWatchHistory((s) => s.addToHistory);
  const { toggleLike, toggleDislike, isLiked, isDisliked } = useLikes();
  const [isTheater, setIsTheater] = useState(false);

  // Add to watch history when video loads
  useEffect(() => {
    if (video) {
      const thumb = video.thumbnails?.[0]?.url ?? "";
      addToHistory({
        id: video.id,
        title: video.title,
        thumbnail: thumb,
        channelName: video.channelName,
        duration: video.duration ? `${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, "0")}` : "",
      });
    }
  }, [video?.id]);

  const poster = video?.thumbnails?.find((t) => t.width >= 640)?.url ?? video?.thumbnails?.[0]?.url;
  const liked = video ? isLiked(video.id) : false;
  const disliked = video ? isDisliked(video.id) : false;

  // Map backend CaptionTrackMeta → CaptionTrack with proxied VTT src
  const captionTracks: CaptionTrack[] = video?.captions?.map((c) => ({
    id: c.id,
    label: c.label,
    language: c.language,
    src: api.captionUrl(video.id, c.language, c.isAuto),
  })) ?? [];

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container mx-auto px-4 py-6">
        <Button variant="ghost" className="mb-4 gap-2" onClick={() => window.history.back()}>
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>

        {error && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-6 text-center">
            <p className="text-destructive">Failed to load video. Please try again.</p>
          </div>
        )}

        {isLoading && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="aspect-video w-full rounded-xl" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-5 w-32" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-2">
                  <Skeleton className="aspect-video w-40 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {video && (
          <div className={`grid gap-6 transition-all duration-300 ${isTheater ? "lg:grid-cols-1" : "lg:grid-cols-3"}`}>
            {/* Main content */}
            <div className={`space-y-4 ${isTheater ? "" : "lg:col-span-2"}`}>
              {/* Player */}
              <VideoPlayer
                videoId={video.id}
                title={video.title}
                poster={video.thumbnails?.find((t) => t.width >= 640)?.url ?? video.thumbnails?.[0]?.url}
                formats={video.formats}
                captions={captionTracks}
                onTheaterChange={setIsTheater}
              />

              {/* Title & meta */}
              <div>
                <h1 className="text-2xl font-bold">{video.title}</h1>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Eye className="h-4 w-4" />
                      <span className="text-sm">{formatNumber(video.viewCount)} views</span>
                    </div>
                    {video.publishedAt && (
                      <>
                        <span>•</span>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm">{video.publishedAt}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant={liked ? "default" : "outline"}
                      size="sm"
                      className="gap-2"
                      onClick={() => toggleLike(video.id)}
                    >
                      <ThumbsUp className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
                      {video.likeCount !== null ? formatNumber(video.likeCount + (liked ? 1 : 0)) : "Like"}
                    </Button>
                    <Button
                      variant={disliked ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleDislike(video.id)}
                    >
                      <ThumbsDown className={`h-4 w-4 ${disliked ? "fill-current" : ""}`} />
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Share2 className="h-4 w-4" /> Share
                    </Button>
                  </div>
                </div>

                {/* Tags */}
                {video.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {video.tags.slice(0, 10).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Channel + description */}
                <div className="mt-4 rounded-xl bg-card/50 border border-white/5 p-4">
                  <Link
                    href={`/channel/${video.channelId}`}
                    className="flex items-center gap-3 group"
                  >
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                      {video.channelThumbnail ? (
                        <img src={video.channelThumbnail.url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <span className="font-semibold group-hover:text-primary transition-colors">
                      {video.channelName}
                    </span>
                  </Link>
                  {video.description && (
                    <p className="mt-3 text-sm text-muted-foreground whitespace-pre-line line-clamp-6">
                      {video.description}
                    </p>
                  )}
                </div>

                {/* Format info */}
                {video.formats.length > 0 && (
                  <details className="mt-3">
                    <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                      Available formats ({video.formats.length})
                    </summary>
                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {video.formats
                        .filter((f) => f.hasVideo && f.hasAudio)
                        .map((f) => (
                          <div key={f.itag} className="text-xs bg-card/30 rounded-lg p-2 border border-white/5">
                            <span className="font-medium">{f.qualityLabel ?? `${f.height}p`}</span>
                            <span className="text-muted-foreground ml-1">
                              {f.container} • {f.codecs.split(",")[0]}
                            </span>
                          </div>
                        ))}
                    </div>
                  </details>
                )}
              </div>

              {/* Comments */}
              <CommentSection videoId={video.id} />
            </div>

            {/* Sidebar */}
            {!isTheater && (
              <div className="space-y-4">
                <RelatedVideos videoId={video.id} />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
