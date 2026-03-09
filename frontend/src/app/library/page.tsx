"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { useWatchHistory } from "@/store/watch-history";
import { api, type YTHistoryVideo, type YTHistorySection } from "@/lib/api";
import { Navbar } from "@/components/layout/navbar";
import { YTVideoCard } from "@/components/video/YTVideoCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  History, ListVideo, Trash2, X, Clock, Play,
  LogIn, ThumbsUp, BookmarkPlus, Bell, Eye, Youtube,
  UserCheck, Loader2, ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Shared video row card ─────────────────────────────────────────────────────

function VideoRowCard({
  video,
  onRemove,
  showRemove = false,
}: {
  video: YTHistoryVideo & { watchedAt?: number };
  onRemove?: () => void;
  showRemove?: boolean;
}) {
  return (
    <div className="group relative flex gap-3 rounded-xl p-2 hover:bg-white/[0.04] transition-colors">
      <Link href={`/watch/${video.id}`} className="relative flex-shrink-0 w-36 sm:w-44 aspect-video rounded-lg overflow-hidden bg-white/5">
        {video.thumbnail && (
          <img src={video.thumbnail} alt="" className="h-full w-full object-cover" />
        )}
        {video.duration && (
          <div className="absolute bottom-1 right-1 rounded px-1 py-0.5 bg-black/80 text-[10px] font-medium">
            {video.duration}
          </div>
        )}
        {video.isLive && (
          <div className="absolute top-1 left-1 rounded px-1.5 py-0.5 bg-red-600 text-[10px] font-bold tracking-wider">
            LIVE
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
          <Play className="h-7 w-7 fill-white text-white drop-shadow-lg" />
        </div>
      </Link>

      <div className="min-w-0 flex-1 py-0.5">
        <Link href={`/watch/${video.id}`} className="line-clamp-2 text-sm font-medium leading-snug hover:text-primary transition-colors">
          {video.title}
        </Link>
        <Link href={`/channel/${video.channelId}`} className="mt-1 text-xs text-muted-foreground hover:text-primary transition-colors block truncate">
          {video.channelName}
        </Link>
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground/60 flex-wrap">
          {video.viewCount && (
            <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{video.viewCount}</span>
          )}
          {video.publishedAt && (
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{video.publishedAt}</span>
          )}
          {video.watchedAt && (
            <span>· {timeAgo(video.watchedAt)}</span>
          )}
        </div>
      </div>

      {showRemove && onRemove && (
        <button
          className="absolute right-2 top-2 rounded-full p-1 opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all"
          onClick={onRemove}
          title="Remove"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}

function timeAgo(ms: number) {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Empty / CTA states ────────────────────────────────────────────────────────

function ConnectYouTubeCTA({ title, description }: { title: string; description: string }) {
  const handleConnect = async () => {
    try {
      const { url } = await api.auth.youtubeConnectUrl();
      window.location.href = url;
    } catch { toast.error("Could not start YouTube connection"); }
  };
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <div className="h-16 w-16 rounded-full bg-red-600/10 flex items-center justify-center">
        <Youtube className="h-8 w-8 text-red-500" />
      </div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">{description}</p>
      </div>
      <Button onClick={handleConnect} size="sm" className="gap-2">
        <Youtube className="h-4 w-4" /> Connect YouTube
      </Button>
    </div>
  );
}

function SignInCTA() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <div className="h-16 w-16 rounded-full bg-violet-600/10 flex items-center justify-center">
        <UserCheck className="h-8 w-8 text-violet-400" />
      </div>
      <div>
        <p className="font-semibold">Sign in to see your library</p>
        <p className="text-sm text-muted-foreground mt-1">Connect YouTube to sync history, liked videos, and playlists</p>
      </div>
      <div className="flex gap-2">
        <Button asChild size="sm"><Link href="/auth/login"><LogIn className="mr-2 h-4 w-4" />Sign In</Link></Button>
        <Button variant="outline" size="sm" asChild><Link href="/auth/register">Create Account</Link></Button>
      </div>
    </div>
  );
}

function LoadingRows({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-3 p-2">
          <Skeleton className="w-44 aspect-video rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2 py-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── YouTube History tab ───────────────────────────────────────────────────────

function YTHistoryTab() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["yt-history"],
    queryFn: () => api.user.getYouTubeHistory(),
    staleTime: 2 * 60 * 1000,
  });

  if (isLoading) return <LoadingRows count={8} />;

  if (error) return (
    <div className="py-8 text-center text-sm text-muted-foreground">
      Failed to load YouTube history. Make sure your account is connected.
    </div>
  );

  const sections = data?.sections ?? [];
  if (sections.length === 0) return (
    <div className="py-16 text-center text-muted-foreground">
      <Eye className="h-12 w-12 mx-auto mb-4 opacity-30" />
      <p>No Vidion watch history yet</p>
      <p className="text-sm mt-1">YouTube does not expose private watch history via its public API, so this tab shows videos watched inside Vidion.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {sections.map((section: YTHistorySection) => (
        section.videos.length > 0 && (
          <div key={section.title}>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
              {section.title}
            </h3>
            <div className="space-y-0.5">
              {section.videos.map((v) => (
                <VideoRowCard key={v.id} video={v} />
              ))}
            </div>
          </div>
        )
      ))}
    </div>
  );
}

// ─── Liked Videos tab ─────────────────────────────────────────────────────────

function LikedVideosTab() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["yt-liked"],
    queryFn: () => api.user.getLikedVideos(),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <LoadingRows count={6} />;
  if (error) return <div className="py-8 text-center text-sm text-muted-foreground">Failed to load liked videos.</div>;

  const videos = data?.videos ?? [];
  if (videos.length === 0) return (
    <div className="py-16 text-center text-muted-foreground">
      <ThumbsUp className="h-12 w-12 mx-auto mb-4 opacity-30" />
      <p>No liked videos yet</p>
    </div>
  );

  return (
    <div>
      <p className="text-sm text-muted-foreground px-2 mb-3">{videos.length.toLocaleString()} videos</p>
      <div className="space-y-0.5">
        {videos.map((v) => <VideoRowCard key={v.id} video={v} />)}
      </div>
    </div>
  );
}

// ─── Watch Later tab ──────────────────────────────────────────────────────────

function WatchLaterTab() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["yt-watch-later"],
    queryFn: () => api.user.getWatchLater(),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <LoadingRows count={6} />;
  if (error) return <div className="py-8 text-center text-sm text-muted-foreground">Failed to load Watch Later.</div>;

  const videos = data?.videos ?? [];
  if (videos.length === 0) return (
    <div className="py-16 text-center text-muted-foreground">
      <BookmarkPlus className="h-12 w-12 mx-auto mb-4 opacity-30" />
      <p>No Watch Later videos could be loaded</p>
      <p className="text-sm mt-1">YouTube's public API does not reliably expose the private Watch Later playlist for all accounts.</p>
    </div>
  );

  return (
    <div>
      <p className="text-sm text-muted-foreground px-2 mb-3">{videos.length.toLocaleString()} videos</p>
      <div className="space-y-0.5">
        {videos.map((v) => <VideoRowCard key={v.id} video={v} />)}
      </div>
    </div>
  );
}

