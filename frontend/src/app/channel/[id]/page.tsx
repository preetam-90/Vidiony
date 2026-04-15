"use client";

import { useParams } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useChannel } from "@/hooks/useYoutube";
import { api, type ChannelVideoItem } from "@/lib/api";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { useSidebar } from "@/contexts/sidebar-context";
import { cn } from "@/lib/utils";
import { ChannelHero } from "@/components/channel/ChannelHero";
import { ChannelNavTabs, getVisibleChannelTabs, type ChannelTab } from "@/components/channel/ChannelNavTabs";
import { ChannelVideoCard, ChannelVideoCardSkeleton } from "@/components/channel/ChannelVideoCard";
import { ChannelShortsCard } from "@/components/channel/ShortsCard";
import { ChannelPlaylistCard } from "@/components/channel/PlaylistCard";
import { ChannelPostCard } from "@/components/channel/ChannelPostCard";
import { ChannelAbout } from "@/components/channel/ChannelAbout";
import { ChannelPageSkeleton } from "@/components/channel/ChannelPageSkeleton";
import { Play, ListVideo, Film, MessageSquare, Podcast } from "lucide-react";

/** Horizontal scroll section for YouTube-style "For you" rows */
function HorizontalScrollSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      <div className="flex overflow-x-auto gap-3 pb-2" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {children}
      </div>
    </div>
  );
}

