"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type SearchResult, type SearchFilters } from "@/lib/api";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { useSidebar } from "@/contexts/sidebar-context";
import { YTVideoCardSkeleton } from "@/components/video/YTVideoCard";
import { SearchResultCard } from "@/components/video/SearchResultCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search as SearchIcon, SlidersHorizontal, Filter,
  Clock, TrendingUp, Star, Calendar, Play, Users, ListVideo,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ─── Filter bar ────────────────────────────────────────────────────────────────

const TYPE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "video", label: "Videos", icon: Play },
  { value: "channel", label: "Channels", icon: Users },
  { value: "playlist", label: "Playlists", icon: ListVideo },
] as const;

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance", icon: SearchIcon },
  { value: "upload_date", label: "Upload date", icon: Calendar },
  { value: "view_count", label: "View count", icon: TrendingUp },
  { value: "rating", label: "Rating", icon: Star },
] as const;

const DATE_OPTIONS = [
  { value: "hour", label: "Last hour" },
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "year", label: "This year" },
] as const;

const DURATION_OPTIONS = [
  { value: "short", label: "Short (< 4 min)" },
  { value: "medium", label: "Medium (4–20 min)" },
  { value: "long", label: "Long (> 20 min)" },
] as const;

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-all whitespace-nowrap",
        active
          ? "bg-white text-black border-white"
          : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white"
      )}
    >
      {children}
    </button>
  );
}

// ─── Search result card for channels/playlists ─────────────────────────────────

