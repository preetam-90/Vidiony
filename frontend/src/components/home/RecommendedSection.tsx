"use client";

import { Sparkles, Heart, RefreshCw } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { HomeVideoCard } from "./HomeVideoCard";
import { ContinueWatchingSection } from "./ContinueWatchingSection";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useHomeRecommendations,
  type RecommendationItem,
} from "@/hooks/useRecommendations";

/**
 * Personalized sections for authenticated users:
 *  – Continue Watching
 *  – Recommended For You
 *  – From Your Channels
 */
export function RecommendedSection() {
  const { data, isLoading, error, refetch, isFetching } =
    useHomeRecommendations();

  /* ── Loading skeleton ──────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="space-y-12">
        {/* Continue watching skeleton */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-11 rounded-[14px]" />
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-[260px] shrink-0 sm:w-[280px]">
                <Skeleton className="aspect-video w-full rounded-xl" />
                <div className="mt-2 space-y-2 px-1">
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recommendations skeleton */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-11 rounded-[14px]" />
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-52" />
              <Skeleton className="h-3 w-36" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-video w-full rounded-xl" />
                <div className="flex gap-2.5 px-0.5">
                  <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  /* ── Error states ──────────────────────────────────────────────── */
  if (error && (error as Error).message === "UNAUTHORIZED") return null;

  if (error) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.02] px-5 py-4">
        <p className="text-sm text-white/35">
          Could not load recommendations
        </p>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 rounded-lg bg-white/[0.05] px-3.5 py-1.5 text-xs font-semibold text-white/50 ring-1 ring-white/[0.06] transition-all hover:bg-white/[0.1] hover:text-white/70"
        >
          <RefreshCw className="h-3 w-3" />
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { continueWatching, recommendedVideos, fromYourChannels, coldStart } =
    data;

  function toVideoCardData(item: RecommendationItem) {
    return {
      id: item.id,
      title: item.title,
      thumbnails: item.thumbnail
        ? [{ url: item.thumbnail, width: 480, height: 270 }]
        : [],
      duration: item.duration ?? "",
      viewCount: item.viewCount ?? "",
      publishedAt: item.publishedAt ?? "",
      channelName: item.channelName,
      channelId: item.channelId,
      channelThumbnail: null,
    };
  }

  return (
    <div className="space-y-12">
      {/* Continue Watching */}
      {continueWatching.length > 0 && (
        <ContinueWatchingSection items={continueWatching} />
      )}

      {/* Recommended For You */}
      {recommendedVideos.length > 0 && (
        <section className="space-y-5">
          <SectionHeader
            icon={<Sparkles className="h-5 w-5 text-white" />}
            title={coldStart ? "Popular Right Now" : "Recommended For You"}
            subtitle={
              coldStart
                ? "Watch more to personalize your feed"
                : "Based on your viewing history"
            }
            accentColor="from-violet-500 to-indigo-500"
            action={
              isFetching ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-white/15" />
              ) : undefined
            }
          />

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {recommendedVideos.slice(0, 10).map((video, idx) => (
              <HomeVideoCard
                key={video.id}
                video={toVideoCardData(video)}
                index={idx}
              />
            ))}
          </div>
        </section>
      )}

      {/* From Your Channels */}
      {fromYourChannels.length > 0 && (
        <section className="space-y-5">
          <SectionHeader
            icon={<Heart className="h-5 w-5 text-white" />}
            title="From Your Channels"
            subtitle="New uploads from creators you follow"
            accentColor="from-pink-500 to-rose-500"
            href="/subscriptions"
          />

          <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
            {fromYourChannels.map((video, idx) => (
              <div key={video.id} className="w-[240px] shrink-0">
                <HomeVideoCard
                  video={toVideoCardData(video)}
                  index={idx}
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
