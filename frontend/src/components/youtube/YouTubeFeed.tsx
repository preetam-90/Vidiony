"use client";

import { useFeed } from "@/hooks/useYoutube";
import { YTVideoCard, YTVideoCardSkeleton } from "@/components/video/YTVideoCard";
import { TrendingUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function YouTubeFeed() {
  const { data: videos, isLoading, error, refetch, isFetching } = useFeed();

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          Trending Videos
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {isLoading && <YTVideoCardSkeleton count={12} />}

      {error && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-6 text-center">
          <p className="text-destructive text-sm">
            Failed to load feed. Make sure the backend is running on port 4000.
          </p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {videos && videos.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {videos.map((video) => (
            <YTVideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </section>
  );
}
