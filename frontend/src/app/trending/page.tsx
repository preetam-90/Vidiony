"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api, type TrendingVideo } from "@/lib/api";
import { Navbar } from "@/components/layout/navbar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp, Music, Gamepad2, Film, Newspaper, Globe,
  Eye, Clock, Play,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "trending", label: "All Trending", icon: TrendingUp },
  { value: "music", label: "Music", icon: Music },
  { value: "gaming", label: "Gaming", icon: Gamepad2 },
  { value: "movies", label: "Movies", icon: Film },
  { value: "news", label: "News", icon: Newspaper },
] as const;

const REGIONS = [
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "IN", label: "India" },
  { value: "JP", label: "Japan" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "BR", label: "Brazil" },
  { value: "CA", label: "Canada" },
  { value: "AU", label: "Australia" },
  { value: "KR", label: "South Korea" },
];

function TrendingCard({ video, rank }: { video: TrendingVideo; rank: number }) {
  const thumb = video.thumbnail;
  const router = useRouter();

  return (
    <Link href={`/watch/${video.videoId}`} className="group flex gap-4 rounded-xl p-3 hover:bg-white/[0.04] transition-colors">
      {/* Rank */}
      <div className="flex-shrink-0 w-8 text-center">
        <span className={cn(
          "text-2xl font-black leading-none",
          rank <= 3 ? "text-violet-400" : "text-white/20"
        )}>
          {rank}
        </span>
      </div>

      {/* Thumbnail */}
      <div className="relative flex-shrink-0 w-40 aspect-video rounded-lg overflow-hidden bg-white/5">
        {thumb && <img src={thumb} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />}
        {video.duration && (
          <div className="absolute bottom-1 right-1 rounded px-1.5 py-0.5 bg-black/80 text-[10px] font-medium">
            {video.duration}
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="rounded-full bg-black/70 p-2">
            <Play className="h-4 w-4 fill-white text-white" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-white transition-colors">
          {video.title}
        </p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/channel/${video.channelId}`);
          }}
          className="mt-1 text-xs text-muted-foreground hover:text-primary transition-colors block text-left"
        >
          {video.channelName}
        </button>
        <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
          {video.viewCount && (
            <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{video.viewCount}</span>
          )}
          {video.publishedAt && (
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{video.publishedAt}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function TrendingCardSkeleton() {
  return (
    <div className="flex gap-4 p-3">
      <Skeleton className="w-8 h-8 flex-shrink-0" />
      <Skeleton className="w-40 aspect-video rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

export default function TrendingPage() {
  const [category, setCategory] = useState<string>("trending");
  const [region, setRegion] = useState("US");

  const FALLBACK_VIDEOS: TrendingVideo[] = [
    {
      videoId: "sample-1",
      title: "Building a Modern Video Platform with Next.js",
      channelName: "Tech Creator",
      channelId: "tech-1",
      thumbnail: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=450&fit=crop",
      viewCount: "125K",
      publishedAt: "2 days ago",
      duration: "24:35",
      category: "trending",
    },
    {
      videoId: "sample-2",
      title: "TypeScript Advanced Types Tutorial",
      channelName: "Code Academy",
      channelId: "code-1",
      thumbnail: "https://images.unsplash.com/photo-1521747116042-5a810fda9664?w=800&h=450&fit=crop",
      viewCount: "45K",
      publishedAt: "1 week ago",
      duration: "18:30",
      category: "music",
    },
    {
      videoId: "sample-3",
      title: "React Server Components Deep Dive",
      channelName: "Frontend Masters",
      channelId: "fm-1",
      thumbnail: "https://images.unsplash.com/photo-1504252060326-7f94b89a4b9d?w=800&h=450&fit=crop",
      viewCount: "89K",
      publishedAt: "5 days ago",
      duration: "22:15",
      category: "gaming",
    },
    {
      videoId: "sample-4",
      title: "Building a REST API with Fastify",
      channelName: "Backend School",
      channelId: "backend-1",
      thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=450&fit=crop",
      viewCount: "120K",
      publishedAt: "2 weeks ago",
      duration: "35:00",
      category: "movies",
    },
    {
      videoId: "sample-5",
      title: "Tailwind CSS v4 - Complete Guide",
      channelName: "Design Lab",
      channelId: "design-1",
      thumbnail: "https://images.unsplash.com/photo-1503602642458-232111445657?w=800&h=450&fit=crop",
      viewCount: "200K",
      publishedAt: "3 days ago",
      duration: "28:45",
      category: "news",
    },
  ];

  const { data, isLoading, error } = useQuery({
    queryKey: ["trending", category, region],
    queryFn: async () => {
      try {
        const res = await api.getTrending(category, region);
        // If backend returns no videos (e.g., no DB or cache), fall back to legacy feed
        if (!res || !res.videos || res.videos.length === 0) {
          const feed = await api.getFeed(1, 20);
          // map legacy VideoCardData -> TrendingVideo
          const mapped = feed.videos.map((v) => ({
            videoId: v.id,
            title: v.title,
            channelName: v.channelName,
            channelId: v.channelId,
            thumbnail: v.thumbnails?.[0]?.url ?? "",
            viewCount: v.viewCount ?? "",
            publishedAt: v.publishedAt ?? "",
            duration: v.duration ?? "",
            category: category,
          }));
          // if feed also empty, return static fallback
          if (mapped.length === 0) return { videos: FALLBACK_VIDEOS, category, cachedAt: null };
          return { videos: mapped, category, cachedAt: null };
        }
        return res;
      } catch (e) {
        // If trending endpoint fails, try legacy feed as a graceful fallback
        try {
          const feed = await api.getFeed(1, 20);
          const mapped = feed.videos.map((v) => ({
            videoId: v.id,
            title: v.title,
            channelName: v.channelName,
            channelId: v.channelId,
            thumbnail: v.thumbnails?.[0]?.url ?? "",
            viewCount: v.viewCount ?? "",
            publishedAt: v.publishedAt ?? "",
            duration: v.duration ?? "",
            category: category,
          }));
          if (mapped.length === 0) return { videos: FALLBACK_VIDEOS, category, cachedAt: null };
          return { videos: mapped, category, cachedAt: null };
        } catch (err) {
          throw e;
        }
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const videos = data?.videos ?? [];
  const cachedAt = data?.cachedAt ? new Date(data.cachedAt).toLocaleTimeString() : null;

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/20 text-violet-400">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Trending</h1>
            <p className="text-sm text-muted-foreground">
              What the world is watching right now
              {cachedAt && <span className="ml-2 text-xs opacity-50">· updated {cachedAt}</span>}
            </p>
          </div>
        </div>

        {/* Category tabs */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = category === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap border transition-all",
                  active
                    ? "bg-white text-black border-white"
                    : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" />
                {cat.label}
              </button>
            );
          })}

          <div className="ml-auto flex-shrink-0">
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="rounded-full bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/70 hover:bg-white/10 focus:outline-none cursor-pointer"
            >
              {REGIONS.map((r) => (
                <option key={r.value} value={r.value} className="bg-[#1a1a1a]">
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results */}
        {error && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-6 text-center">
            <p className="text-destructive">Failed to load trending. Backend may need database.</p>
          </div>
        )}

        <div className="divide-y divide-white/5">
          {isLoading
            ? Array.from({ length: 15 }).map((_, i) => <TrendingCardSkeleton key={i} />)
            : videos.map((v, i) => <TrendingCard key={v.videoId} video={v} rank={i + 1} />)}
        </div>

        {!isLoading && videos.length === 0 && !error && (
          <div className="py-16 text-center text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>No trending videos found. Start the backend with a database to enable trending cache.</p>
          </div>
        )}
      </main>
    </div>
  );
}
