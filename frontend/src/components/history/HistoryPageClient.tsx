"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { useSidebar } from "@/contexts/sidebar-context";
import { api, type WatchHistoryItem } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { HistorySearchBar } from "./HistorySearchBar";
import { ContinueWatchingRow } from "./ContinueWatchingRow";
import { HistoryGridSection } from "./HistoryGridSection";
import { HistoryPageSkeleton } from "./HistoryPageSkeleton";

export default function HistoryPageClient() {
  const { isAuthenticated } = useAuth();
  const { isCollapsed } = useSidebar();
  const sidebarPadding = isCollapsed ? "lg:pl-[72px]" : "lg:pl-[248px]";
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["vidion-history"],
    queryFn: () => api.user.getHistory(),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => api.user.removeFromHistory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vidion-history"] });
      toast.success("Removed from history");
    },
    onError: () => toast.error("Failed to remove from history"),
  });

  const clearMutation = useMutation({
    mutationFn: () => api.user.clearHistory(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vidion-history"] });
      toast.success("Cleared history");
    },
    onError: () => toast.error("Failed to clear history"),
  });

  // Process data
  const items: WatchHistoryItem[] = (data?.items ?? []).map((i: any) => ({
    id: i.id,
    videoId: i.videoId,
    title: i.title,
    thumbnail: i.thumbnail,
    channelName: i.channelName,
    duration: i.duration,
    progress: i.progress ?? 0,
    watchedAt: typeof i.watchedAt === "string" ? Date.parse(i.watchedAt) : i.watchedAt,
  }));

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Filtered items based on search
  const filteredItems = items.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.channelName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Continue watching items (< 90% watched)
  const continueItems = filteredItems
    .filter((it) => (it.duration ?? 0) > 0 ? it.progress < Math.floor((it.duration ?? 0) * 0.9) : false)
    .slice(0, 8);

  // Date grouping function
  function getDateLabel(timestamp: number): "Today" | "Yesterday" | "This Week" | "Older" {
    const date = new Date(timestamp);
    const now = new Date();
    
    // Clear time for date comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const thisWeekStart = new Date(today.getTime() - 7 * 86400000);
    
    if (date >= today) return "Today";
    if (date >= yesterday) return "Yesterday";
    if (date >= thisWeekStart) return "This Week";
    return "Older";
  }

  // Group items by date (only when not searching)
  const groupedItems =
    searchQuery === ""
      ? items.reduce<
          Record<
            "Today" | "Yesterday" | "This Week" | "Older",
            WatchHistoryItem[]
          >
        >(
          (acc, item) => {
            const label = getDateLabel(item.watchedAt);
            if (!acc[label]) acc[label] = [];
            acc[label].push(item);
            return acc;
          },
          { Today: [], Yesterday: [], "This Week": [], Older: [] }
        )
      : {};

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#09090b]">
        <div className="max-w-3xl mx-auto px-4 py-24 text-center">
          <div className="bg-muted/50 p-6 rounded-full mb-6 inline-block">
            <History className="h-12 w-12 text-muted-foreground/60" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight mb-3">Keep track of what you watch</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-[600px] mx-auto">
            Watch history isn't viewable when you're signed out. Sign in to see your recently watched videos on Vidion.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/auth/login" className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90">
              Sign In
            </Link>
            <Link href="/" className="inline-flex h-11 items-center justify-center rounded-full bg-white/5 px-6 text-sm">
              Explore
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b]">
      <main className={cn("container mx-auto px-4 py-8 max-w-[1920px]", sidebarPadding)}>
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border/40 pb-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <History className="h-8 w-8 text-primary" />
              Watch History
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Pick up where you left off. Your Vidion watch history.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <HistorySearchBar onSearch={setSearchQuery} />
            {items.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearMutation.mutate()}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" /> Clear all
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <HistoryPageSkeleton />
        ) : items.length === 0 ? (
          <div className="py-24 text-center">
            <div className="bg-muted/30 p-8 rounded-full mb-6 inline-block">
              <History className="h-16 w-16 text-muted-foreground/40" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">No videos here</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Videos you watch will appear here so you can easily find them later.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Continue Watching */}
            {continueItems.length > 0 && (
              <ContinueWatchingRow items={continueItems} />
            )}

            {/* Search results or grouped history */}
            {searchQuery.length > 0 ? (
              <>
                <h2 className="text-2xl font-semibold mb-3">
                  {filteredItems.length} results for "{searchQuery}"
                </h2>
                {filteredItems.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No results found for "{searchQuery}"</p>
                    <Button
                      variant="outline"
                      onClick={() => setSearchQuery("")}
                      className="mt-4"
                    >
                      Clear search
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredItems.map((item) => (
                      <HistoryVideoCard
                        key={item.id}
                        item={item}
                        onRemove={(videoId) => removeMutation.mutate(videoId)}
                        isInHistory={true}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Today section */}
                <HistoryGridSection
                  title="Today"
                  accentColor="from-violet-500 to-indigo-500"
                  items={groupedItems.Today ?? []}
                  onRemove={(videoId) => removeMutation.mutate(videoId)}
                />

                {/* Yesterday section */}
                <HistoryGridSection
                  title="Yesterday"
                  accentColor="from-blue-500 to-cyan-500"
                  items={groupedItems.Yesterday ?? []}
                  onRemove={(videoId) => removeMutation.mutate(videoId)}
                />

                {/* This Week section */}
                <HistoryGridSection
                  title="This Week"
                  accentColor="from-emerald-500 to-teal-500"
                  items={groupedItems["This Week"] ?? []}
                  onRemove={(videoId) => removeMutation.mutate(videoId)}
                />

                {/* Older section */}
                <HistoryGridSection
                  title="Older"
                  accentColor="from-amber-500 to-orange-500"
                  items={groupedItems.Older ?? []}
                  onRemove={(videoId) => removeMutation.mutate(videoId)}
                />
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}