"use client";

import { useState } from "react";
import { Zap, TrendingUp, Shield } from "lucide-react";
import { Navbar }           from "@/components/Navbar";
import { CategoryStrip }    from "@/components/CategoryStrip";
import { FeaturedHeroVideo } from "@/components/FeaturedHeroVideo";
import { VideoCard }        from "@/components/VideoCard";
import { CategoryRow }      from "@/components/CategoryRow";
import { ShortVideoCard }   from "@/components/ShortVideoCard";
import { InfiniteVideoFeed } from "@/components/InfiniteVideoFeed";
import {
  HeroSkeleton,
  VideoGridSkeleton,
  CategoryRowSkeleton,
} from "@/components/SkeletonLoader";
import { useHomeFeed }       from "@/hooks/useHomeFeed";
import { useCategoryVideos } from "@/hooks/useCategoryVideos";
import Link from "next/link";

// ── Category label map (for dynamic section heading) ───────────────────
const CATEGORY_LABELS: Record<string, string> = {
  all:           "Trending Now",
  ai:            "Artificial Intelligence",
  programming:   "Programming",
  "system-design": "System Design",
  cybersecurity: "Cybersecurity",
  cloud:         "Cloud Computing",
  "data-science": "Data Science",
  devops:        "DevOps",
};

// ── Reusable section heading ────────────────────────────────────────────
function SectionHeading({
  icon,
  title,
  subtitle,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      {icon && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-violet-400">
          {icon}
        </div>
      )}
      <div>
        <h2 className="text-lg font-bold text-white sm:text-xl">{title}</h2>
        {subtitle && <p className="text-xs text-white/40">{subtitle}</p>}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// HOMEPAGE
// ═════════════════════════════════════════════════════════════════════════
export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState("all");

  // ── Main feed: trending OR filtered by category ─────────────────────
  const { data: feedVideos = [], isLoading: feedLoading } = useHomeFeed(activeCategory);

  // ── Shorts row (always from "shorts" search) ─────────────────────────
  const { data: shortsVideos, isLoading: shortsLoading } = useCategoryVideos("shorts");

  const featuredVideo = feedVideos[0] ?? null;
  const trendingGrid  = feedVideos.slice(1, 9);   // 8 cards after the hero
  const isAll         = activeCategory === "all";
  const gridTitle     = CATEGORY_LABELS[activeCategory] ?? activeCategory;

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* ── NAVBAR ───────────────────────────────────────────────── */}
      <Navbar />

      <main className="mx-auto max-w-[1800px] space-y-10 px-4 pb-16 pt-2 lg:px-6">

        {/* ── CATEGORY STRIP ───────────────────────────────────────── */}
        <CategoryStrip
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        {/* ── FEATURED HERO ────────────────────────────────────────── */}
        {feedLoading ? (
          <HeroSkeleton />
        ) : featuredVideo ? (
          <FeaturedHeroVideo video={featuredVideo} />
        ) : null}

        {/* ── TRENDING NOW (4-card row) ─────────────────────────────── */}
        <section className="space-y-5">
          <SectionHeading
            icon={<TrendingUp className="h-5 w-5" />}
            title={gridTitle}
            subtitle={isAll ? "Most watched right now" : `Top videos in ${gridTitle}`}
          />
          {feedLoading ? (
            <VideoGridSkeleton count={4} />
          ) : trendingGrid.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {trendingGrid.map((v) => (
                <VideoCard key={v.id} video={v} />
              ))}
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-white/30">
              No videos found for this category.
            </p>
          )}
        </section>

        {/* ── SYSTEM DESIGN DEEP DIVES (only in "all" view) ────────── */}
        {isAll && (
          <CategoryRow
            title="System Design Deep Dives"
            category="system-design"
          />
        )}

        {/* ── SHORTS ───────────────────────────────────────────────── */}
        <section className="space-y-5">
          <SectionHeading
            icon={<Zap className="h-5 w-5" />}
            title="Shorts"
            subtitle="Quick takes · under 5 minutes"
          />
          {shortsLoading ? (
            <CategoryRowSkeleton />
          ) : shortsVideos && shortsVideos.length > 0 ? (
            <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
              {shortsVideos.slice(0, 12).map((v) => (
                <ShortVideoCard key={`short-${v.id}`} video={v} />
              ))}
            </div>
          ) : null}
        </section>

        {/* ── DEFENSIVE CYBERSECURITY (only in "all" view) ─────────── */}
        {isAll && (
          <CategoryRow
            title="Defensive Cybersecurity"
            category="cybersecurity"
          />
        )}

        {/* ── DISCOVERY FEED ───────────────────────────────────────── */}
        <section className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
            <span className="text-sm font-semibold uppercase tracking-widest text-white/25">
              Discovery Feed
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
          </div>
          <InfiniteVideoFeed />
        </section>
      </main>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] bg-[#0a0a0a]">
        <div className="mx-auto flex max-w-[1800px] flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
              <svg viewBox="0 0 40 40" className="h-5 w-5" fill="none">
                <path
                  d="M10 30V10L20 22L30 10V30"
                  stroke="white"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <span className="text-sm font-bold text-white">Vidion</span>
              <span className="ml-2 text-xs text-white/30">Tech video discovery</span>
            </div>
          </div>
          <div className="flex gap-6 text-xs text-white/30">
            {["About", "Help", "Terms", "Privacy"].map((l) => (
              <Link
                key={l}
                href={`/${l.toLowerCase()}`}
                className="transition hover:text-white/60"
              >
                {l}
              </Link>
            ))}
          </div>
          <p className="text-xs text-white/20">© 2026 Vidion. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
