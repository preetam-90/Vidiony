"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { useSidebar } from "@/contexts/sidebar-context";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, Eye, Clock, RefreshCw, WifiOff } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Thumb {
  url: string;
  width: number;
  height: number;
}

interface FeedVideo {
  id: string;
  title: string;
  thumbnails: Thumb[];
  duration: string;
  viewCount: string;
  publishedAt: string;
  channelName: string;
  channelId: string;
  channelThumbnail: Thumb | null;
}

interface FeedSection {
  title: string;
  videos: FeedVideo[];
}

function getBestThumb(thumbnails: Thumb[]): string {
  if (!thumbnails?.length) return "";
  const sorted = [...thumbnails].sort((a, b) => (b.width ?? 0) - (a.width ?? 0));
  return sorted[0]?.url ?? "";
}

function VideoCard({ video }: { video: FeedVideo }) {
  const router = useRouter();
  const thumbnail = getBestThumb(video.thumbnails);

  return (
    <Link
      href={"/watch/" + video.id}
      className="group flex flex-col gap-3 rounded-xl p-2 hover:bg-white/[0.04] transition-all duration-300"
    >
      <div className="relative aspect-video rounded-xl overflow-hidden bg-white/5 ring-1 ring-white/[0.06]">
        {thumbnail && (
          <img
            src={thumbnail}
            alt={video.title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}
        {video.duration && (
          <div className="absolute bottom-2 right-2 rounded-md px-1.5 py-0.5 bg-black/80 backdrop-blur-sm text-[10px] font-semibold">
            {video.duration}
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="rounded-full bg-black/60 backdrop-blur-sm p-2.5 ring-1 ring-white/20">
            <Play className="h-4 w-4 fill-white text-white" />
          </div>
        </div>
      </div>

      <div className="flex gap-3 px-1">
        {video.channelThumbnail && (
          <img
            src={video.channelThumbnail.url}
            alt=""
            className="h-9 w-9 rounded-full object-cover flex-shrink-0"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm leading-snug line-clamp-2 text-white/90 group-hover:text-white transition-colors">
            {video.title}
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              router.push("/channel/" + video.channelId);
            }}
            className="mt-1.5 text-xs text-white/40 hover:text-violet-400 transition-colors block text-left"
          >
            {video.channelName}
          </button>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-white/20">
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
      </div>
    </Link>
  );
}

function VideoCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl p-2">
      <Skeleton className="aspect-video rounded-xl" />
      <div className="flex gap-3 px-1">
        <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-48" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <VideoCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function FeedSectionComponent({ section }: { section: FeedSection }) {
  if (section.videos.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold tracking-tight text-white">{section.title}</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {section.videos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </section>
  );
}

export default function FeedPage() {
  const { isCollapsed } = useSidebar();
  const sidebarPadding = isCollapsed ? "lg:pl-[72px]" : "lg:pl-[248px]";

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["feed"],
    queryFn: async () => {
      const res = await fetch("/api/feed");
      if (!res.ok) throw new Error("Failed to fetch feed");
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "No feed data");
      return json as {
        sections: FeedSection[];
        continuationToken: string | null;
        count: number;
      };
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const displayedSections = data?.sections ?? [];
  const hasMore = !!data?.continuationToken;

  const handleLoadMore = () => {};

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      <Sidebar />
      <Navbar />

      <main className={cn("mx-auto max-w-7xl px-4 py-8 sm:px-6", sidebarPadding)}>
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/20">
            <RefreshCw className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">Feed</h1>
            <p className="text-sm text-white/30">Your personalized video recommendations</p>
          </div>
        </div>

        {error && !isLoading && (
          <div className="rounded-2xl bg-red-500/5 border border-red-500/20 p-8 text-center">
            <WifiOff className="h-10 w-10 mx-auto mb-3 text-red-400/50" />
            <p className="text-red-400 font-medium">Unable to load your feed</p>
            <p className="text-xs text-red-400/40 mt-1">Please try again in a moment</p>
            <button
              onClick={() => refetch()}
              className="mt-4 rounded-xl bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {isLoading && (
          <div className="space-y-10">
            <SectionSkeleton />
            <SectionSkeleton />
            <SectionSkeleton />
          </div>
        )}

        {!isLoading && !error && displayedSections.length > 0 && (
          <div>
            {displayedSections.map((section) => (
              <FeedSectionComponent key={section.title} section={section} />
            ))}

            {hasMore && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  className="rounded-xl bg-white/[0.04] border border-white/[0.08] px-6 py-3 text-sm font-semibold text-white/60 hover:bg-white/[0.06] hover:text-white/80 transition-all"
                >
                  Load More
                </button>
              </div>
            )}
          </div>
        )}

        {!isLoading && !error && displayedSections.length === 0 && (
          <div className="py-20 text-center">
            <RefreshCw className="h-14 w-14 mx-auto mb-4 text-white/[0.06]" />
            <p className="text-white/20 font-medium">No videos in your feed</p>
            <p className="text-xs text-white/10 mt-1">
              Subscribe to channels or watch more videos to personalize your feed
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                href="/explore"
                className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 transition-colors"
              >
                Explore
              </Link>
              <Link
                href="/trending"
                className="rounded-xl bg-white/[0.04] border border-white/[0.08] px-5 py-2.5 text-sm font-semibold text-white/60 hover:bg-white/[0.06] transition-colors"
              >
                Trending
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
