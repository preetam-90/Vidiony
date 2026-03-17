"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useChannel } from "@/hooks/useYoutube";
import { api, type ChannelVideoItem } from "@/lib/api";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { useSidebar } from "@/contexts/sidebar-context";
import { cn } from "@/lib/utils";
import { ChannelHero } from "@/components/channel/ChannelHero";
import { ChannelNavTabs, type ChannelTab } from "@/components/channel/ChannelNavTabs";
import { YTVideoCardSkeleton } from "@/components/video/YTVideoCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Play, ListVideo } from "lucide-react";

const ChannelVideoCard = ({ item }: { item: ChannelVideoItem }) => (
  <Link href={`/watch/${item.id}`} className="group block">
    <div className="rounded-xl overflow-hidden bg-muted hover:bg-muted/80 transition-colors">
      <div className="relative aspect-video bg-[#1a1a1a]">
        <img
          src={item.thumbnail}
          alt={item.title}
          className="h-full w-full object-cover group-hover:brightness-75 transition-all"
        />
        {item.duration && (
          <div className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
            {item.duration}
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 font-semibold text-sm group-hover:text-white transition-colors">
          {item.title}
        </h3>
        {item.viewCount && (
          <p className="text-xs text-muted-foreground mt-1">{item.viewCount} views</p>
        )}
        {item.publishedAt && (
          <p className="text-xs text-muted-foreground">{item.publishedAt}</p>
        )}
      </div>
    </div>
  </Link>
);

const PlaylistCard = ({ item }: { item: ChannelVideoItem }) => (
  <div className="rounded-xl overflow-hidden bg-card p-4 hover:bg-card/90 transition-colors">
    <div className="relative aspect-video mb-3 bg-[#1a1a1a] rounded-md overflow-hidden">
      <img
        src={item.thumbnail}
        alt={item.title}
        className="h-full w-full object-cover"
      />
    </div>
    <h4 className="font-semibold line-clamp-2">{item.title}</h4>
    <p className="text-sm text-muted-foreground mt-1">
      {item.videoCount ?? 0} video{item.videoCount !== 1 ? "s" : ""}
    </p>
  </div>
);

export default function ChannelPage() {
  const { isCollapsed } = useSidebar();
  const sidebarPadding = isCollapsed ? "lg:pl-[72px]" : "lg:pl-[248px]";

  const params = useParams();
  const channelId = params.id as string;
  const { data: channel, isLoading, error } = useChannel(channelId);
  const [activeTab, setActiveTab] = useState<ChannelTab>("home");

  const paginationTabs = ["home", "videos", "shorts", "live", "playlists"];
  const shouldFetchVideos = paginationTabs.includes(activeTab);

  const {
    data,
    isLoading: videosLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ["channel-videos", channelId, activeTab],
    queryFn: ({ pageParam }) => {
      const tabToFetch = activeTab === "home" ? "videos" : (activeTab as "videos" | "shorts" | "live" | "playlists");
      return api.getChannelVideos(
        channelId,
        tabToFetch,
        pageParam as string | undefined
      );
    },
    getNextPageParam: (lastPage) => lastPage.continuation,
    initialPageParam: undefined as string | undefined,
    enabled: shouldFetchVideos,
  });

  const { ref, inView } = useInView({ threshold: 0, rootMargin: "600px" });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allVideos = data?.pages.flatMap((page) => page.items) || [];

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Sidebar />
      <Navbar />

      <main className={cn("mx-auto max-w-6xl px-4 py-6", sidebarPadding)}>
        <Button variant="ghost" className="mb-4 gap-2" onClick={() => window.history.back()}>
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>

        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-xl" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-6 text-center">
            <p className="text-destructive">Failed to load channel info.</p>
          </div>
        )}

        {channel && (
          <div className="space-y-6">
            <ChannelHero channel={channel} channelId={channelId} />

            <ChannelNavTabs activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Home Tab */}
            {activeTab === "home" && (
              <div className="space-y-6">
                {videosLoading ? (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-semibold mb-3">Featured</h2>
                      <Skeleton className="h-64 w-full rounded-xl" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Latest uploads</h3>
                      <YTVideoCardSkeleton count={6} />
                    </div>
                  </div>
                ) : allVideos.length > 0 ? (
                  <>
                    <div>
                      <h2 className="text-lg font-semibold mb-3">Featured</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <ChannelVideoCard item={allVideos[0]} />
                        <div className="grid grid-cols-1 gap-4">
                          {allVideos.slice(1, 4).map((v) => (
                            <ChannelVideoCard key={v.id} item={v} />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Latest uploads</h3>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {allVideos.map((v) => (
                          <ChannelVideoCard key={v.id} item={v} />
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-16 text-center text-muted-foreground">
                    <Play className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>No videos found for this channel</p>
                  </div>
                )}

                {isFetchingNextPage && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    <YTVideoCardSkeleton count={4} />
                  </div>
                )}

                <div key={`scroll-trigger-${activeTab}`} ref={ref} className="w-full py-2 min-h-[60px]" />
              </div>
            )}

            {/* Videos Tab */}
            {activeTab === "videos" && (
              <div>
                {videosLoading ? (
                  <YTVideoCardSkeleton count={8} />
                ) : allVideos.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {allVideos.map((v) => (
                        <ChannelVideoCard key={v.id} item={v} />
                      ))}
                    </div>

                    {isFetchingNextPage && (
                      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        <YTVideoCardSkeleton count={4} />
                      </div>
                    )}

                    <div key={`scroll-trigger-${activeTab}`} ref={ref} className="w-full py-2 min-h-[60px]" />
                  </>
                ) : (
                  <div className="py-16 text-center text-muted-foreground">
                    <Play className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>No videos for this channel</p>
                  </div>
                )}
              </div>
            )}

            {/* Shorts Tab */}
            {activeTab === "shorts" && (
              <div>
                {videosLoading ? (
                  <YTVideoCardSkeleton count={8} />
                ) : allVideos.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                      {allVideos.map((v) => (
                        <ChannelVideoCard key={v.id} item={v} />
                      ))}
                    </div>

                    {isFetchingNextPage && (
                      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                        <YTVideoCardSkeleton count={6} />
                      </div>
                    )}

                    <div key={`scroll-trigger-${activeTab}`} ref={ref} className="w-full py-2 min-h-[60px]" />
                  </>
                ) : (
                  <div className="py-16 text-center text-muted-foreground">
                    <Play className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>No shorts for this channel</p>
                  </div>
                )}
              </div>
            )}

            {/* Live Tab */}
            {activeTab === "live" && (
              <div>
                {videosLoading ? (
                  <YTVideoCardSkeleton count={8} />
                ) : allVideos.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {allVideos.map((v) => (
                        <ChannelVideoCard key={v.id} item={v} />
                      ))}
                    </div>

                    {isFetchingNextPage && (
                      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        <YTVideoCardSkeleton count={4} />
                      </div>
                    )}

                    <div key={`scroll-trigger-${activeTab}`} ref={ref} className="w-full py-2 min-h-[60px]" />
                  </>
                ) : (
                  <div className="py-16 text-center text-muted-foreground">
                    <Play className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>No live streams for this channel</p>
                  </div>
                )}
              </div>
            )}

            {/* Playlists Tab */}
            {activeTab === "playlists" && (
              <div>
                {videosLoading ? (
                  <YTVideoCardSkeleton count={6} />
                ) : allVideos.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {allVideos.map((p) => (
                        <PlaylistCard key={p.id} item={p} />
                      ))}
                    </div>

                    {isFetchingNextPage && (
                      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <YTVideoCardSkeleton count={3} />
                      </div>
                    )}

                    <div key={`scroll-trigger-${activeTab}`} ref={ref} className="w-full py-2 min-h-[60px]" />
                  </>
                ) : (
                  <div className="py-16 text-center text-muted-foreground">
                    <ListVideo className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>No playlists found</p>
                  </div>
                )}
              </div>
            )}

            {/* Posts Tab */}
            {activeTab === "posts" && (
              <div className="py-16 text-center text-muted-foreground">
                <Play className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No posts yet</p>
              </div>
            )}

            {/* About Tab */}
            {activeTab === "about" && (
              <div className="space-y-4">
                <div className="rounded-xl bg-card p-6">
                  <h3 className="text-lg font-semibold">About</h3>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {channel.description || "No description provided."}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl bg-card p-6">
                    <h4 className="font-semibold">Subscribers</h4>
                    <p className="text-sm text-muted-foreground mt-2">
                      {channel.subscriberCount || "—"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-card p-6">
                    <h4 className="font-semibold">Total videos</h4>
                    <p className="text-sm text-muted-foreground mt-2">
                      {channel.videoCount || "—"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
