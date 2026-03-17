"use client";

import { use, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { YTVideoCard, YTVideoCardSkeleton } from "@/components/video/YTVideoCard";
import { useSectionFeed } from "@/hooks/useSectionFeed";

interface SectionPageProps {
  params: Promise<{ slug: string }>;
}

export default function SectionPage({ params }: SectionPageProps) {
  // Unwrap the params Promise using React.use()
  const resolvedParams = use(params);
  const slug = resolvedParams?.slug || "";
  const sectionTitle = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useSectionFeed(sectionTitle);

  const { ref: sentinelRef, inView } = useInView({ threshold: 0, rootMargin: "600px" });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Aggregate videos from all pages for this section
  const videos: any[] = [];
  for (const page of data?.pages ?? []) {
    for (const section of page.sections) {
      videos.push(...section.videos);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* ── NAVBAR ───────────────────────────────────────────────── */}
      <Navbar />

      <main className="mx-auto max-w-[1800px] space-y-8 px-4 pb-16 pt-4 lg:px-6">
        {/* Back Button */}
        <div className="flex items-center gap-4 pt-4">
          <Link href="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Section Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">{sectionTitle}</h1>
          <p className="text-white/60">
            Discover the latest {sectionTitle.toLowerCase()} videos
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              <YTVideoCardSkeleton count={20} />
            </div>
          </div>
        )}

        {/* Videos Grid */}
        {!isLoading && videos.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {videos.map((v: any) => (
              <YTVideoCard key={v.id} video={v} />
            ))}
          </div>
        )}

        {/* No Videos Found */}
        {!isLoading && videos.length === 0 && (
          <div className="py-20 text-center text-white/40">
            <p>No videos found in this section.</p>
          </div>
        )}

        {/* Loading More */}
        {isFetchingNextPage && (
          <div className="mt-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              <YTVideoCardSkeleton count={10} />
            </div>
          </div>
        )}

        {/* Sentinel */}
        <div ref={sentinelRef} className="h-6" aria-hidden="true" />

        {/* Loading Indicator */}
        {isFetchingNextPage && (
          <div className="flex items-center justify-center gap-2 py-4 text-white/40">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs">Loading more videos…</span>
          </div>
        )}

        {!hasNextPage && videos.length > 0 && (
          <div className="text-center py-8 text-white/30 text-sm">
            You've seen all {sectionTitle.toLowerCase()} videos
          </div>
        )}
      </main>
    </div>
  );
}