// ─── Local watch history tab ──────────────────────────────────────────────────

function LocalHistoryTab() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { items: localHistory, removeFromHistory, clearHistory } = useWatchHistory();

  const { data: serverData } = useQuery({
    queryKey: ["vidion-history"],
    queryFn: () => api.user.getHistory(),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });

  const serverIds = new Set(serverData?.items?.map((i: any) => i.id) ?? []);
  const merged = [
    ...(serverData?.items ?? []).map((i: any) => ({ ...i, watchedAt: new Date(i.watchedAt).getTime() })),
    ...localHistory.filter((i) => !serverIds.has(i.id)),
  ].sort((a, b) => b.watchedAt - a.watchedAt);

  const removeMutation = useMutation({
    mutationFn: (id: string) => isAuthenticated ? api.user.removeFromHistory(id) : Promise.resolve({ success: true }),
    onMutate: (id) => { removeFromHistory(id); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vidion-history"] }),
  });

  if (merged.length === 0) return (
    <div className="py-16 text-center text-muted-foreground">
      <Eye className="h-12 w-12 mx-auto mb-4 opacity-30" />
      <p>No watch history yet</p>
      <p className="text-sm mt-1">Videos you watch on Vidion appear here</p>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between px-2 mb-3">
        <p className="text-sm text-muted-foreground">{merged.length} videos</p>
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-destructive h-7 text-xs"
          onClick={() => { clearHistory(); queryClient.invalidateQueries({ queryKey: ["vidion-history"] }); }}>
          <Trash2 className="h-3.5 w-3.5" /> Clear all
        </Button>
      </div>
      <div className="space-y-0.5">
        {merged.map((item) => (
          <VideoRowCard
            key={item.id}
            video={{ ...item, channelId: "", channelThumbnail: null, viewCount: "", publishedAt: "", isLive: false }}
            showRemove
            onRemove={() => removeMutation.mutate(item.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Playlists tab ────────────────────────────────────────────────────────────

function PlaylistsTab() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["yt-playlists"],
    queryFn: () => api.user.getYouTubePlaylists(),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-video rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );

  if (error) return <div className="py-8 text-center text-sm text-muted-foreground">Failed to load playlists.</div>;

  const playlists = data?.playlists ?? [];
  if (playlists.length === 0) return (
    <div className="py-16 text-center text-muted-foreground">
      <ListVideo className="h-12 w-12 mx-auto mb-4 opacity-30" />
      <p>No playlists found</p>
    </div>
  );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {playlists.map((p) => (
        <Link key={p.id} href={`/playlist/${p.id}`}
          className="group flex flex-col rounded-xl overflow-hidden border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all">
          <div className="relative aspect-video bg-white/5">
            {p.thumbnail
              ? <img src={p.thumbnail} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
              : <div className="h-full w-full flex items-center justify-center"><ListVideo className="h-8 w-8 text-white/20" /></div>
            }
            <div className="absolute bottom-1 right-1 flex items-center gap-1 rounded px-1.5 py-0.5 bg-black/80 text-[10px]">
              <ListVideo className="h-3 w-3" />{p.videoCount}
            </div>
          </div>
          <div className="p-3">
            <p className="font-medium text-sm line-clamp-1">{p.title}</p>
            {p.lastUpdated && <p className="text-xs text-muted-foreground mt-0.5">{p.lastUpdated}</p>}
          </div>
        </Link>
      ))}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

const TABS = [
  { value: "yt-history",    label: "Vidion History",   icon: History,       ytRequired: true },
  { value: "liked",         label: "Liked Videos",     icon: ThumbsUp,      ytRequired: true },
  { value: "watch-later",   label: "Watch Later",      icon: BookmarkPlus,  ytRequired: true },
  { value: "playlists",     label: "Playlists",        icon: ListVideo,     ytRequired: true },
  { value: "local-history", label: "Local History",    icon: Eye,           ytRequired: false },
] as const;

export default function LibraryPage() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const ytConnected = !!user?.youtubeConnected;

  const handleConnectYT = async () => {
    try {
      const { url } = await api.auth.youtubeConnectUrl();
      window.location.href = url;
    } catch { toast.error("Could not start YouTube connection"); }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-4xl">

        {/* Page header */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/20 text-violet-400">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Library</h1>
              <p className="text-sm text-muted-foreground">Your Vidion history, liked videos, and YouTube playlists</p>
            </div>
          </div>

          {/* YouTube connect pill */}
          {isAuthenticated && (
            ytConnected ? (
              <div className="flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1.5 text-xs text-green-400">
                <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
                YouTube connected
              </div>
            ) : (
              <Button size="sm" variant="outline" className="gap-2 rounded-full border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={handleConnectYT}>
                <Youtube className="h-3.5 w-3.5" /> Connect YouTube
              </Button>
            )
          )}
        </div>

        {authLoading ? (
          <div className="py-24 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !isAuthenticated ? (
          <SignInCTA />
        ) : (
          <Tabs defaultValue={ytConnected ? "yt-history" : "local-history"}>
            <TabsList className="bg-white/5 border border-white/10 mb-6 flex-wrap h-auto gap-1 p-1">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const locked = tab.ytRequired && !ytConnected;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    disabled={locked}
                    className={cn(
                      "gap-1.5 data-[state=active]:bg-white/10 text-xs h-8",
                      locked && "opacity-40 cursor-not-allowed"
                    )}
                    title={locked ? "Connect YouTube to unlock" : undefined}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                    {locked && <span className="text-[10px] opacity-60">🔒</span>}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value="yt-history">
              {ytConnected ? <YTHistoryTab /> : <ConnectYouTubeCTA title="Connect YouTube to sync your library" description="This tab shows videos watched inside Vidion. YouTube does not provide private watch history through its public API." />}
            </TabsContent>

            <TabsContent value="liked">
              {ytConnected ? <LikedVideosTab /> : <ConnectYouTubeCTA title="Connect YouTube to see liked videos" description="All videos you've liked on YouTube." />}
            </TabsContent>

            <TabsContent value="watch-later">
              {ytConnected ? <WatchLaterTab /> : <ConnectYouTubeCTA title="Connect YouTube to try Watch Later sync" description="Watch Later is a private YouTube list and may not be available for all accounts through the public API." />}
            </TabsContent>

            <TabsContent value="playlists">
              {ytConnected ? <PlaylistsTab /> : <ConnectYouTubeCTA title="Connect YouTube to see playlists" description="All your YouTube playlists in one place." />}
            </TabsContent>

            <TabsContent value="local-history">
              <LocalHistoryTab />
              {!ytConnected && (
                <div className="mt-6 rounded-xl bg-violet-600/10 border border-violet-600/20 p-4 flex items-center justify-between gap-4">
                  <p className="text-sm text-violet-300">Connect YouTube to sync liked videos and playlists. Private YouTube watch history is not available through the public API.</p>
                  <Button size="sm" variant="outline" className="border-violet-600/40 text-violet-300 flex-shrink-0" onClick={handleConnectYT}>
                    <Youtube className="mr-2 h-3.5 w-3.5" /> Connect
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
