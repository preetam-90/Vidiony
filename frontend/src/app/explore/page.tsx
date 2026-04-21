"use client";

import { useState, useRef } from "react";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Compass,
  Gamepad2,
  Music,
  Code2,
  Brain,
  Clapperboard,
  GraduationCap,
  ArrowRight,
  Play,
  Eye,
  Clock,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { useSidebar } from "@/contexts/sidebar-context";
import { HeroSkeleton, CategoryRowSkeleton } from "@/components/SkeletonLoader";
import { api, type SearchResult } from "@/lib/api";
import { cn } from "@/lib/utils";
import Image from "next/image";

const CATEGORIES = [
  { slug: "music", label: "Music", icon: Music, gradient: "from-pink-500 to-rose-500" },
  { slug: "gaming", label: "Gaming", icon: Gamepad2, gradient: "from-green-500 to-emerald-500" },
  { slug: "programming", label: "Coding", icon: Code2, gradient: "from-cyan-500 to-blue-500" },
  { slug: "ai", label: "AI & Tech", icon: Brain, gradient: "from-purple-500 to-violet-500" },
  { slug: "film", label: "Film & TV", icon: Clapperboard, gradient: "from-amber-500 to-yellow-500" },
  { slug: "education", label: "Education", icon: GraduationCap, gradient: "from-teal-500 to-cyan-500" },
] as const;

const CATEGORY_QUERIES: Record<string, string> = {
  music: "music hits trending songs 2025",
  gaming: "gaming highlights best moments 2025",
  programming: "programming tutorial coding 2025",
  ai: "artificial intelligence machine learning deep learning",
  film: "movie trailer film review 2025",
  education: "education online learning tutorial 2025",
};

function formatDuration(duration: string) {
  return duration;
}

function formatViewCount(viewCount: string) {
  return viewCount;
}

export default function ExplorePage() {
  const { isCollapsed } = useSidebar();
  const sidebarPadding = isCollapsed ? "lg:pl-[72px]" : "lg:pl-[248px]";

  const { data: trendingData, isLoading: trendingLoading } = useQuery({
    queryKey: ["explore-trending"],
    queryFn: () => api.getTrending("trending", "US"),
    staleTime: 5 * 60 * 1000,
  });

  const trendingVideos = trendingData?.videos ?? [];

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Sidebar />
      <Navbar />

      <main className={cn("container mx-auto max-w-[1800px] px-4 pb-16 pt-6 lg:px-6", sidebarPadding)}>
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20">
            <Compass className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Explore</h1>
            <p className="text-sm text-white/50">Discover trending videos and curated content</p>
          </div>
        </div>

                <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              Trending Now
            </h2>
          </div>

          {trendingLoading ? (
            <HeroSkeleton />
          ) : trendingVideos.length > 0 ? (
            <TrendingCarousel videos={trendingVideos.slice(0, 10)} />
          ) : (
            <div className="flex aspect-[21/9] items-center justify-center rounded-2xl bg-[#181818] text-white/40">
              No trending videos available
            </div>
          )}
        </section>

        {CATEGORIES.map((category) => (
          <CategorySection key={category.slug} category={category} />
        ))}
      </main>
    </div>
  );
}

function TrendingCarousel({ videos }: { videos: any[] }) {
  const plugin = useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true })
  );

  return (
    <Carousel
      plugins={[plugin.current]}
      className="w-full relative group"
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}
      opts={{
        align: "start",
        loop: true,
      }}
    >
      <CarouselContent className="-ml-4">
        {videos.map((video, index) => (
          <CarouselItem 
            key={video.videoId} 
            className="pl-4 md:basis-1/2 lg:basis-1/3"
          >
            <div className="p-1">
              <Link
                href={`/watch/${video.videoId}`}
                className="group/card relative block overflow-hidden rounded-2xl bg-[#181818] aspect-video"
              >
                {/* Rank Badge */}
                <div className="absolute top-2 left-2 z-10 bg-black/80 text-white font-bold px-3 py-1 rounded-full text-sm">
                  #{index + 1}
                </div>
                
                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity z-10">
                  <Play className="w-12 h-12 text-white fill-white drop-shadow-md" />
                </div>

                {video.thumbnail ? (
                  <img
                    src={video.thumbnail}
                    alt={video.title || "Video"}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-900/50 to-indigo-900/50" />
                )}
                
                {video.duration && (
                  <div className="absolute bottom-2 right-2 z-10 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    {formatDuration(video.duration)}
                  </div>
                )}
                
                {/* Gradient overlay for text legibility */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 pt-12">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-white font-semibold line-clamp-2 text-sm lg:text-base">
                      {video.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-white/70">
                      <span className="truncate">{video.channelName}</span>
                      <span className="w-1 h-1 rounded-full bg-white/30" />
                      <span className="shrink-0">{formatViewCount(video.viewCount)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      
      <CarouselPrevious className="hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity duration-300 -left-4 lg:-left-12 bg-[#181818] border-white/10 hover:bg-[#282828] hover:text-white text-white/70" />
      <CarouselNext className="hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity duration-300 -right-4 lg:-right-12 bg-[#181818] border-white/10 hover:bg-[#282828] hover:text-white text-white/70" />
    </Carousel>
  );
}

function CategorySection({
  category,
}: {
  category: { slug: string; label: string; icon: React.ComponentType<{ className?: string }>; gradient: string };
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const query = CATEGORY_QUERIES[category.slug];
  const Icon = category.icon;

  const { data, isLoading, error } = useQuery({
    queryKey: ["explore-category", category.slug],
    queryFn: () => api.searchV2(query),
    staleTime: 5 * 60 * 1000,
  });

  const allVideos = data?.results ?? [];
  const displayedVideos: SearchResult[] = isExpanded ? allVideos : allVideos.slice(0, 6);
  const hasMore = allVideos.length > 6;

  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href={`/category/${category.slug}`}
          className="flex items-center gap-3 group"
        >
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white", category.gradient)}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white group-hover:text-primary transition-colors flex items-center gap-2">
              {category.label}
              <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </h2>
            <p className="text-xs text-white/40">Explore {category.label.toLowerCase()} content</p>
          </div>
        </Link>
      </div>

      {isLoading ? (
        <CategoryRowSkeleton />
      ) : error ? (
        <div className="flex aspect-video items-center justify-center rounded-xl bg-[#181818] text-white/40 text-sm">
          Failed to load {category.label} videos
        </div>
      ) : displayedVideos.length === 0 ? (
        <div className="flex aspect-video items-center justify-center rounded-xl bg-[#181818] text-white/40 text-sm">
          No {category.label.toLowerCase()} videos found
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {displayedVideos.map((video: SearchResult) => (
            <Link key={video.id} href={`/watch/${video.id}`} className="group">
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
                    {formatDuration(video.duration)}
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
              <p className="text-xs text-white/50 mt-1 truncate">{video.channelName}</p>
            </Link>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all border border-white/10"
          >
            {isExpanded ? "Show Less" : `Show More ${category.label}`}
            <ArrowRight className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-90")} />
          </button>
        </div>
      )}
    </section>
  );
}