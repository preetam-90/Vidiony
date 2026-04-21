"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/auth-context";
import { useWatchHistory } from "@/store/watch-history";
import { api, type WatchHistoryItem as ApiWatchHistoryItem } from "@/lib/api";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { useSidebar } from "@/contexts/sidebar-context";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Video, Play, Trash2, Clock, LogIn, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function formatTime(s?: number) {
  if (!s || isNaN(s)) return "0:00";
  const sec = Math.floor(s);
  const m = Math.floor(sec / 60);
  const r = sec % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function getRelativeTimeFromMs(ms: number) {
  const date = new Date(ms);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays} days ago`;
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks} weeks ago`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths} months ago`;
  return `${Math.floor(diffInDays / 365)} years ago`;
}

export default function MyVideosPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isCollapsed } = useSidebar();
  const sidebarPadding = isCollapsed ? "lg:pl-[72px]" : "lg:pl-[248px]";
  const queryClient = useQueryClient();

  const { items: localHistory, removeFromHistory, clearHistory } = useWatchHistory();

  const { data: serverData, isLoading: serverLoading } = useQuery({
    queryKey: ["my-videos-history"],
    queryFn: () => api.user.getHistory(),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => api.user.removeFromHistory(id),
    onMutate: (id) => {
      removeFromHistory(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-videos-history"] });
      toast.success("Removed from history");
    },
    onError: () => toast.error("Failed to remove from history"),
  });

  const clearMutation = useMutation({
    mutationFn: () => api.user.clearHistory(),
    onSuccess: () => {
      clearHistory();
      queryClient.invalidateQueries({ queryKey: ["my-videos-history"] });
      toast.success("Cleared all history");
    },
    onError: () => toast.error("Failed to clear history"),
  });

  const serverItems: ApiWatchHistoryItem[] = serverData?.items ?? [];
  const serverIds = new Set(serverItems.map((i) => i.id));

  const mergedItems: (ApiWatchHistoryItem & { isLocal?: boolean })[] = [
    ...serverItems.map((i) => ({
      ...i,
      watchedAt: typeof i.watchedAt === "string" ? new Date(i.watchedAt).getTime() : i.watchedAt,
    })),
    ...localHistory
      .filter((i) => !serverIds.has(i.id))
      .map((i) => ({
        id: i.id,
        videoId: i.id,
        title: i.title,
        thumbnail: i.thumbnail,
        channelName: i.channelName,
        duration: 0,
        progress: 0,
        watchedAt: i.watchedAt,
        isLocal: true,
      })),
  ].sort((a, b) => Number(b.watchedAt) - Number(a.watchedAt));

  const continueWatching = mergedItems
    .filter((it) => {
      const totalDuration = typeof it.duration === "number" ? it.duration : 0;
      if (totalDuration <= 0) return false;
      return (it.progress ?? 0) < totalDuration * 0.9;
    })
    .slice(0, 10);

  const completed = mergedItems
    .filter((it) => {
      const totalDuration = typeof it.duration === "number" ? it.duration : 0;
      return totalDuration > 0 && (it.progress ?? 0) >= totalDuration * 0.9;
    })
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Sidebar />
      <Navbar />

      <main className={cn("container mx-auto px-4 py-8 max-w-5xl space-y-8", sidebarPadding)}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20">
              <Video className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">My Videos</h1>
              <p className="text-sm text-white/50">Your Vidion watch history and saved videos</p>
            </div>
          </div>

          {mergedItems.length > 0 && (
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearMutation.mutate()}
                className="gap-2 text-white/50 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Clear all
              </Button>
            </div>
          )}
        </div>

        {authLoading || (isAuthenticated && serverLoading) ? (
          <LoadingSkeleton />
        ) : !isAuthenticated ? (
          <SignInCTA />
        ) : mergedItems.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-10">
            {continueWatching.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold text-white">Continue Watching</h2>
                  <span className="text-xs text-white/40">{continueWatching.length} videos</span>
                </div>
                <div className="space-y-3">
                  {continueWatching.map((item) => (
                    <HistoryCard
                      key={item.id}
                      item={item}
                      onRemove={() => removeMutation.mutate(item.videoId || item.id)}
                      isContinue
                    />
                  ))}
                </div>
              </section>
            )}

            {completed.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <Play className="h-5 w-5 text-green-500" />
                  <h2 className="text-xl font-semibold text-white">Completed</h2>
                  <span className="text-xs text-white/40">{completed.length} videos</span>
                </div>
                <div className="space-y-3">
                  {completed.map((item) => (
                    <HistoryCard
                      key={item.id}
                      item={item}
                      onRemove={() => removeMutation.mutate(item.videoId || item.id)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function HistoryCard({
  item,
  onRemove,
  isContinue = false,
}: {
  item: ApiWatchHistoryItem & { isLocal?: boolean };
  onRemove: () => void;
  isContinue?: boolean;
}) {
  const totalDuration = typeof item.duration === "number" ? item.duration : 0;
  const progress = item.progress ?? 0;
  const percent = totalDuration > 0 ? Math.min(100, Math.max(0, Math.round((progress / totalDuration) * 100))) : 0;
  const videoId = item.videoId || item.id;

  return (
    <div className="group relative flex flex-col sm:flex-row gap-4 p-3 pr-4 rounded-2xl hover:bg-card/60 transition-colors duration-300 border border-transparent hover:border-border/50">
      <Link
        href={`/watch/${videoId}`}
        className="block relative w-full sm:w-64 md:w-72 shrink-0 aspect-video rounded-xl overflow-hidden bg-muted"
      >
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={item.title || "Video"}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
            <Play className="w-10 h-10" />
          </div>
        )}

        {totalDuration > 0 && (
          <div className="absolute bottom-1.5 right-1.5 bg-black/80 backdrop-blur-sm text-white text-[11px] font-medium px-1.5 py-0.5 rounded tracking-wide">
            {formatTime(progress)} / {formatTime(totalDuration)}
          </div>
        )}

        {isContinue && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
            <div
              className="h-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)]"
              style={{ width: `${percent}%` }}
            />
          </div>
        )}

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/90 shadow-lg scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center transform group-hover:-translate-y-1">
            <Play className="w-5 h-5 text-black ml-1" fill="currentColor" />
          </div>
        </div>
      </Link>

      <div className="flex flex-col flex-1 min-w-0 py-1 sm:py-2">
        <div className="flex items-start justify-between gap-4">
          <Link
            href={`/watch/${videoId}`}
            className="flex-1 min-w-0 group-hover:text-primary transition-colors"
          >
            <h3 className="font-semibold text-base sm:text-lg leading-tight line-clamp-2 mb-1.5 text-white" title={item.title}>
              {item.title}
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm text-white/50">
              <span className="truncate text-white/70 font-medium">{item.channelName}</span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Clock className="w-3.5 h-3.5" />
                {getRelativeTimeFromMs(Number(item.watchedAt))}
              </span>
            </div>

            {isContinue && (
              <p className="mt-3 text-xs font-medium text-primary bg-primary/10 inline-block px-2 py-1 rounded-md w-fit">
                Resume playing
              </p>
            )}
          </Link>

          <button
            onClick={(e) => {
              e.preventDefault();
              onRemove();
            }}
            className="shrink-0 p-2 text-white/30 hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 absolute top-4 right-4 sm:static sm:opacity-100 bg-black/40 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none"
            title="Remove from history"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function SignInCTA() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="h-16 w-16 rounded-full bg-violet-600/10 flex items-center justify-center">
        <UserCheck className="h-8 w-8 text-violet-400" />
      </div>
      <div>
        <p className="font-semibold text-lg text-white">Sign in to see your video library</p>
        <p className="text-sm text-white/50 mt-1 max-w-xs">
          Your watch history and saved videos will appear here
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

function EmptyState() {
  return (
    <div className="py-24 text-center">
      <div className="bg-white/5 p-8 rounded-full mb-6 inline-block">
        <Video className="h-16 w-16 text-white/20" />
      </div>
      <h2 className="text-2xl font-semibold text-white mb-2">No videos here yet</h2>
      <p className="text-white/50 max-w-sm mx-auto">
        Videos you watch on Vidion will appear here so you can easily find them later.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Explore Videos</Link>
      </Button>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4 p-3">
          <Skeleton className="w-72 aspect-video rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2 py-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}