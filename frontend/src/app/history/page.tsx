"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { api, type WatchHistoryItem } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import { History, Play, Trash2, Clock, AlertCircle } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { useSidebar } from "@/contexts/sidebar-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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

export default function HistoryPage() {
  const { isAuthenticated } = useAuth();
  const { isCollapsed } = useSidebar();
  const sidebarPadding = isCollapsed ? "lg:pl-[72px]" : "lg:pl-[248px]";
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["vidion-history"],
    queryFn: () => api.user.getHistory(),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => api.user.removeFromHistory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vidion-history"] });
      toast.success("Removed from history");
    },
    onError: () => toast.error("Failed to remove from history"),
  });

  const clearMutation = useMutation({
    mutationFn: () => api.user.clearHistory(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vidion-history"] });
      toast.success("Cleared history");
    },
    onError: () => toast.error("Failed to clear history"),
  });

  // Merge server history and compute continue watching
  const items: WatchHistoryItem[] = (data?.items ?? []).map((i: any) => ({
    id: i.id,
    videoId: i.videoId,
    title: i.title,
    thumbnail: i.thumbnail,
    channelName: i.channelName,
    duration: i.duration,
    progress: i.progress ?? 0,
    watchedAt: typeof i.watchedAt === "string" ? Date.parse(i.watchedAt) : i.watchedAt,
  }));

  const continueItems = items.filter((it) => (it.duration ?? 0) > 0 ? it.progress < Math.floor((it.duration ?? 0) * 0.9) : false).slice(0, 8);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0f0f0f]">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-24 text-center">
          <div className="bg-muted/50 p-6 rounded-full mb-6 inline-block">
            <History className="h-12 w-12 text-muted-foreground/60" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight mb-3">Keep track of what you watch</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-[600px] mx-auto">Watch history isn't viewable when you're signed out. Sign in to see your recently watched videos on Vidion.</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/auth/login" className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90">Sign In</Link>
            <Link href="/" className="inline-flex h-11 items-center justify-center rounded-full bg-white/5 px-6 text-sm">Explore</Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Sidebar />
      <Navbar />
      <main className={cn("container mx-auto px-4 py-8 max-w-5xl space-y-8", sidebarPadding)}>
        <div className="flex items-start justify-between gap-4 border-b border-border/40 pb-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <History className="h-8 w-8 text-primary" />
              Watch History
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Pick up where you left off. Your Vidion watch history.</p>
          </div>
          {items.length > 0 && (
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => clearMutation.mutate()} className="gap-2">
                <Trash2 className="h-4 w-4" /> Clear all
              </Button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">Loading...</div>
        ) : items.length === 0 ? (
          <div className="py-24 text-center">
            <div className="bg-muted/30 p-8 rounded-full mb-6 inline-block">
              <History className="h-16 w-16 text-muted-foreground/40" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">No videos here</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">Videos you watch will appear here so you can easily find them later.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {continueItems.length > 0 && (
              <section>
                <h2 className="text-2xl font-semibold mb-3">Continue Watching</h2>
                <div className="space-y-3">
                  {continueItems.map((it) => (
                    <HistoryCard key={it.id} item={it} onRemove={() => removeMutation.mutate(it.videoId)} isContinue />
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="text-2xl font-semibold mb-3">All History</h2>
              <div className="space-y-3">
                {items.map((it) => (
                  <HistoryCard key={it.id} item={it} onRemove={() => removeMutation.mutate(it.videoId)} />
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function HistoryCard({ item, onRemove, isContinue = false }: { item: WatchHistoryItem, onRemove: () => void, isContinue?: boolean }) {
  const percent = Math.min(100, Math.max(0, Math.round(((item.progress ?? 0) / Math.max(1, (item.duration ?? 1))) * 100)));

  return (
    <div className="group relative flex flex-col sm:flex-row gap-4 p-3 pr-4 rounded-2xl hover:bg-card/60 transition-colors duration-300 border border-transparent hover:border-border/50">
      <Link href={`/watch/${item.videoId}`} className="block relative w-full sm:w-64 md:w-72 shrink-0 aspect-video rounded-xl overflow-hidden bg-muted">
        {item.thumbnail ? (
          <Image src={item.thumbnail} alt={item.title || "Video"} fill unoptimized className="object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30"><Play className="w-10 h-10" /></div>
        )}

        <div className="absolute bottom-1.5 right-1.5 bg-black/80 backdrop-blur-sm text-white text-[11px] font-medium px-1.5 py-0.5 rounded tracking-wide">
          {formatTime(item.progress)} {item.duration ? ` / ${formatTime(item.duration)}` : ''}
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
          <div className="h-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)]" style={{ width: `${percent}%` }} />
        </div>

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/90 shadow-lg scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center transform group-hover:-translate-y-1">
            <Play className="w-5 h-5 text-black ml-1" fill="currentColor" />
          </div>
        </div>
      </Link>

      <div className="flex flex-col flex-1 min-w-0 py-1 sm:py-2">
        <div className="flex items-start justify-between gap-4">
          <Link href={`/watch/${item.videoId}`} className="flex-1 min-w-0 group-hover:text-primary transition-colors">
            <h3 className="font-semibold text-lg leading-tight line-clamp-2 mb-1.5" title={item.title}>{item.title}</h3>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm text-muted-foreground">
              <span className="truncate text-foreground/80 font-medium">{item.channelName}</span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Clock className="w-3.5 h-3.5" />
                {getRelativeTimeFromMs(Number(item.watchedAt))}
              </span>
            </div>

            {isContinue && (
              <p className="mt-3 text-xs font-medium text-primary bg-primary/10 inline-block px-2 py-1 rounded-md">
                Resume playing
              </p>
            )}
          </Link>

          <button onClick={(e) => { e.preventDefault(); onRemove(); }} className="shrink-0 p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 absolute top-4 right-4 sm:static sm:opacity-100 bg-background/80 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none" title="Remove from history">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
