"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePlayerStore } from "@/store/playerStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Heart, 
  MessageCircle, 
  Eye, 
  MoreHorizontal,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { HoverVideoPlayer } from "./HoverVideoPlayer";
import { WatchLaterButton } from "./WatchLaterButton";

interface VideoCardProps {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  views: number;
  likes: number;
  comments: number;
  createdAt: string;
  author: {
    name: string;
    avatar: string;
    verified?: boolean;
  };
  category?: string;
}

export function VideoCard({
  id,
  title,
  thumbnail,
  duration,
  views,
  likes,
  comments,
  createdAt,
  author,
  category
}: VideoCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isAnyPlaying = usePlayerStore((s) => s.isPlaying);
  
  const formatViews = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <Link 
      href={`/video/${id}`} 
      className="group block" 
      onMouseEnter={() => setIsHovered(true)} 
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden rounded-xl bg-card transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
        {/* Thumbnail with Video Hover Preview */}
        <div className="relative aspect-video overflow-hidden bg-muted">
          <HoverVideoPlayer
            videoId={id}
            thumbnailUrl={thumbnail}
            isHovered={isHovered}
          />

          {/* Duration Badge */}
          <div className="absolute bottom-2 right-2 rounded-md bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white z-10">
            {duration}
          </div>

          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20 z-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:opacity-100">
              <Play className="ml-1 h-5 w-5 fill-primary text-primary" />
            </div>
          </div>

          {/* Watch Later Icon */}
          <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {isAnyPlaying && (
              <WatchLaterButton
                videoId={id}
                title={title}
                thumbnail={thumbnail}
                channelName={author.name}
                duration={duration}
                variant="icon"
              />
            )}
          </div>

          {/* Category Badge */}
          {category && (
            <Badge className="absolute top-2 left-2 bg-black/60 hover:bg-black/80 z-10">
              {category}
            </Badge>
          )}
        </div>

        {/* Content Section */}
        <div className="flex gap-3 p-3">
          <Avatar className="h-9 w-9 flex-shrink-0">
            <AvatarImage src={author.avatar} />
            <AvatarFallback className="bg-primary/20 text-primary text-xs">
              {author.name.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug group-hover:text-primary transition-colors">
              {title}
            </h3>

            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{author.name}</span>
              {author.verified && (
                <svg 
                  className="h-3.5 w-3.5 text-primary" 
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                  aria-label="Verified"
                >
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>

            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
              <span>{formatViews(views)} views</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {createdAt}
              </span>
            </div>
          </div>

          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 flex-shrink-0 opacity-0 group-hover:opacity-100"
            onClick={(e) => e.preventDefault()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Link>
  );
}

interface VideoCardSkeletonProps {
  count?: number;
}

export function VideoCardSkeleton({ count = 8 }: VideoCardSkeletonProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl">
          <div className="aspect-video animate-pulse bg-muted" />
          <div className="flex gap-3 p-3">
            <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
