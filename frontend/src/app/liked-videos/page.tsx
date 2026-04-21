"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/auth-context";
import { api, type YTHistoryVideo } from "@/lib/api";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { useSidebar } from "@/contexts/sidebar-context";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ThumbsUp, Youtube, UserCheck, LogIn, Play, Clock, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

function formatViewCount(viewCount: string) {
  return viewCount;
}

export default function LikedVideosPage() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const { isCollapsed } = useSidebar();
  const sidebarPadding = isCollapsed ? "lg:pl-[72px]" : "lg:pl-[248px]";
  const ytConnected = !!user?.youtubeChannelId;

  const { data, isLoading, error } = useQuery({
    queryKey: ["yt-liked-videos-page"],
    queryFn: () => api.user.getLikedVideos(),
    enabled: isAuthenticated && ytConnected,
    staleTime: 5 * 60 * 1000,
  });

  const handleConnectYT = async () => {
    window.location.href = "/auth/login?error=YOUTUBE_PERMISSIONS_REQUIRED";
  };

  const videos: YTHistoryVideo[] = data?.videos ?? [];

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Sidebar />
      <Navbar />

      <main className={cn("container mx-auto px-4 py-8 max-w-5xl", sidebarPadding)}>
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-600 to-rose-600 text-white shadow-lg shadow-pink-500/20">
              <ThumbsUp className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Liked Videos</h1>
              <p className="text-sm text-white/50">Videos you&apos;ve liked on YouTube</p>
            </div>
          </div>

          {isAuthenticated && (
            ytConnected ? (
              <div className="flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1.5 text-xs text-green-400">
                <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
                YouTube connected
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="gap-2 rounded-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                onClick={handleConnectYT}
              >
                <Youtube className="h-3.5 w-3.5" />
                Connect YouTube
              </Button>
            )
          )}
        </div>

        {authLoading ? (
          <LoadingSkeleton />
        ) : !isAuthenticated ? (
          <SignInCTA />
        ) : !ytConnected ? (
          <ConnectYouTubeCTA
            title="Connect YouTube to see liked videos"
            description="Link your YouTube account to see all the videos you've liked."
          />
        ) : isLoading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="py-20 text-center">
            <p className="text-muted-foreground">Failed to load liked videos. Please try again.</p>
          </div>
        ) : videos.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <p className="text-sm text-white/50 px-2 mb-4">{videos.length.toLocaleString()} videos</p>
            <div className="space-y-2">
              {videos.map((video) => (
                <VideoRowCard key={video.id} video={video} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function VideoRowCard({ video }: { video: YTHistoryVideo }) {
  return (
    <div className="group relative flex gap-3 rounded-xl p-2 hover:bg-white/[0.04] transition-colors">
      <Link
        href={`/watch/${video.id}`}
        className="relative flex-shrink-0 w-44 aspect-video rounded-lg overflow-hidden bg-white/5"
      >
        {video.thumbnail && (
          <img src={video.thumbnail} alt={video.title || "Video"} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        )}
        {video.duration && (
          <div className="absolute bottom-1 right-1 rounded px-1 py-0.5 bg-black/80 text-[10px] font-medium text-white">
            {video.duration}
          </div>
        )}
        {video.isLive && (
          <div className="absolute top-1 left-1 rounded px-1.5 py-0.5 bg-red-600 text-[10px] font-bold tracking-wider text-white">
            LIVE
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
          <Play className="h-7 w-7 fill-white text-white drop-shadow-lg" />
        </div>
      </Link>

      <div className="min-w-0 flex-1 py-0.5">
        <Link
          href={`/watch/${video.id}`}
          className="line-clamp-2 text-sm font-medium leading-snug hover:text-primary transition-colors text-white"
        >
          {video.title}
        </Link>
        <Link
          href={`/channel/${video.channelId}`}
          className="mt-1 text-xs text-white/50 hover:text-primary transition-colors block truncate"
        >
          {video.channelName}
        </Link>
        <div className="mt-1 flex items-center gap-3 text-xs text-white/40 flex-wrap">
          {video.viewCount && (
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {formatViewCount(video.viewCount)}
            </span>
          )}
          {video.publishedAt && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {video.publishedAt}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function SignInCTA() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="h-16 w-16 rounded-full bg-violet-600/10 flex items-center justify-center">
        <UserCheck className="h-8 w-8 text-violet-400" />
      </div>
      <div>
        <p className="font-semibold text-lg text-white">Sign in to see your liked videos</p>
        <p className="text-sm text-white/50 mt-1 max-w-xs">
          Connect YouTube to sync your liked videos and playlists
        </p>
      </div>
      <div className="flex gap-2">
        <Button asChild size="sm">
          <Link href="/auth/login">
            <LogIn className="mr-2 h-4 w-4" />
            Sign In
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/auth/register">Create Account</Link>
        </Button>
      </div>
    </div>
  );
}

function ConnectYouTubeCTA({ title, description }: { title: string; description: string }) {
  const handleConnect = async () => {
    window.location.href = "/auth/login?error=YOUTUBE_PERMISSIONS_REQUIRED";
  };

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="h-16 w-16 rounded-full bg-red-600/10 flex items-center justify-center">
        <Youtube className="h-8 w-8 text-red-500" />
      </div>
      <div>
        <p className="font-semibold text-lg text-white">{title}</p>
        <p className="text-sm text-white/50 mt-1 max-w-xs">{description}</p>
      </div>
      <Button onClick={handleConnect} size="sm" className="gap-2">
        <Youtube className="h-4 w-4" />
        Connect YouTube
      </Button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-24 text-center">
      <div className="bg-white/5 p-8 rounded-full mb-6 inline-block">
        <ThumbsUp className="h-16 w-16 text-white/20" />
      </div>
      <h2 className="text-2xl font-semibold text-white mb-2">No liked videos yet</h2>
      <p className="text-white/50 max-w-sm mx-auto">
        Videos you like on YouTube will appear here.
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex gap-3 p-2">
          <Skeleton className="w-44 aspect-video rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2 py-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
