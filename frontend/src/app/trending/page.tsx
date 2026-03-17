"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { useSidebar } from "@/contexts/sidebar-context";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp, Music, Gamepad2, Film, Newspaper,
  Eye, Clock, Play, Flame, ChevronRight, Crown,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrendingVideo {
  videoId: string;
  title: string;
  channelName: string;
  channelId: string;
  channelThumbnail: string;
  thumbnail: string;
  viewCount: string;
  publishedAt: string;
  duration: string;
  category: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: "trending", label: "All Trending", icon: Flame },
  { value: "music", label: "Music", icon: Music },
  { value: "gaming", label: "Gaming", icon: Gamepad2 },
  { value: "movies", label: "Movies", icon: Film },
  { value: "news", label: "News", icon: Newspaper },
] as const;

const REGIONS = [
  { value: "IN", label: "🇮🇳 India" },
  { value: "US", label: "🇺🇸 United States" },
  { value: "GB", label: "🇬🇧 United Kingdom" },
  { value: "JP", label: "🇯🇵 Japan" },
  { value: "DE", label: "🇩🇪 Germany" },
  { value: "FR", label: "🇫🇷 France" },
  { value: "BR", label: "🇧🇷 Brazil" },
  { value: "CA", label: "🇨🇦 Canada" },
  { value: "AU", label: "🇦🇺 Australia" },
  { value: "KR", label: "🇰🇷 South Korea" },
];

// ─── Hero Card (Top 1) ───────────────────────────────────────────────────────

