"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useSidebar } from "@/contexts/sidebar-context";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  useWatchLaterList,
  useRemoveFromWatchLater,
  useClearWatchLater,
} from "@/hooks/useWatchLater";
import {
  Clock, Play, X, Trash2, LogIn, Loader2,
  ArrowUpDown, ChevronDown, Eye,
} from "lucide-react";
import Link from "next/link";
import type { WatchLaterItem } from "@/lib/api";

// ─── Time ago helper ────────────────────────────────────────────────────────

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Watch Later Card ───────────────────────────────────────────────────────

function WatchLaterCard({
  item,
  onRemove,
}: {
  item: WatchLaterItem;
  onRemove: () => void;
}) {
  return (
    <div className="group relative rounded-xl overflow-hidden border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all duration-200">
      {/* Thumbnail */}
      <Link
        href={`/watch/${item.videoId}`}
        className="relative block aspect-video bg-white/5 overflow-hidden"
      >
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={item.title ?? ""}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <Clock className="h-8 w-8 text-white/20" />
          </div>
        )}

        {/* Duration badge */}
        {item.duration && (
          <div className="absolute bottom-1.5 right-1.5 rounded px-1.5 py-0.5 bg-black/80 text-[10px] font-medium text-white">
            {item.duration}
          </div>
        )}

        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg">
            <Play className="ml-0.5 h-4 w-4 fill-primary text-primary" />
          </div>
        </div>
      </Link>

      {/* Remove button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove();
        }}
        className="absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all duration-200 backdrop-blur-sm"
        title="Remove from Watch Later"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {/* Info */}
      <div className="p-3 space-y-1">
        <Link
          href={`/watch/${item.videoId}`}
          className="line-clamp-2 text-sm font-medium leading-snug hover:text-primary transition-colors"
        >
          {item.title || "Untitled video"}
        </Link>

        {item.channelName && (
          <Link
            href={item.channelId ? `/channel/${item.channelId}` : "#"}
            className="block text-xs text-muted-foreground hover:text-primary transition-colors truncate"
          >
            {item.channelName}
          </Link>
        )}

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
          <Clock className="h-3 w-3" />
          <span>Added {timeAgo(item.addedAt)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Loading skeleton ───────────────────────────────────────────────────────

function CardSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl overflow-hidden border border-white/5">
          <Skeleton className="aspect-video w-full" />
          <div className="p-3 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Empty state ────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
        <Clock className="h-10 w-10 text-primary/60" />
      </div>
      <div>
        <p className="text-lg font-semibold">No saved videos</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          Save videos to watch later by clicking the clock icon on any video
        </p>
      </div>
      <Button asChild size="sm" className="gap-2 mt-2">
        <Link href="/">
          <Eye className="h-4 w-4" />
          Browse Videos
        </Link>
      </Button>
    </div>
  );
}

// ─── Sign-in CTA ────────────────────────────────────────────────────────────

function SignInCTA() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="h-16 w-16 rounded-full bg-violet-600/10 flex items-center justify-center">
        <Clock className="h-8 w-8 text-violet-400" />
      </div>
      <div>
        <p className="font-semibold">Sign in to use Watch Later</p>
        <p className="text-sm text-muted-foreground mt-1">
          Save videos and access them from any device
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

// ─── Main page ──────────────────────────────────────────────────────────────

export default function WatchLaterPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isCollapsed } = useSidebar();
  const sidebarPadding = isCollapsed ? "lg:pl-[72px]" : "lg:pl-[248px]";

  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useWatchLaterList(sort);

  const removeMutation = useRemoveFromWatchLater();
  const clearMutation = useClearWatchLater();

  // Flatten all pages
  const items = data?.pages.flatMap((p) => p.items) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  // ── Infinite scroll observer ──────────────────────────────────────────────
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: "200px",
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersect]);

  // ── Clear confirmation handler ────────────────────────────────────────────
  const handleClear = () => {
    clearMutation.mutate();
    setShowClearConfirm(false);
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Sidebar />
      <Navbar />

      <main className={cn("container mx-auto px-4 py-8 max-w-7xl", sidebarPadding)}>
        {/* Page header */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Watch Later</h1>
              {isAuthenticated && !isLoading && (
                <p className="text-sm text-muted-foreground">
                  {total} {total === 1 ? "video" : "videos"} saved
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          {isAuthenticated && items.length > 0 && (
            <div className="flex items-center gap-2">
              {/* Sort dropdown */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-full border-white/10 text-xs"
                  onClick={() => setShowSortMenu(!showSortMenu)}
                >
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  {sort === "newest" ? "Recently Added" : "Oldest First"}
                  <ChevronDown className="h-3 w-3" />
                </Button>
                {showSortMenu && (
                  <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-xl border border-white/10 bg-card/95 backdrop-blur-xl shadow-xl overflow-hidden">
                    <button
                      className={cn(
                        "flex w-full items-center px-4 py-2.5 text-sm transition-colors hover:bg-white/5",
                        sort === "newest" && "text-primary bg-primary/10",
                      )}
                      onClick={() => { setSort("newest"); setShowSortMenu(false); }}
                    >
                      Recently Added
                    </button>
                    <button
                      className={cn(
                        "flex w-full items-center px-4 py-2.5 text-sm transition-colors hover:bg-white/5",
                        sort === "oldest" && "text-primary bg-primary/10",
                      )}
                      onClick={() => { setSort("oldest"); setShowSortMenu(false); }}
                    >
                      Oldest First
                    </button>
                  </div>
                )}
              </div>

              {/* Clear all */}
              {!showClearConfirm ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground hover:text-destructive rounded-full text-xs"
                  onClick={() => setShowClearConfirm(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear All
                </Button>
              ) : (
                <div className="flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1">
                  <span className="text-xs text-destructive">Clear all?</span>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-6 px-2 text-xs rounded-full"
                    onClick={handleClear}
                    disabled={clearMutation.isPending}
                  >
                    {clearMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Yes"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs rounded-full"
                    onClick={() => setShowClearConfirm(false)}
                  >
                    No
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        {authLoading ? (
          <CardSkeleton />
        ) : !isAuthenticated ? (
          <SignInCTA />
        ) : isLoading ? (
          <CardSkeleton />
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((item) => (
                <WatchLaterCard
                  key={item.id}
                  item={item}
                  onRemove={() => removeMutation.mutate(item.videoId)}
                />
              ))}
            </div>

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="mt-6 flex justify-center py-4">
              {isFetchingNextPage && (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
