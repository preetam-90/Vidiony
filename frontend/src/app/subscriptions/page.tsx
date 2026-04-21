"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { YTVideoCard, YTVideoCardSkeleton } from "@/components/video/YTVideoCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/auth-context";
import { useSidebar } from "@/contexts/sidebar-context";
import { api, type YTSubscription } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  BookMarked,
  Rss,
  Users,
  LogIn,
  Youtube,
  UserCheck,
  Bell,
  BellRing,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

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
        <Button asChild>
          <Link href="/auth/login">
            <LogIn className="mr-2 h-4 w-4" /> Sign In
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/auth/register">Create Account</Link>
        </Button>
      </div>
    </div>
  );
}

function NotConnected() {
  const handleConnect = async () => {
    window.location.href = "/auth/login?error=YOUTUBE_PERMISSIONS_REQUIRED";
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

type SubscriptionTileProps = {
  sub: YTSubscription;
  subscribed: boolean;
  isPending: boolean;
  onToggle: (sub: YTSubscription) => Promise<void>;
};

function SubscriptionTile({ sub, subscribed, isPending, onToggle }: SubscriptionTileProps) {
  return (
    <div className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-all hover:border-white/20 hover:bg-white/[0.06] hover:shadow-lg hover:shadow-black/30">
      <div className="flex items-start justify-between gap-3">
        <Link href={`/channel/${sub.channelId}`} className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-14 w-14 rounded-full overflow-hidden bg-white/10 ring-2 ring-white/10">
                {sub.thumbnail ? (
                  <img src={sub.thumbnail} alt={sub.channelName} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-lg font-bold text-muted-foreground">
                    {sub.channelName?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              {sub.hasNewVideos && (
                <div
                  className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-blue-500 border-2 border-[#0f0f0f]"
                  title="New videos"
                />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white group-hover:text-violet-300 transition-colors">
                {sub.channelName}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{sub.subscriberCount || "YouTube channel"}</p>
              <p className="text-[11px] text-muted-foreground/80 mt-0.5">{sub.videoCount || "0 videos"}</p>
            </div>
          </div>
        </Link>

        <Button
          size="sm"
          variant={subscribed ? "secondary" : "default"}
          disabled={isPending}
          onClick={() => void onToggle(sub)}
          className={cn(
            "rounded-full min-w-[112px]",
            subscribed
              ? "bg-white/10 text-white hover:bg-white/20"
              : "bg-white text-black hover:bg-white/90",
          )}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : subscribed ? (
            <>
              <BellRing className="mr-1.5 h-4 w-4" /> Subscribed
            </>
          ) : (
            <>
              <Bell className="mr-1.5 h-4 w-4" /> Subscribe
            </>
          )}
        </Button>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1">
          {sub.hasNewVideos ? "New uploads available" : "No recent uploads"}
        </span>
        <Link
          href={`/channel/${sub.channelId}`}
          className="inline-flex items-center gap-1 text-violet-300 hover:text-violet-200"
        >
          Open channel <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default function SubscriptionsPage() {
  const { isAuthenticated, user, isLoading: authLoading, refreshUser } = useAuth();
  const { isCollapsed } = useSidebar();
  const queryClient = useQueryClient();
  const router = useRouter();

  const sidebarPadding = isCollapsed ? "lg:pl-[72px]" : "lg:pl-[248px]";

  const [subscriptionOverrides, setSubscriptionOverrides] = useState<Record<string, boolean>>({});

  const { data: subscriptionsData, isLoading: subsLoading } = useQuery({
    queryKey: ["yt-subscriptions"],
    queryFn: () => api.user.getYouTubeSubscriptions(),
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000,
  });

  const { data: feedData, isLoading: feedLoading } = useQuery({
    queryKey: ["yt-feed"],
    queryFn: () => api.user.getYouTubeFeed(),
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000,
  });

  const subs = subscriptionsData?.subscriptions ?? [];
  const feedVideos = feedData?.videos ?? [];

  const getLatestAuthUser = async () => {
    try {
      const { user: latestUser } = await api.auth.me();
      return latestUser;
    } catch {
      try {
        const refreshed = await api.auth.refresh();
        if (!refreshed) return null;
        const { user: latestUser } = await api.auth.me();
        return latestUser;
      } catch {
        return null;
      }
    }
  };

  const ensureSubscribeReady = async () => {
    if (authLoading) {
      await refreshUser();
    }

    const currentUser = !authLoading && isAuthenticated && user ? user : await getLatestAuthUser();

    if (!currentUser) {
      toast.info("Sign in to subscribe");
      router.push("/auth/login");
      return false;
    }

    if (!currentUser.youtubeChannelId) {
      toast.info("Connect YouTube to subscribe");
      window.location.href = "/auth/login?error=YOUTUBE_PERMISSIONS_REQUIRED";
      return false;
    }

    return true;
  };

  const subscriptionMutation = useMutation({
    mutationFn: async ({ channelId, subscribed }: { channelId: string; subscribed: boolean }) => {
      if (subscribed) {
        return api.user.unsubscribe(channelId);
      }
      return api.user.subscribe(channelId);
    },
    onMutate: ({ channelId, subscribed }) => {
      const previous = subscriptionOverrides[channelId] ?? subscribed;
      const next = !subscribed;
      setSubscriptionOverrides((prev) => ({ ...prev, [channelId]: next }));
      return { previous, channelId };
    },
    onSuccess: async (_data, vars) => {
      toast.success(vars.subscribed ? "Unsubscribed" : "Subscribed");
      await queryClient.invalidateQueries({ queryKey: ["yt-subscriptions"] });
      await queryClient.invalidateQueries({ queryKey: ["yt-feed"] });
      setSubscriptionOverrides((prev) => {
        const next = { ...prev };
        delete next[vars.channelId];
        return next;
      });
    },
    onError: (error, vars, context) => {
      if (context?.channelId) {
        setSubscriptionOverrides((prev) => ({ ...prev, [context.channelId]: context.previous }));
      }
      if (
        error instanceof Error
        && (
          error.message.toLowerCase().includes("connect youtube")
          || error.message.toLowerCase().includes("youtube account is required")
        )
      ) {
        window.location.href = "/auth/login?error=YOUTUBE_PERMISSIONS_REQUIRED";
        return;
      }
      toast.error(error instanceof Error ? error.message : `Failed to ${vars.subscribed ? "unsubscribe" : "subscribe"}`);
    },
  });

  const handleToggleSubscription = async (sub: YTSubscription) => {
    const subscribed = subscriptionOverrides[sub.channelId] ?? true;
    const ready = await ensureSubscribeReady();
    if (!ready) return;
    subscriptionMutation.mutate({ channelId: sub.channelId, subscribed });
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Sidebar />
      <Navbar />

      <main className={cn("mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8", sidebarPadding)}>
        <section className="mb-6 rounded-3xl border border-white/10 bg-gradient-to-br from-violet-600/20 via-violet-500/5 to-transparent p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/20 text-violet-300">
                <BookMarked className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Subscriptions</h1>
                <p className="text-sm text-muted-foreground mt-1">Catch up with channels you follow</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-white/90">
                {subs.length} channels
              </span>
              <span className="rounded-full bg-violet-500/20 px-3 py-1.5 text-violet-200">
                {feedVideos.length} videos
              </span>
            </div>
          </div>
        </section>

        {authLoading ? (
          <div className="py-24 flex justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          </div>
        ) : !isAuthenticated ? (
          <NotAuthed />
        ) : !user?.youtubeChannelId ? (
          <NotConnected />
        ) : (
          <Tabs defaultValue="feed" className="space-y-6">
            <TabsList className="h-auto rounded-2xl border border-white/10 bg-white/5 p-1">
              <TabsTrigger value="feed" className="rounded-xl px-4 py-2.5 data-[state=active]:bg-white/10 data-[state=active]:text-white">
                <Rss className="mr-2 h-4 w-4" /> Feed
                {feedVideos.length > 0 && (
                  <span className="ml-2 rounded-full bg-violet-600/30 px-2 py-0.5 text-[11px] text-violet-200">
                    {feedVideos.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="channels" className="rounded-xl px-4 py-2.5 data-[state=active]:bg-white/10 data-[state=active]:text-white">
                <Users className="mr-2 h-4 w-4" /> Channels
                {subs.length > 0 && (
                  <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/90">
                    {subs.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="feed" className="mt-0">
              {feedLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  <YTVideoCardSkeleton count={8} />
                </div>
              ) : feedVideos.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {feedVideos.map((video) => (
                    <YTVideoCard key={video.id} video={video} />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] py-20 text-center text-muted-foreground">
                  <Rss className="mx-auto mb-4 h-12 w-12 opacity-30" />
                  <p className="text-base font-medium text-white/90">No recent videos from your subscriptions</p>
                  <p className="mt-2 text-sm">Try subscribing to more channels to populate your feed.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="channels" className="mt-0">
              {subsLoading ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 9 }).map((_, idx) => (
                    <div key={idx} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-start gap-3">
                        <Skeleton className="h-14 w-14 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-3 w-28" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                        <Skeleton className="h-8 w-24 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : subs.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {subs.map((sub) => {
                    const subscribed = subscriptionOverrides[sub.channelId] ?? true;
                    const isPending = subscriptionMutation.isPending && subscriptionMutation.variables?.channelId === sub.channelId;

                    return (
                      <SubscriptionTile
                        key={sub.channelId}
                        sub={sub}
                        subscribed={subscribed}
                        isPending={isPending}
                        onToggle={handleToggleSubscription}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] py-20 text-center text-muted-foreground">
                  <UserCheck className="mx-auto mb-4 h-12 w-12 opacity-30" />
                  <p className="text-base font-medium text-white/90">You haven&apos;t subscribed to any channels yet</p>
                  <p className="mt-2 text-sm">Your subscribed channels will appear here once synced from YouTube.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