function HeroTrendingCard({ video }: { video: TrendingVideo }) {
  const router = useRouter();

  return (
    <Link
      href={`/watch/${video.videoId}`}
      className="group relative block overflow-hidden rounded-2xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.06] hover:border-violet-500/30 transition-all duration-500"
    >
      <div className="flex flex-col md:flex-row">
        {/* Thumbnail */}
        <div className="relative md:w-[55%] aspect-video overflow-hidden">
          {video.thumbnail && (
            <img
              src={video.thumbnail}
              alt={video.title}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0f0f0f]/90 hidden md:block" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f]/80 via-transparent to-transparent md:hidden" />

          {/* Play button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="rounded-full bg-violet-600/90 p-4 shadow-2xl shadow-violet-500/30 backdrop-blur-sm">
              <Play className="h-8 w-8 fill-white text-white" />
            </div>
          </div>

          {/* Duration */}
          {video.duration && (
            <div className="absolute bottom-3 right-3 rounded-lg px-2.5 py-1 bg-black/70 backdrop-blur-sm text-xs font-semibold tracking-wide">
              {video.duration}
            </div>
          )}

          {/* #1 Badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1.5 text-xs font-black text-black shadow-lg shadow-amber-500/30">
            <Crown className="h-3.5 w-3.5" />
            #1 TRENDING
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 p-5 md:p-8 flex flex-col justify-center">
          <h2 className="text-xl md:text-2xl font-bold leading-tight line-clamp-3 group-hover:text-white transition-colors text-white/90">
            {video.title}
          </h2>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              router.push(`/channel/${video.channelId}`);
            }}
            className="mt-3 flex items-center gap-2 text-sm text-white/50 hover:text-violet-400 transition-colors w-fit"
          >
            {video.channelThumbnail ? (
              <img
                src={video.channelThumbnail}
                alt=""
                className="h-6 w-6 rounded-full object-cover"
              />
            ) : (
              <div className="h-6 w-6 rounded-full bg-violet-600/30 flex items-center justify-center text-[10px] font-bold text-violet-300">
                {video.channelName.charAt(0)}
              </div>
            )}
            {video.channelName}
          </button>
          <div className="mt-3 flex items-center gap-4 text-xs text-white/30">
            {video.viewCount && (
              <span className="flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" />
                {video.viewCount}
              </span>
            )}
            {video.publishedAt && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {video.publishedAt}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Rank Card ────────────────────────────────────────────────────────────────

function TrendingCard({ video, rank }: { video: TrendingVideo; rank: number }) {
  const router = useRouter();
  const isTop3 = rank <= 3;

  return (
    <Link
      href={`/watch/${video.videoId}`}
      className="group flex gap-4 rounded-xl p-3 hover:bg-white/[0.04] transition-all duration-300"
    >
      {/* Rank */}
      <div className="flex-shrink-0 w-10 flex items-start justify-center pt-1">
        <span
          className={cn(
            "text-3xl font-black leading-none tabular-nums",
            isTop3
              ? "bg-gradient-to-b from-violet-400 to-violet-600 bg-clip-text text-transparent"
              : "text-white/[0.08]"
          )}
        >
          {rank}
        </span>
      </div>

      {/* Thumbnail */}
      <div className="relative flex-shrink-0 w-44 aspect-video rounded-xl overflow-hidden bg-white/5 ring-1 ring-white/[0.06]">
        {video.thumbnail && (
          <img
            src={video.thumbnail}
            alt=""
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}
        {video.duration && (
          <div className="absolute bottom-1.5 right-1.5 rounded-md px-1.5 py-0.5 bg-black/80 backdrop-blur-sm text-[10px] font-semibold">
            {video.duration}
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="rounded-full bg-black/60 backdrop-blur-sm p-2.5 ring-1 ring-white/20">
            <Play className="h-4 w-4 fill-white text-white" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1 py-0.5">
        <p className="font-semibold text-sm leading-snug line-clamp-2 text-white/80 group-hover:text-white transition-colors">
          {video.title}
        </p>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            router.push(`/channel/${video.channelId}`);
          }}
          className="mt-1.5 text-xs text-white/30 hover:text-violet-400 transition-colors block text-left"
        >
          {video.channelName}
        </button>
        <div className="mt-2 flex items-center gap-3 text-[11px] text-white/20">
          {video.viewCount && (
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {video.viewCount}
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

      {/* Arrow on hover */}
      <div className="flex-shrink-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight className="h-4 w-4 text-white/20" />
      </div>
    </Link>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function HeroSkeleton() {
  return (
    <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
      <div className="flex flex-col md:flex-row">
        <Skeleton className="md:w-[55%] aspect-video" />
        <div className="flex-1 p-8 space-y-4">
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-4 w-1/3 mt-4" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
    </div>
  );
}

function TrendingCardSkeleton() {
  return (
    <div className="flex gap-4 p-3">
      <Skeleton className="w-10 h-8 flex-shrink-0" />
      <Skeleton className="w-44 aspect-video rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TrendingPage() {
  const { isCollapsed } = useSidebar();
  const sidebarPadding = isCollapsed ? "lg:pl-[72px]" : "lg:pl-[248px]";

  const [category, setCategory] = useState<string>("trending");
  const [region, setRegion] = useState("IN");

  const { data, isLoading, error } = useQuery({
    queryKey: ["trending", category, region],
    queryFn: async () => {
      const res = await fetch(
        `/api/trending?category=${encodeURIComponent(category)}&region=${encodeURIComponent(region)}`
      );
      if (!res.ok) throw new Error("Failed to fetch trending");
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "No trending data");
      return json as {
        videos: TrendingVideo[];
        category: string;
        region: string;
        cachedAt: string;
      };
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const videos = data?.videos ?? [];
  const heroVideo = videos[0];
  const restVideos = videos.slice(1);
  const cachedAt = data?.cachedAt
    ? new Date(data.cachedAt).toLocaleTimeString()
    : null;

  const regionLabel = REGIONS.find((r) => r.value === region)?.label ?? region;

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      <Sidebar />
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/20">
              <Flame className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white">
                Trending
              </h1>
              <p className="text-sm text-white/30">
                Top trending videos in {regionLabel.replace(/^.{2}\s/, "")}
                {cachedAt && (
                  <span className="ml-2 text-[10px] text-white/15">
                    · {cachedAt}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Region selector */}
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="self-start rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-2.5 text-sm text-white/60 hover:bg-white/[0.06] hover:border-white/[0.12] focus:outline-none focus:ring-1 focus:ring-violet-500/40 cursor-pointer transition-all"
          >
            {REGIONS.map((r) => (
              <option key={r.value} value={r.value} className="bg-[#1a1a1a]">
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* Category tabs */}
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = category === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold whitespace-nowrap transition-all duration-300",
                  active
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20"
                    : "bg-white/[0.04] text-white/40 border border-white/[0.06] hover:bg-white/[0.06] hover:text-white/60"
                )}
              >
                <Icon className="h-4 w-4" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Error state */}
        {error && !isLoading && (
          <div className="rounded-2xl bg-red-500/5 border border-red-500/20 p-8 text-center">
            <Flame className="h-10 w-10 mx-auto mb-3 text-red-400/50" />
            <p className="text-red-400 font-medium">
              Unable to load trending videos
            </p>
            <p className="text-xs text-red-400/40 mt-1">
              Please try again in a moment
            </p>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-6">
            <HeroSkeleton />
            <div className="divide-y divide-white/[0.03]">
              {Array.from({ length: 12 }).map((_, i) => (
                <TrendingCardSkeleton key={i} />
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        {!isLoading && !error && videos.length > 0 && (
          <div className="space-y-6">
            {/* Hero: #1 trending */}
            {heroVideo && <HeroTrendingCard video={heroVideo} />}

            {/* Divider */}
            <div className="flex items-center gap-4 pt-2">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/10">
                Top {restVideos.length + 1} trending
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            </div>

            {/* Rest of the list */}
            <div className="divide-y divide-white/[0.03]">
              {restVideos.map((v, i) => (
                <TrendingCard key={v.videoId} video={v} rank={i + 2} />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && videos.length === 0 && (
          <div className="py-20 text-center">
            <Flame className="h-14 w-14 mx-auto mb-4 text-white/[0.06]" />
            <p className="text-white/20 font-medium">
              No trending videos found for this region
            </p>
            <p className="text-xs text-white/10 mt-1">
              Try selecting a different region or category
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