export default function ChannelPage() {
  const { isCollapsed } = useSidebar();
  const sidebarPadding = isCollapsed ? "lg:pl-[72px]" : "lg:pl-[248px]";

  const params = useParams();
  const channelId = params.id as string;
  const { data: channel, isLoading, error } = useChannel(channelId);
  const [activeTab, setActiveTab] = useState<ChannelTab>("home");
  const [searchQuery, setSearchQuery] = useState("");
  const visibleTabs = useMemo(() => getVisibleChannelTabs(channel?.tabs), [channel?.tabs]);

  const paginationTabs: ChannelTab[] = ["home", "videos", "shorts", "live", "playlists", "podcasts", "posts"];
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
      const tabToFetch = activeTab === "home" ? "videos" : activeTab;
      return api.getChannelVideos(
        channelId,
        tabToFetch as "videos" | "shorts" | "live" | "playlists" | "podcasts" | "posts",
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

  useEffect(() => {
    if (visibleTabs.length === 0) return;
    if (!visibleTabs.includes(activeTab)) {
      setActiveTab(visibleTabs[0]);
    }
  }, [activeTab, visibleTabs]);

  const allVideos = data?.pages.flatMap((page) => page.items) || [];

  // Filter videos based on search query
  const filteredVideos = useMemo(() => {
    if (!searchQuery.trim()) return allVideos;
    const query = searchQuery.toLowerCase();
    return allVideos.filter((v) => {
      const title = v.title?.toLowerCase() || "";
      const description = v.description?.toLowerCase() || "";
      return title.includes(query) || description.includes(query);
    });
  }, [allVideos, searchQuery]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f]">
        <Sidebar />
        <Navbar />
        <main className={cn("mx-auto max-w-[1280px] px-4 py-6", sidebarPadding)}>
          <ChannelPageSkeleton />
        </main>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#0f0f0f]">
        <Sidebar />
        <Navbar />
        <main className={cn("mx-auto max-w-[1280px] px-4 py-6", sidebarPadding)}>
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="rounded-xl bg-white/5 border border-white/10 p-8 max-w-md">
              <p className="text-lg font-semibold text-white">Unable to load channel</p>
              <p className="text-sm text-[#aaa] mt-2">This channel may not exist or is unavailable.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!channel) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Sidebar />
      <Navbar />

      <main className={cn("mx-auto max-w-[1280px] px-4 py-6", sidebarPadding)}>
        {/* ── Channel header (banner + info) ─────────────────── */}
        <ChannelHero channel={channel} channelId={channelId} />

         {/* ── Tab navigation ──────────────────────────────────── */}
         <ChannelNavTabs activeTab={activeTab} onTabChange={setActiveTab} availableTabs={channel.tabs} onSearch={setSearchQuery} />

        {/* ── Tab content ─────────────────────────────────────── */}
        <div className="mt-6">

           {/* ═══ HOME TAB ═══ */}
           {activeTab === "home" && (
             <div>
               {videosLoading ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                   <ChannelVideoCardSkeleton count={8} />
                 </div>
               ) : filteredVideos.length > 0 ? (
                 <>
                   {/* Featured section — YouTube style: horizontal row */}
                   <HorizontalScrollSection title="Featured">
                     {filteredVideos.slice(0, 6).map((v) => (
                       <div key={v.id} className="flex-shrink-0 w-[280px] sm:w-[320px]">
                         <ChannelVideoCard item={v} />
                       </div>
                     ))}
                   </HorizontalScrollSection>

                   {/* Latest uploads — grid */}
                   <div className="mb-8">
                     <h2 className="text-lg font-semibold mb-4">Latest uploads</h2>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                       {filteredVideos.slice(0, 8).map((v) => (
                         <ChannelVideoCard key={v.id} item={v} />
                       ))}
                     </div>
                   </div>

                   {/* More videos — horizontal scroll */}
                   <HorizontalScrollSection title="More videos">
                     {filteredVideos.slice(4, 14).map((v) => (
                       <div key={`more-${v.id}`} className="flex-shrink-0 w-[260px] sm:w-[300px]">
                         <ChannelVideoCard item={v} />
                       </div>
                     ))}
                   </HorizontalScrollSection>

                   {/* Infinite scroll trigger */}
                   {isFetchingNextPage && (
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                       <ChannelVideoCardSkeleton count={4} />
                     </div>
                   )}
                   <div ref={ref} className="w-full py-2 min-h-[60px]" />
                 </>
               ) : (
                 <EmptyState icon={<Play className="h-12 w-12" />} message={searchQuery ? "No videos match your search" : "No videos yet"} />
               )}
             </div>
           )}

           {/* ═══ VIDEOS TAB ═══ */}
           {activeTab === "videos" && (
             <div>
               {videosLoading ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                   <ChannelVideoCardSkeleton count={8} />
                 </div>
               ) : filteredVideos.length > 0 ? (
                 <>
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                     {filteredVideos.map((v) => (
                       <ChannelVideoCard key={v.id} item={v} />
                     ))}
                   </div>

                   {isFetchingNextPage && (
                     <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                       <ChannelVideoCardSkeleton count={4} />
                     </div>
                   )}

                   <div ref={ref} className="w-full py-2 min-h-[60px]" />
                 </>
               ) : (
                 <EmptyState icon={<Play className="h-12 w-12" />} message={searchQuery ? "No videos match your search" : "No videos found"} />
               )}
             </div>
           )}

           {/* ═══ SHORTS TAB ═══ */}
           {activeTab === "shorts" && (
             <div>
               {videosLoading ? (
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                   {Array.from({ length: 12 }).map((_, i) => (
                     <div key={i} className="space-y-2">
                       <div className="aspect-[9/16] rounded-xl bg-[#1a1a1a] animate-pulse" />
                       <div className="h-4 w-[80%] rounded bg-[#1a1a1a] animate-pulse" />
                       <div className="h-3 w-[50%] rounded bg-[#1a1a1a] animate-pulse" />
                     </div>
                   ))}
                 </div>
               ) : filteredVideos.length > 0 ? (
                 <>
                   <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                     {filteredVideos.map((v) => (
                       <ChannelShortsCard key={v.id} item={v} />
                     ))}
                   </div>

                   {isFetchingNextPage && (
                     <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                       {Array.from({ length: 6 }).map((_, i) => (
                         <div key={i} className="space-y-2">
                           <div className="aspect-[9/16] rounded-xl bg-[#1a1a1a] animate-pulse" />
                           <div className="h-4 w-[80%] rounded bg-[#1a1a1a] animate-pulse" />
                           <div className="h-3 w-[50%] rounded bg-[#1a1a1a] animate-pulse" />
                         </div>
                       ))}
                     </div>
                   )}

                   <div ref={ref} className="w-full py-2 min-h-[60px]" />
                 </>
               ) : (
                 <EmptyState icon={<Film className="h-12 w-12" />} message={searchQuery ? "No shorts match your search" : "No shorts found"} />
               )}
             </div>
           )}

           {/* ═══ LIVE TAB ═══ */}
           {activeTab === "live" && (
             <div>
               {videosLoading ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                   <ChannelVideoCardSkeleton count={8} />
                 </div>
               ) : filteredVideos.length > 0 ? (
                 <>
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                     {filteredVideos.map((v) => (
                       <ChannelVideoCard key={v.id} item={v} />
                     ))}
                   </div>

                   {isFetchingNextPage && (
                     <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                       <ChannelVideoCardSkeleton count={4} />
                     </div>
                   )}

                   <div ref={ref} className="w-full py-2 min-h-[60px]" />
                 </>
               ) : (
                 <EmptyState icon={<Play className="h-12 w-12" />} message={searchQuery ? "No live streams match your search" : "No live streams found"} />
               )}
             </div>
           )}

           {/* ═══ PLAYLISTS TAB ═══ */}
           {activeTab === "playlists" && (
             <div>
               {videosLoading ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                   {Array.from({ length: 8 }).map((_, i) => (
                     <div key={i} className="space-y-2">
                       <div className="aspect-video rounded-xl bg-[#1a1a1a] animate-pulse" />
                       <div className="h-4 w-[80%] rounded bg-[#1a1a1a] animate-pulse" />
                       <div className="h-3 w-[50%] rounded bg-[#1a1a1a] animate-pulse" />
                     </div>
                   ))}
                 </div>
               ) : filteredVideos.length > 0 ? (
                 <>
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                     {filteredVideos.map((p) => (
                       <ChannelPlaylistCard key={p.id} item={p} />
                     ))}
                   </div>

                   {isFetchingNextPage && (
                     <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                       {Array.from({ length: 4 }).map((_, i) => (
                         <div key={i} className="space-y-2">
                           <div className="aspect-video rounded-xl bg-[#1a1a1a] animate-pulse" />
                           <div className="h-4 w-[80%] rounded bg-[#1a1a1a] animate-pulse" />
                           <div className="h-3 w-[50%] rounded bg-[#1a1a1a] animate-pulse" />
                         </div>
                       ))}
                     </div>
                   )}

                   <div ref={ref} className="w-full py-2 min-h-[60px]" />
                 </>
               ) : (
                 <EmptyState icon={<ListVideo className="h-12 w-12" />} message={searchQuery ? "No playlists match your search" : "No playlists found"} />
               )}
             </div>
           )}

           {activeTab === "podcasts" && (
             <div>
               {videosLoading ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                   {Array.from({ length: 8 }).map((_, i) => (
                     <div key={i} className="space-y-2">
                       <div className="aspect-video rounded-xl bg-[#1a1a1a] animate-pulse" />
                       <div className="h-4 w-[80%] rounded bg-[#1a1a1a] animate-pulse" />
                       <div className="h-3 w-[50%] rounded bg-[#1a1a1a] animate-pulse" />
                     </div>
                   ))}
                 </div>
               ) : filteredVideos.length > 0 ? (
                 <>
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                     {filteredVideos.map((podcast) => (
                       <ChannelPlaylistCard key={podcast.id} item={podcast} />
                     ))}
                   </div>

                   {isFetchingNextPage && (
                     <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                       {Array.from({ length: 4 }).map((_, i) => (
                         <div key={i} className="space-y-2">
                           <div className="aspect-video rounded-xl bg-[#1a1a1a] animate-pulse" />
                           <div className="h-4 w-[80%] rounded bg-[#1a1a1a] animate-pulse" />
                           <div className="h-3 w-[50%] rounded bg-[#1a1a1a] animate-pulse" />
                         </div>
                       ))}
                     </div>
                   )}

                   <div ref={ref} className="w-full py-2 min-h-[60px]" />
                 </>
               ) : (
                 <EmptyState icon={<Podcast className="h-12 w-12" />} message={searchQuery ? "No podcasts match your search" : "No podcasts found"} />
               )}
             </div>
           )}

           {/* ═══ POSTS TAB ═══ */}
           {activeTab === "posts" && (
             <div>
               {videosLoading ? (
                 <div className="space-y-4">
                   {Array.from({ length: 4 }).map((_, i) => (
                     <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                       <div className="flex gap-3">
                         <div className="h-10 w-10 rounded-full bg-[#1a1a1a] animate-pulse" />
                         <div className="flex-1 space-y-2">
                           <div className="h-4 w-32 rounded bg-[#1a1a1a] animate-pulse" />
                           <div className="h-4 w-full rounded bg-[#1a1a1a] animate-pulse" />
                           <div className="h-4 w-[85%] rounded bg-[#1a1a1a] animate-pulse" />
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               ) : filteredVideos.length > 0 ? (
                 <>
                   <div className="space-y-4">
                     {filteredVideos.map((post, index) => (
                       <ChannelPostCard
                         key={`${post.id}-${post.publishedAt ?? "na"}-${index}`}
                         item={post}
                       />
                     ))}
                   </div>

                   {isFetchingNextPage && (
                     <div className="mt-4 space-y-4">
                       {Array.from({ length: 2 }).map((_, i) => (
                         <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                           <div className="flex gap-3">
                             <div className="h-10 w-10 rounded-full bg-[#1a1a1a] animate-pulse" />
                             <div className="flex-1 space-y-2">
                               <div className="h-4 w-32 rounded bg-[#1a1a1a] animate-pulse" />
                               <div className="h-4 w-full rounded bg-[#1a1a1a] animate-pulse" />
                               <div className="h-4 w-[85%] rounded bg-[#1a1a1a] animate-pulse" />
                             </div>
                           </div>
                         </div>
                       ))}
                     </div>
                   )}

                   <div ref={ref} className="w-full py-2 min-h-[60px]" />
                 </>
               ) : (
                 <EmptyState icon={<MessageSquare className="h-12 w-12" />} message={searchQuery ? "No posts match your search" : "No posts yet"} />
               )}
             </div>
           )}

          {/* ═══ ABOUT TAB ═══ */}
          {activeTab === "about" && channel && (
            <ChannelAbout
              about={{
                description: channel.description,
                subscriberCount: channel.subscriberCount,
                videoCount: channel.videoCount,
                totalViewCount: "",
                joinedDate: null,
                links: channel.links ?? [],
                country: null,
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
}

/** Shared empty state component */
function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-[#aaa]">
      <div className="mb-4 opacity-30">{icon}</div>
      <p className="text-sm">{message}</p>
    </div>
  );
}
