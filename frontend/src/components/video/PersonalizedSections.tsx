"use client";

import { Sparkles, Heart, TrendingUp, Clock, RefreshCw } from "lucide-react";
import Link from "next/link";
import {
  useHomeRecommendations,
  type RecommendationItem,
  type ContinueWatchingItem,
} from "@/hooks/useRecommendations";
import {
  RecommendationCard,
  RecommendationGridSkeleton,
} from "@/components/video/RecommendationCard";
import { ContinueWatchingRow } from "@/components/video/ContinueWatchingRow";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Section heading ──────────────────────────────────────────────────────────

function SectionHead({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-violet-400">
          {icon}
        </div>
        <div>
          <h2 className="text-lg font-bold text-white sm:text-xl">{title}</h2>
          {subtitle && <p className="text-xs text-white/40">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <p className="py-8 text-center text-sm text-white/25">{message}</p>
  );
}

// ─── Personalized Home Recommendations ───────────────────────────────────────

export function PersonalizedHomeSections() {
  const { data, isLoading, error, refetch, isFetching } = useHomeRecommendations();

  if (isLoading) {
    return (
      <div className="space-y-12">
        {/* Continue watching skeleton */}
        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-[220px] shrink-0 space-y-2">
                <Skeleton className="aspect-video w-full rounded-xl" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </div>
        </section>

        {/* Recommendations skeleton */}
        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <RecommendationGridSkeleton count={8} />
        </section>
      </div>
    );
  }

  if (error && (error as Error).message === "UNAUTHORIZED") {
    return null; // User not logged in — don't show error, just hide section
  }

  if (error) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
        <p className="text-sm text-white/40">Could not load personalized recommendations</p>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-white/60 transition hover:bg-white/10"
        >
          <RefreshCw className="h-3 w-3" />
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const {
    continueWatching,
    recommendedVideos,
    fromYourChannels,
    coldStart,
  } = data;

  return (
    <div className="space-y-12">

      {/* ── Continue Watching ─────────────────────────────────────────────── */}
      {continueWatching.length > 0 && (
        <section className="space-y-5">
          <SectionHead
            icon={<Clock className="h-5 w-5" />}
            title="Continue Watching"
            subtitle="Pick up where you left off"
            action={
              <Link
                href="/history"
                className="text-xs text-white/40 transition hover:text-white/70"
              >
                View all
              </Link>
            }
          />
          <ContinueWatchingRow items={continueWatching} />
        </section>
      )}

      {/* ── Recommended For You ───────────────────────────────────────────── */}
      {recommendedVideos.length > 0 && (
        <section className="space-y-5">
          <SectionHead
            icon={<Sparkles className="h-5 w-5" />}
            title={coldStart ? "Popular Right Now" : "Recommended For You"}
            subtitle={
              coldStart
                ? "Watch more videos to personalise your feed"
                : "Curated based on your viewing history"
            }
            action={
              isFetching ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-white/30" />
              ) : undefined
            }
          />

          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {recommendedVideos.slice(0, 8).map((video) => (
              <RecommendationCard key={video.id} video={video} variant="grid" />
            ))}
          </div>
        </section>
      )}

      {/* ── From Your Channels ────────────────────────────────────────────── */}
      {fromYourChannels.length > 0 && (
        <section className="space-y-5">
          <SectionHead
            icon={<Heart className="h-5 w-5" />}
            title="From Your Channels"
            subtitle="New uploads from creators you watch"
          />

          {/* Horizontal scroll row */}
          <div className="no-scrollbar flex gap-4 overflow-x-auto pb-1">
            {fromYourChannels.map((video) => (
              <div key={video.id} className="w-[200px] shrink-0">
                <RecommendationCard video={video} variant="grid" />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ─── Video page sidebar panel ─────────────────────────────────────────────────

interface VideoRecommendationPanelProps {
  items: RecommendationItem[];
  isLoading?: boolean;
}

export function VideoRecommendationPanel({
  items,
  isLoading,
}: VideoRecommendationPanelProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-5 w-36" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="aspect-video w-40 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return <EmptyState message="No recommendations available" />;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-white/60">
        <TrendingUp className="h-3.5 w-3.5" />
        <span className="text-xs font-semibold uppercase tracking-widest">Up Next</span>
      </div>
      {items.map((video) => (
        <RecommendationCard key={video.id} video={video} variant="list" />
      ))}
    </div>
  );
}
