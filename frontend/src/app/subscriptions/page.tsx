"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { api, type YTSubscription } from "@/lib/api";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { useSidebar } from "@/contexts/sidebar-context";
import { cn } from "@/lib/utils";
import { YTVideoCard, YTVideoCardSkeleton } from "@/components/video/YTVideoCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookMarked, Rss, Users, LogIn, Youtube, UserCheck } from "lucide-react";
import Link from "next/link";

function SubscriptionChannelCard({ sub }: { sub: YTSubscription }) {
  return (
    <Link href={`/channel/${sub.channelId}`} className="flex flex-col items-center gap-2 rounded-xl p-3 hover:bg-white/[0.04] transition-colors text-center relative">
      <div className="relative">
        <div className="h-16 w-16 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
          {sub.thumbnail ? (
            <img src={sub.thumbnail} alt={sub.channelName} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-xl font-bold text-muted-foreground">
              {sub.channelName?.[0]?.toUpperCase()}
            </div>
          )}
        </div>
        {sub.hasNewVideos && (
          <div className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-blue-500 border-2 border-[#0f0f0f]" title="New videos" />
        )}
      </div>
      <div>
        <p className="text-xs font-medium line-clamp-2 leading-tight">{sub.channelName}</p>
        {sub.subscriberCount && (
          <p className="text-[10px] text-muted-foreground mt-0.5">{sub.subscriberCount}</p>
        )}
      </div>
    </Link>
  );
}

function NotAuthed() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      <div className="h-20 w-20 rounded-full bg-violet-600/10 flex items-center justify-center">
        <BookMarked className="h-10 w-10 text-violet-400" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold">Sign in to view subscriptions</h2>
        <p className="text-muted-foreground mt-2 max-w-md">
          Create a Vidion account and connect your YouTube to see your subscribed channels and their latest videos.
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild><Link href="/auth/login"><LogIn className="mr-2 h-4 w-4" /> Sign In</Link></Button>
        <Button variant="outline" asChild><Link href="/auth/register">Create Account</Link></Button>
      </div>
    </div>
  );
}

function NotConnected() {
  const handleConnect = async () => {
    try {
      const { url } = await api.auth.youtubeConnectUrl();
      window.location.href = url;
    } catch {}
  };

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      <div className="h-20 w-20 rounded-full bg-red-600/10 flex items-center justify-center">
        <Youtube className="h-10 w-10 text-red-500" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold">Connect YouTube to see subscriptions</h2>
        <p className="text-muted-foreground mt-2 max-w-md">
          Link your YouTube account to sync your subscriptions and get a personalized feed.
        </p>
      </div>
      <Button onClick={handleConnect} className="gap-2">
        <Youtube className="h-4 w-4" /> Connect YouTube Account
      </Button>
    </div>
  );
}

export default function SubscriptionsPage() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const { isCollapsed } = useSidebar();
  const sidebarPadding = isCollapsed ? "lg:pl-[72px]" : "lg:pl-[248px]";

  const { data: subscriptionsData, isLoading: subsLoading } = useQuery({
    queryKey: ["yt-subscriptions"],
    queryFn: () => api.user.getYouTubeSubscriptions(),
    enabled: isAuthenticated && !!user?.youtubeConnected,
    staleTime: 2 * 60 * 1000,
  });

  const { data: feedData, isLoading: feedLoading } = useQuery({
    queryKey: ["yt-feed"],
    queryFn: () => api.user.getYouTubeFeed(),
    enabled: isAuthenticated && !!user?.youtubeConnected,
    staleTime: 2 * 60 * 1000,
  });

  const subs = subscriptionsData?.subscriptions ?? [];
  const feedVideos = feedData?.videos ?? [];

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Sidebar />
      <Navbar />
      <main className={cn("container mx-auto px-4 py-8 max-w-6xl", sidebarPadding)}>
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/20 text-violet-400">
            <BookMarked className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Subscriptions</h1>
            <p className="text-sm text-muted-foreground">Latest from channels you follow</p>
          </div>
        </div>

        {authLoading ? (
          <div className="py-24 flex justify-center"><div className="h-8 w-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" /></div>
        ) : !isAuthenticated ? (
          <NotAuthed />
        ) : !user?.youtubeConnected ? (
          <NotConnected />
        ) : (
          <Tabs defaultValue="feed">
            <TabsList className="bg-white/5 border border-white/10 mb-6">
              <TabsTrigger value="feed" className="gap-2 data-[state=active]:bg-white/10">
                <Rss className="h-4 w-4" /> Feed
                {feedVideos.length > 0 && <span className="ml-1 text-xs bg-violet-600/30 text-violet-300 rounded-full px-1.5">{feedVideos.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="channels" className="gap-2 data-[state=active]:bg-white/10">
                <Users className="h-4 w-4" /> Channels
                {subs.length > 0 && <span className="ml-1 text-xs bg-white/10 rounded-full px-1.5">{subs.length}</span>}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="feed">
              {feedLoading ? (
                <YTVideoCardSkeleton count={8} />
              ) : feedVideos.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {feedVideos.map((v) => <YTVideoCard key={v.id} video={v} />)}
                </div>
              ) : (
                <div className="py-16 text-center text-muted-foreground">
                  <Rss className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No recent videos from your subscriptions</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="channels">
              {subsLoading ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 p-3">
                      <Skeleton className="h-16 w-16 rounded-full" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  ))}
                </div>
              ) : subs.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {subs.map((s) => <SubscriptionChannelCard key={s.channelId} sub={s} />)}
                </div>
              ) : (
                <div className="py-16 text-center text-muted-foreground">
                  <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>You haven&apos;t subscribed to any channels yet</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
