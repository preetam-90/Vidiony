"use client";

import { useState } from "react";
import {
  Gamepad2,
  Music,
  Code2,
  Brain,
  Clapperboard,
  GraduationCap,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { useSidebar } from "@/contexts/sidebar-context";
import { CategoryChips } from "@/components/home/CategoryChips";
import { RecommendedSection } from "@/components/home/RecommendedSection";
import { HypedSection } from "@/components/home/HypedSection";
import { ShortsRow } from "@/components/home/ShortsRow";
import { LiveStreamSection } from "@/components/home/LiveStreamSection";
import { TopicRow } from "@/components/home/TopicRow";
import { HomeFeedSections } from "@/components/home/HomeFeedSections";
import { InfiniteVideoGrid } from "@/components/home/InfiniteVideoGrid";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════════════════════════
// VIDION — Homepage
// Modern video discovery experience
// ═══════════════════════════════════════════════════════════════════════════════

function HomeContent() {
  const [activeCategory, setActiveCategory] = useState("all");
  const { isCollapsed } = useSidebar();
  const isAll = activeCategory === "all";
  const sidebarPadding = isCollapsed ? "lg:pl-[72px]" : "lg:pl-[248px]";

  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* ── SIDEBAR ────────────────────────────────────────────────────── */}
      <Sidebar />

      {/* ── NAVBAR ──────────────────────────────────────────────────── */}
      <Navbar />

      {/* ── CATEGORY CHIPS (sticky below navbar) ───────────────────── */}
      <div className={cn("mx-auto max-w-[1920px] px-4 lg:px-8", sidebarPadding)}>
        <CategoryChips
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
      </div>

      {/* ── MAIN CONTENT ───────────────────────────────────────────── */}
      <main className={cn("mx-auto max-w-[1920px] space-y-14 px-4 pb-24 pt-6 lg:px-8", sidebarPadding)}>
        {isAll ? (
          <>
            {/* ── Personalized (Continue Watching + Recommendations) ── */}
            <RecommendedSection />

            {/* ── 🔥 Hyped Right Now ────────────────────────────────── */}
            <HypedSection />

            {/* ── YouTube Home Feed Sections ─────────────────────────── */}
            <HomeFeedSections />

            {/* ── Topic Rows ────────────────────────────────────────── */}
            <TopicRow
              title="Gaming"
              category="gaming"
              icon={<Gamepad2 className="h-5 w-5 text-white" />}
              accentColor="from-green-500 to-emerald-500"
            />

            <TopicRow
              title="Music"
              category="music"
              icon={<Music className="h-5 w-5 text-white" />}
              accentColor="from-pink-500 to-rose-500"
            />

            {/* ── Shorts ────────────────────────────────────────────── */}
            <ShortsRow />

            <TopicRow
              title="Programming"
              category="programming"
              icon={<Code2 className="h-5 w-5 text-white" />}
              accentColor="from-cyan-500 to-blue-500"
            />

            {/* ── Live Streams ──────────────────────────────────────── */}
            <LiveStreamSection />

            <TopicRow
              title="AI & Machine Learning"
              category="ai"
              icon={<Brain className="h-5 w-5 text-white" />}
              accentColor="from-purple-500 to-violet-500"
            />

            <TopicRow
              title="Film & TV"
              category="film"
              icon={<Clapperboard className="h-5 w-5 text-white" />}
              accentColor="from-amber-500 to-yellow-500"
            />

            <TopicRow
              title="Education"
              category="education"
              icon={<GraduationCap className="h-5 w-5 text-white" />}
              accentColor="from-teal-500 to-cyan-500"
            />

            {/* ── Infinite Scroll Grid — "For You" ──────────────────── */}
            <section className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
                <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-white/15">
                  <span className="h-1 w-1 rounded-full bg-violet-500/40" />
                  For You
                  <span className="h-1 w-1 rounded-full bg-violet-500/40" />
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
              </div>
              <InfiniteVideoGrid category="all" />
            </section>
          </>
        ) : (
          /* ── Category-Filtered View ──────────────────────────────── */
          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/15">
                {activeCategory.replace(/-/g, " ")}
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
            </div>
            <InfiniteVideoGrid
              key={activeCategory}
              category={activeCategory}
            />
          </section>
        )}
      </main>

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      <footer className={cn("border-t border-white/[0.03] bg-[#050507]", sidebarPadding)}>
        <div className="mx-auto flex max-w-[1920px] flex-col items-center justify-between gap-6 px-8 py-10 md:flex-row">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/15">
              <svg viewBox="0 0 40 40" className="h-4 w-4" fill="none">
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
              <span
                className="text-sm font-bold text-white/80"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Vidion
              </span>
              <span className="ml-2 text-[9px] font-medium uppercase tracking-[0.15em] text-white/15">
                Video Discovery
              </span>
            </div>
          </div>

          {/* Links */}
          <div className="flex gap-8 text-[11px] text-white/20">
            {["About", "Help", "Terms", "Privacy"].map((l) => (
              <Link
                key={l}
                href={`/${l.toLowerCase()}`}
                className="font-medium transition-colors hover:text-white/50"
              >
                {l}
              </Link>
            ))}
          </div>

          {/* Copyright */}
          <p className="text-[9px] font-medium text-white/10">
            © 2026 Vidion. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function HomePage() {
  return <HomeContent />;
}
