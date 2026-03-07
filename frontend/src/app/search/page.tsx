"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useSearch } from "@/hooks/useYoutube";
import { Navbar } from "@/components/layout/navbar";
import { YTVideoCard, YTVideoCardSkeleton } from "@/components/video/YTVideoCard";
import { Search as SearchIcon } from "lucide-react";

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const { data: videos, isLoading, error } = useSearch(query);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        {query ? (
          <>
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <SearchIcon className="h-6 w-6 text-primary" />
              Results for &ldquo;{query}&rdquo;
            </h1>

            {isLoading && <YTVideoCardSkeleton count={12} />}

            {error && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-6 text-center">
                <p className="text-destructive">Search failed. Please try again.</p>
              </div>
            )}

            {videos && videos.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <SearchIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No results found for &ldquo;{query}&rdquo;</p>
                <p className="text-sm mt-1">Try different keywords</p>
              </div>
            )}

            {videos && videos.length > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {videos.map((video) => (
                  <YTVideoCard key={video.id} video={video} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <SearchIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Enter a search query to find videos</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<YTVideoCardSkeleton count={12} />}>
      <SearchResults />
    </Suspense>
  );
}