function ChannelResultCard({ result }: { result: SearchResult }) {
  return (
    <Link href={`/channel/${result.id}`} className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4 hover:bg-white/[0.05] transition-colors">
      <div className="h-16 w-16 flex-shrink-0 rounded-full overflow-hidden bg-white/10">
        {result.thumbnail && <img src={result.thumbnail} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold truncate">{result.name}</p>
          {result.isVerified && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">✓</Badge>}
        </div>
        {result.subscriberCount && (
          <p className="text-sm text-muted-foreground mt-0.5">{result.subscriberCount} subscribers</p>
        )}
      </div>
    </Link>
  );
}

function PlaylistResultCard({ result }: { result: SearchResult }) {
  return (
    <Link href={`/watch/${result.id}`} className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4 hover:bg-white/[0.05] transition-colors">
      <div className="aspect-video w-40 flex-shrink-0 rounded-lg overflow-hidden bg-white/10 relative">
        {result.thumbnails?.[0] && <img src={result.thumbnails[0].url} alt="" className="h-full w-full object-cover" />}
        {result.videoCount && (
          <div className="absolute inset-y-0 right-0 w-12 bg-black/80 flex flex-col items-center justify-center">
            <ListVideo className="h-4 w-4 mb-1" />
            <span className="text-xs font-bold">{result.videoCount}</span>
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="font-semibold truncate">{result.title}</p>
        {result.channelName && <p className="text-sm text-muted-foreground mt-0.5">{result.channelName}</p>}
      </div>
    </Link>
  );
}

// ─── Main search results ───────────────────────────────────────────────────────

function SearchResults() {
  const { isCollapsed } = useSidebar();
  const sidebarPadding = isCollapsed ? "lg:pl-[72px]" : "lg:pl-[248px]";

  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") ?? "";

  const [type, setType] = useState<SearchFilters["type"]>((searchParams.get("type") as SearchFilters["type"]) ?? "all");
  const [sort, setSort] = useState<SearchFilters["sort"]>((searchParams.get("sort") as SearchFilters["sort"]) ?? "relevance");
  const [uploadDate, setUploadDate] = useState<SearchFilters["upload_date"] | undefined>((searchParams.get("upload_date") as SearchFilters["upload_date"]) ?? undefined);
  const [duration, setDuration] = useState<SearchFilters["duration"] | undefined>((searchParams.get("duration") as SearchFilters["duration"]) ?? undefined);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const nextType = (searchParams.get("type") as SearchFilters["type"]) ?? "all";
    const nextSort = (searchParams.get("sort") as SearchFilters["sort"]) ?? "relevance";
    const nextUploadDate = (searchParams.get("upload_date") as SearchFilters["upload_date"]) ?? undefined;
    const nextDuration = (searchParams.get("duration") as SearchFilters["duration"]) ?? undefined;

    if (nextType !== type) setType(nextType);
    if (nextSort !== sort) setSort(nextSort);
    if (nextUploadDate !== uploadDate) setUploadDate(nextUploadDate);
    if (nextDuration !== duration) setDuration(nextDuration);
  }, [searchParams, type, sort, uploadDate, duration]);

  const updateSearchFilters = (newFilters: Partial<SearchFilters>) => {
    if (!query) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("q", query);

    const merged = {
      type: newFilters.type ?? type,
      sort: newFilters.sort ?? sort,
      upload_date: newFilters.upload_date ?? uploadDate,
      duration: newFilters.duration ?? duration,
    };

    if (merged.type && merged.type !== "all") params.set("type", merged.type);
    else params.delete("type");

    if (merged.sort && merged.sort !== "relevance") params.set("sort", merged.sort);
    else params.delete("sort");

    if (merged.upload_date) params.set("upload_date", merged.upload_date);
    else params.delete("upload_date");

    if (merged.duration) params.set("duration", merged.duration);
    else params.delete("duration");

    const next = `/search?${params.toString()}`;
    if (next !== `${window.location.pathname}${window.location.search}`) {
      router.replace(next);
    }
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["search-v2", query, type, sort, uploadDate, duration],
    queryFn: () => api.searchV2(query, { type, sort, upload_date: uploadDate, duration }),
    enabled: query.length > 0,
    staleTime: 2 * 60 * 1000,
  });

  const results = data?.results ?? [];
  const estimated = data?.estimatedResults;

  // Convert SearchResult to VideoCardData shape for YTVideoCard
  const videoResults = results.filter((r) => r.type === "video");
  const channelResults = results.filter((r) => r.type === "channel");
  const playlistResults = results.filter((r) => r.type === "playlist");

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Sidebar />
      <Navbar />
      <main className={cn("container mx-auto px-4 py-8 max-w-6xl", sidebarPadding)}>
        {query ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-3">
                  <SearchIcon className="h-6 w-6 text-primary" />
                  &ldquo;{query}&rdquo;
                </h1>
                {estimated && (
                  <p className="text-sm text-muted-foreground mt-1">
                    About {estimated.toLocaleString()} results
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {(type !== "all" || sort !== "relevance" || uploadDate || duration) && (
                  <Badge className="ml-1 h-4 w-4 rounded-full p-0 text-[10px] flex items-center justify-center">
                    {[type !== "all", sort !== "relevance", !!uploadDate, !!duration].filter(Boolean).length}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="mb-6 space-y-3 rounded-xl border border-white/8 bg-white/[0.02] p-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Type</p>
                  <div className="flex flex-wrap gap-2">
                    {TYPE_OPTIONS.map((o) => (
                      <FilterChip key={o.value} active={type === o.value} onClick={() => updateSearchFilters({ type: o.value as SearchFilters["type"] })}>
                        {o.label}
                      </FilterChip>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Sort by</p>
                  <div className="flex flex-wrap gap-2">
                    {SORT_OPTIONS.map((o) => (
                      <FilterChip key={o.value} active={sort === o.value} onClick={() => updateSearchFilters({ sort: o.value as SearchFilters["sort"] })}>
                        {o.label}
                      </FilterChip>
                    ))}
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Upload date</p>
                    <div className="flex flex-wrap gap-2">
                      <FilterChip active={!uploadDate} onClick={() => updateSearchFilters({ upload_date: undefined })}>Any time</FilterChip>
                      {DATE_OPTIONS.map((o) => (
                        <FilterChip key={o.value} active={uploadDate === o.value} onClick={() => updateSearchFilters({ upload_date: o.value as SearchFilters["upload_date"] })}>
                          {o.label}
                        </FilterChip>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Duration</p>
                    <div className="flex flex-wrap gap-2">
                      <FilterChip active={!duration} onClick={() => updateSearchFilters({ duration: undefined })}>Any</FilterChip>
                      {DURATION_OPTIONS.map((o) => (
                        <FilterChip key={o.value} active={duration === o.value} onClick={() => updateSearchFilters({ duration: o.value as SearchFilters["duration"] })}>
                          {o.label}
                        </FilterChip>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isLoading && <YTVideoCardSkeleton count={12} />}

            {error && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-6 text-center">
                <p className="text-destructive">Search failed. Please try again.</p>
              </div>
            )}

            {!isLoading && results.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <SearchIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No results for &ldquo;{query}&rdquo;</p>
                <p className="text-sm mt-1">Try different keywords or remove filters</p>
              </div>
            )}

            {/* Channel results */}
            {channelResults.length > 0 && (
              <div className="mb-8 space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Users className="h-4 w-4" /> Channels
                </h2>
                {channelResults.map((r) => <ChannelResultCard key={r.id} result={r} />)}
              </div>
            )}

            {/* Playlist results */}
            {playlistResults.length > 0 && (
              <div className="mb-8 space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <ListVideo className="h-4 w-4" /> Playlists
                </h2>
                {playlistResults.map((r) => <PlaylistResultCard key={r.id} result={r} />)}
              </div>
            )}

            {/* Video results */}
            {videoResults.length > 0 && (
              <div>
                {(channelResults.length > 0 || playlistResults.length > 0) && (
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2 mb-4">
                    <Play className="h-4 w-4" /> Videos
                  </h2>
                )}
                <div className="space-y-4">
                  {videoResults.map((r) => (
                    <SearchResultCard
                      key={r.id}
                      video={{
                        id: r.id,
                        title: r.title ?? r.name ?? "",
                        thumbnails: r.thumbnails ?? (r.thumbnail ? [{ url: r.thumbnail, width: 0, height: 0 }] : []),
                        duration: r.duration ?? "",
                        viewCount: r.viewCount ?? "",
                        publishedAt: r.publishedAt ?? "",
                        channelName: r.channelName ?? "",
                        channelId: r.channelId ?? "",
                        channelThumbnail: null,
                        description: (r as any).description ?? "",
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <SearchIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Search for videos, channels, playlists</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0f0f0f]"><div className="container mx-auto px-4 py-8"><YTVideoCardSkeleton count={12} /></div></div>}>
      <SearchResults />
    </Suspense>
  );
}
