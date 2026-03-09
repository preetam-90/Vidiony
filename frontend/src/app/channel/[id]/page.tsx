"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useChannel } from "@/hooks/useYoutube";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import { Navbar } from "@/components/layout/navbar";
import { YTVideoCard, YTVideoCardSkeleton } from "@/components/video/YTVideoCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Video, ChevronLeft, Bell, BellOff, Loader2, Play, Zap, Radio, ListVideo } from "lucide-react";
import { toast } from "sonner";

const TABS = [
  { value: "videos", label: "Videos", icon: Play },
  { value: "shorts", label: "Shorts", icon: Zap },
  { value: "live", label: "Live", icon: Radio },
  { value: "playlists", label: "Playlists", icon: ListVideo },
] as const;

export default function ChannelPage() {
  const params = useParams();
  const channelId = params.id as string;
  const { data: channel, isLoading, error } = useChannel(channelId);
  const { isAuthenticated } = useAuth();
  const [subscribed, setSubscribed] = useState(false);
  const [activeTab, setActiveTab] = useState<"videos" | "shorts" | "live" | "playlists">("videos");

  const { data: videosData, isLoading: videosLoading } = useQuery({
    queryKey: ["channel-videos", channelId, activeTab],
    queryFn: () => api.getChannelVideos(channelId, activeTab),
    staleTime: 5 * 60 * 1000,
  });

  const subscribeMutation = useMutation({
    mutationFn: () => subscribed ? api.user.unsubscribe(channelId) : api.user.subscribe(channelId),
    onMutate: () => setSubscribed(!subscribed),
    onSuccess: () => toast.success(subscribed ? "Unsubscribed" : "Subscribed!"),
    onError: () => {
      setSubscribed(subscribed);
      toast.error("Connect your YouTube account to subscribe");
    },
  });

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Navbar />
      <main className="container mx-auto px-4 py-6 max-w-6xl">
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
            {/* Banner */}
            {channel.banners.length > 0 && (
              <div className="relative h-40 sm:h-56 rounded-xl overflow-hidden bg-muted">
                <img src={channel.banners[channel.banners.length - 1]!.url} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
            )}

            {/* Channel info row */}
            <div className="flex items-start gap-4 flex-wrap">
              <div className="h-20 w-20 rounded-full overflow-hidden bg-muted flex-shrink-0 border-2 border-white/10">
                {channel.thumbnails.length > 0 ? (
                  <img src={channel.thumbnails[channel.thumbnails.length - 1]!.url} alt={channel.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-2xl font-bold text-muted-foreground">
                    {channel.name?.charAt(0)}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold">{channel.name}</h1>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                  {channel.subscriberCount && (
                    <span className="flex items-center gap-1"><Users className="h-4 w-4" />{channel.subscriberCount} subscribers</span>
                  )}
                  {channel.videoCount && (
                    <span className="flex items-center gap-1"><Video className="h-4 w-4" />{channel.videoCount} videos</span>
                  )}
                </div>
                {channel.description && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{channel.description}</p>
                )}
              </div>

              <Button
                variant={subscribed ? "outline" : "default"}
                className={`gap-2 rounded-full flex-shrink-0 ${subscribed ? "border-white/20" : ""}`}
                onClick={() => {
                  if (!isAuthenticated) { toast.info("Sign in to subscribe"); return; }
                  subscribeMutation.mutate();
                }}
                disabled={subscribeMutation.isPending}
              >
                {subscribeMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : subscribed ? (
                  <><BellOff className="h-4 w-4" /> Subscribed</>
                ) : (
                  <><Bell className="h-4 w-4" /> Subscribe</>
                )}
              </Button>
            </div>

            {/* Videos tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <TabsList className="bg-white/5 border border-white/10">
                {TABS.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 data-[state=active]:bg-white/10">
                    <tab.icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {TABS.map((tab) => (
                <TabsContent key={tab.value} value={tab.value} className="mt-6">
                  {videosLoading ? (
                    <YTVideoCardSkeleton count={8} />
                  ) : videosData?.videos && videosData.videos.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {videosData.videos.map((v) => (
                        <YTVideoCard key={v.id} video={v} />
                      ))}
                    </div>
                  ) : (
                    <div className="py-16 text-center text-muted-foreground">
                      <tab.icon className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p>No {tab.label.toLowerCase()} found for this channel</p>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
}
