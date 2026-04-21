"use client";

import { use, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import {
  Loader2,
  ArrowLeft,
  Play,
  Eye,
  Clock,
  Music,
  Gamepad2,
  Code2,
  Brain,
  Clapperboard,
  GraduationCap,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { useSidebar } from "@/contexts/sidebar-context";
import { YTVideoCardSkeleton } from "@/components/video/YTVideoCard";
import { api, type SearchResult } from "@/lib/api";
import { cn } from "@/lib/utils";

const CATEGORY_META: Record<string, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  query: string;
}> = {
  music: {
    label: "Music",
    icon: Music,
    gradient: "from-pink-500 to-rose-500",
    query: "music hits trending songs 2025",
  },
  gaming: {
    label: "Gaming",
    icon: Gamepad2,
    gradient: "from-green-500 to-emerald-500",
    query: "gaming highlights best moments 2025",
  },
  programming: {
    label: "Coding",
    icon: Code2,
    gradient: "from-cyan-500 to-blue-500",
    query: "programming tutorial coding 2025",
  },
  ai: {
    label: "AI & Tech",
    icon: Brain,
    gradient: "from-purple-500 to-violet-500",
    query: "artificial intelligence machine learning deep learning",
  },
  film: {
    label: "Film & TV",
    icon: Clapperboard,
    gradient: "from-amber-500 to-yellow-500",
    query: "movie trailer film review 2025",
  },
  education: {
    label: "Education",
    icon: GraduationCap,
    gradient: "from-teal-500 to-cyan-500",
    query: "education online learning tutorial 2025",
  },
};

const DEFAULT_QUERY = "trending videos 2025";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams?.slug || "";
  const meta = CATEGORY_META[slug] ?? {
    label: slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    icon: Music,
    gradient: "from-violet-500 to-purple-500",
    query: DEFAULT_QUERY,
  };
  const Icon = meta.icon;

  const { isCollapsed } = useSidebar();
  const sidebarPadding = isCollapsed ? "lg:pl-[72px]" : "lg:pl-[248px]";

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    error,
  } = useInfiniteQuery({
    queryKey: ["category-search", slug],
    queryFn: async ({ pageParam }) => {
      const query = meta.query;
      const result = await api.searchV2(query, {
        sort: "relevance",
      });
      const pageSize = 20;
      const start = (pageParam ?? 0) * pageSize;
      const end = start + pageSize;
      const items = result.results.slice(start, end);
      return {
        items,
        estimatedResults: result.estimatedResults,
        nextPage: end < result.estimatedResults ? (pageParam ?? 0) + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000,
  });

  const { ref: sentinelRef, inView } = useInView({ threshold: 0, rootMargin: "600px" });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const videos: SearchResult[] = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Sidebar />
      <Navbar />

      <main className={cn("container mx-auto max-w-[1800px] px-4 pb-16 pt-4 lg:px-6", sidebarPadding)}>
        <div className="flex items-center gap-4 pt-4 mb-4">
          <Link
            href="/explore"
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Explore</span>
          </Link>
        </div>

        <div className={cn("mb-8 flex items-center gap-4 p-6 rounded-2xl bg-gradient-to-r", meta.gradient, "bg-opacity-10 border border-white/10")}>
          <div className={cn("flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br text-white", meta.gradient, "shadow-lg")}>
            <Icon className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{meta.label}</h1>
            <p className="text-sm text-white/60 mt-1">
              {videos.length > 0
                ? `${videos.length}+ videos`
                : `Explore ${meta.label.toLowerCase()} content`}
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            <YTVideoCardSkeleton count={20} />
          </div>
        )}

        {error && (
          <div className="py-20 text-center text-white/40">
            <p>Failed to load videos. Please try again.</p>
          </div>
        )}

        {!isLoading && videos.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {videos.map((video) => (
              <CategoryVideoCard key={video.id} video={video} />
            ))}
          </div>
        )}

        {!isLoading && videos.length === 0 && !error && (
          <div className="py-20 text-center text-white/40">
            <div className="bg-white/5 p-8 rounded-full mb-6 inline-block">
              <Icon className="h-16 w-16 text-white/20" />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">No videos found</h2>
            <p className="text-white/50 max-w-sm mx-auto">
              We couldn&apos;t find any {meta.label.toLowerCase()} videos. Try exploring other categories.
            </p>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 mt-6 rounded-full bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Explore
            </Link>
          </div>
        )}

        {isFetchingNextPage && (
          <div className="mt-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              <YTVideoCardSkeleton count={10} />
            </div>
          </div>
        )}

        <div ref={sentinelRef} className="h-6" aria-hidden="true" />

        {isFetchingNextPage && (
          <div className="flex items-center justify-center gap-2 py-4 text-white/40">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs">Loading more videos…</span>
          </div>
        )}

        {!hasNextPage && videos.length > 0 && (
          <div className="text-center py-8 text-white/30 text-sm">
            You&apos;ve seen all {meta.label.toLowerCase()} videos
          </div>
        )}
      </main>
    </div>
  );
}

function CategoryVideoCard({ video }: { video: SearchResult }) {
  return (
    <Link href={`/watch/${video.id}`} className="group">
      <div className="relative aspect-video rounded-xl overflow-hidden bg-[#181818] mb-2">
        {video.thumbnail || video.thumbnails?.[0] ? (
          <img
            src={video.thumbnail || video.thumbnails?.[0]?.url || ""}
            alt={video.title || "Video"}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : null}
        {video.duration && (
          <div className="absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
            {video.duration}
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/90 shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity scale-75 group-hover:scale-100">
            <Play className="h-5 w-5 text-black fill-black ml-0.5" />
          </div>
        </div>
      </div>
      <h3 className="text-sm font-medium text-white line-clamp-2 group-hover:text-primary transition-colors">
        {video.title}
      </h3>
      <div className="flex items-center gap-1 text-xs text-white/50 mt-1">
        <span className="truncate">{video.channelName}</span>
      </div>
      <div className="flex items-center gap-3 text-xs text-white/40 mt-0.5">
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
    </Link>
  );
}