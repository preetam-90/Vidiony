"use client";

import { useParams } from "next/navigation";
import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useVideo, useChannel } from "@/hooks/useYoutube";
import { useWatchHistory } from "@/store/watch-history";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { useSidebar } from "@/contexts/sidebar-context";
import { cn } from "@/lib/utils";
import { createStoryboardPreviewResolver } from "@/components/VideoPlayer/storyboard";
import { CommentSection } from "@/components/video/CommentSection";
import { RelatedVideos } from "@/components/video/RelatedVideos";
import { VideoRecommendationPanel } from "@/components/video/PersonalizedSections";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type { CaptionTrack } from "@/hooks/usePlayerState";
import {
  useTrackWatch,
  useTrackInteraction,
  useVideoRecommendations,
} from "@/hooks/useRecommendations";
import {
  ChevronLeft, ThumbsUp, ThumbsDown, Share2, Eye,
  Clock, User, Download, Bell, BellOff,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { LiveChat } from "@/components/video/LiveChat";
import { VideoDescription } from "@/components/video/VideoDescription";
import { WatchLaterButton } from "@/components/video/WatchLaterButton";
import { usePlayerStore } from "@/store/playerStore";
import { playerFunctions } from "@/lib/playerFunctions";

function formatNumber(num: number) {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

export default function WatchPage() {
  const { isCollapsed } = useSidebar();
  const sidebarPadding = isCollapsed ? "lg:pl-[72px]" : "lg:pl-[248px]";

  const params = useParams();
  const videoId = params.id as string;
  const { data: video, isLoading, error } = useVideo(videoId);
  // Fetch channel info (subscriber count etc.) for display under the player
  const { data: channelInfo } = useChannel(video?.channelId ?? "");
  const addToHistory = useWatchHistory((s) => s.addToHistory);
  const { isAuthenticated, user, isLoading: authLoading, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  // ─── Global player store ──────────────────────────────────────────────────
  const { playVideo, exitMiniPlayer, isTheaterMode: isTheater, isMiniPlayer } = usePlayerStore();

  // ─── Analytics ────────────────────────────────────────────────────────────
  const trackWatch = useTrackWatch();
  const trackInteraction = useTrackInteraction();
  const watchStartRef = useRef<number>(Date.now());

  // Personalized sidebar recommendations
  const {
    data: videoRecs,
    isLoading: videoRecsLoading,
  } = useVideoRecommendations(videoId);

  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [showDownload, setShowDownload] = useState(false);

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

  const promptYoutubeConnect = async () => {
    window.location.href = "/auth/login?error=YOUTUBE_PERMISSIONS_REQUIRED";
  };

  const ensureSubscribeReady = async () => {
    if (authLoading) {
      await refreshUser();
    }

    const currentUser = !authLoading && isAuthenticated && user ? user : await getLatestAuthUser();

    if (!currentUser) {
      toast.info("Sign in to subscribe");
      return false;
    }

    if (!currentUser.youtubeChannelId) {
      toast.info("Connect YouTube to subscribe");
      await promptYoutubeConnect();
      return false;
    }

    return true;
  };

  const { data: videoState } = useQuery({
    queryKey: ["video-state", videoId, video?.channelId],
    queryFn: () => api.getVideoState(videoId, video?.channelId),
    enabled: !!videoId && !!video?.channelId && !!isAuthenticated,
    staleTime: 60 * 1000,
    retry: false,
  });

  const { data: liveInfo } = useQuery({
    queryKey: ["live-info", videoId],
    queryFn: () => api.getLiveInfo(videoId),
    enabled: !!videoId && !!video?.isLive,
    staleTime: 15 * 1000,
    refetchInterval: 20 * 1000,
    retry: 1,
  });

  // Record watch history locally + server-side
  useEffect(() => {
    if (!video) return;
    const thumb = video.thumbnails?.[0]?.url ?? "";
    const durStr = video.duration
      ? `${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, "0")}`
      : "";

    addToHistory({ id: video.id, title: video.title, thumbnail: thumb, channelName: video.channelName, duration: durStr });

    if (isAuthenticated) {
      api.user.recordHistory({ id: video.id, videoId: video.id, title: video.title, thumbnail: thumb, channelName: video.channelName, duration: video.duration ?? null, progress: 0 }).catch(() => {});
    }
  }, [video?.id]);

  // ── Analytics beacon — fires every 30s while the page is open ─────────────
  useEffect(() => {
    if (!video || !isAuthenticated) return;

    watchStartRef.current = Date.now();

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - watchStartRef.current) / 1000);
      const pct = video.duration && video.duration > 0
        ? Math.min(100, (elapsed / video.duration) * 100)
        : 0;

      trackWatch({
        videoId: video.id,
        watchTime: elapsed,
        watchPercentage: pct,
        duration: video.duration ?? undefined,
        title: video.title,
        thumbnail: video.thumbnails?.[0]?.url,
        channelId: video.channelId,
        channelName: video.channelName,
        category: video.category ?? undefined,
        tags: video.tags?.slice(0, 15),
      });
    }, 30_000);

    // Fire once on unmount to capture final watch position
    return () => {
      clearInterval(interval);
      const elapsed = Math.floor((Date.now() - watchStartRef.current) / 1000);
      if (elapsed >= 5) {
        const pct = video.duration && video.duration > 0
          ? Math.min(100, (elapsed / video.duration) * 100)
          : 0;
        trackWatch({
          videoId: video.id,
          watchTime: elapsed,
          watchPercentage: pct,
          duration: video.duration ?? undefined,
          title: video.title,
          thumbnail: video.thumbnails?.[0]?.url,
          channelId: video.channelId,
          channelName: video.channelName,
        });
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video?.id, isAuthenticated]);

  useEffect(() => {
    if (!videoState) return;
    setLiked(Boolean(videoState.liked));
    setDisliked(Boolean(videoState.disliked));
    setSubscribed(Boolean(videoState.subscribed));
  }, [videoState]);

  // Like/dislike mutations (only for YouTube-connected users)
  const likeMutation = useMutation({
    mutationFn: () => liked ? api.removeVideoRating(videoId) : api.likeVideo(videoId),
    onMutate: () => {
      setLiked(!liked);
      if (!liked) setDisliked(false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-state", videoId, video?.channelId] });
      // Signal the recommendation engine
      if (!liked) trackInteraction.mutate({ videoId, actionType: "LIKE" });
    },
    onError: (err) => {
      setLiked(liked);
      toast.error(err instanceof Error ? err.message : "Failed to update like.");
    },
  });

  const dislikeMutation = useMutation({
    mutationFn: () => disliked ? api.removeVideoRating(videoId) : api.dislikeVideo(videoId),
    onMutate: () => {
      setDisliked(!disliked);
      if (!disliked) setLiked(false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-state", videoId, video?.channelId] });
      // Dislike = negative signal → bust recommendation cache immediately
      if (!disliked) trackInteraction.mutate({ videoId, actionType: "DISLIKE" });
    },
    onError: (err) => {
      setDisliked(disliked);
      toast.error(err instanceof Error ? err.message : "Failed to update dislike.");
    },
  });

  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: () =>
      subscribed
        ? api.user.unsubscribe(video!.channelId)
        : api.user.subscribe(video!.channelId),
    onMutate: () => setSubscribed(!subscribed),
    onSuccess: () => {
      toast.success(subscribed ? "Unsubscribed" : "Subscribed!");
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["yt-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["video-state", videoId, video?.channelId] });
    },
    onError: (err) => {
      setSubscribed(subscribed);
      if (err instanceof Error && err.message.toLowerCase().includes("connect youtube")) {
        void promptYoutubeConnect();
      }
      toast.error(err instanceof Error ? err.message : "Failed to update subscription.");
    },
  });

  // Post comment mutation
  const commentMutation = useMutation({
    mutationFn: (text: string) => api.postComment(videoId, text),
    onSuccess: () => {
      setCommentText("");
      toast.success("Comment posted!");
      queryClient.invalidateQueries({ queryKey: ["comments", videoId] });
    },
    onError: () => toast.error("Failed to post comment. Connect your YouTube account."),
  });

  // Copy share link
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  const captionTracks: CaptionTrack[] = video?.captions?.map((c) => ({
    id: c.id,
    label: c.label,
    language: c.language,
    src: api.captionUrl(video.id, c.language, c.isAuto),
  })) ?? [];

  const chapterMarkers = useMemo(
    () => video?.chapters?.map((chapter) => ({ time: chapter.time, label: chapter.label })) ?? [],
    [video?.chapters]
  );

  const storyboardPreviewResolver = useMemo(
    () => createStoryboardPreviewResolver(video?.storyboardSpec, video?.duration ?? 0, video?.storyboard),
    [video?.duration, video?.storyboard, video?.storyboardSpec]
  );

  // ─── Keep playerFunctions in sync with the latest storyboard resolver ──────
  useEffect(() => {
    playerFunctions.getPreviewSprite = storyboardPreviewResolver;
    return () => {
      playerFunctions.getPreviewSprite = null;
    };
  }, [storyboardPreviewResolver]);

  const liveStreamUrl = video?.isLive
    ? (liveInfo?.hlsManifestUrl ?? liveInfo?.dashManifestUrl ?? null)
    : null;

  // ─── Register video with the global player when metadata is ready ──────────
  // Live videos: wait for the manifest URL before registering.
  useEffect(() => {
    if (!video) return;
    if (video.isLive && !liveStreamUrl) return;

    playVideo({
      videoId: video.id,
      title: video.title,
      poster: video.thumbnails?.find((t) => t.width >= 640)?.url ?? video.thumbnails?.[0]?.url,
      formats: video.isLive ? [] : video.formats,
      captions: captionTracks,
      chapters: chapterMarkers,
      streamUrl: video.isLive ? liveStreamUrl! : undefined,
      isLive: video.isLive,
    });

    // If we navigated back to the watch page while in mini mode, exit mini mode
    // so the player fills the slot again.
    exitMiniPlayer();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video?.id, liveStreamUrl]);

  // For live videos, hold off showing the slot until the live manifest URL
  // is available so GlobalPlayer doesn't attempt a wrong stream fetch.
  const isLiveReady = !video?.isLive || liveStreamUrl !== null;

  const downloadQualities = ["best", "1080p", "720p", "480p", "360p", "audio"];

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Sidebar />
      <Navbar />

      <main className={cn("container mx-auto px-4 py-6 max-w-[1600px]", sidebarPadding)}>
        <Button variant="ghost" className="mb-4 gap-2" onClick={() => window.history.back()}>
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>

        {error && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-6 text-center">
            <p className="text-destructive">Failed to load video. Please try again.</p>
          </div>
        )}

        {isLoading && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="aspect-video w-full rounded-xl" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-2">
                  <Skeleton className="aspect-video w-40 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {video && (
          <div className={`grid gap-6 ${isTheater ? "grid-cols-1" : "lg:grid-cols-3"}`}>
            {/* ── Main content ─────────────────────────────────────────── */}
            <div className={`space-y-4 ${isTheater ? "" : "lg:col-span-2"}`}>
              {/* ── Player slot ────────────────────────────────────────────
                   This transparent placeholder div reserves the space where
                   GlobalPlayer positions itself via its RAF sync loop.
                   GlobalPlayer reads this element's viewport rect every frame
                   and mirrors its own `position:fixed` rect to match, so the
                   player visually scrolls with the page even though it is
                   technically a fixed overlay.
              ─────────────────────────────────────────────────────────── */}
              {!isLiveReady ? (
                /* For live videos: spinner while we wait for the manifest URL */
                <div className="aspect-video w-full rounded-xl bg-black flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div
                  id="player-slot"
                  className="aspect-video w-full rounded-xl bg-black/20"
                  aria-label="Video player"
                />
              )}

              {/* Mini player hint badge */}
              {isMiniPlayer && (
                <div className="flex items-center gap-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-3 py-2 text-sm text-indigo-300">
                  <span className="text-xs font-mono bg-indigo-500/20 px-1.5 py-0.5 rounded">i</span>
                  <span>Video is playing in mini player — press <kbd className="font-mono text-xs">i</kbd> to restore</span>
                </div>
              )}

              {/* Title */}
              <h1 className="text-xl font-bold leading-snug">{video.title}</h1>

              {/* Stats + Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-muted-foreground text-sm">
                  <span className="flex items-center gap-1.5"><Eye className="h-4 w-4" />{formatNumber(video.viewCount)} views</span>
                  {video.publishedAt && <><span>·</span><span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{video.publishedAt}</span></>}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Like */}
                  <div className="flex rounded-full border border-white/10 overflow-hidden">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`gap-2 rounded-none rounded-l-full px-4 ${liked ? "bg-white/10 text-white" : ""}`}
                      onClick={() => {
                        if (!isAuthenticated) { toast.info("Sign in to like videos"); return; }
                        likeMutation.mutate();
                      }}
                      disabled={likeMutation.isPending}
                    >
                      <ThumbsUp className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
                      {video.likeCount !== null && formatNumber(video.likeCount + (liked ? 1 : 0))}
                    </Button>
                    <div className="w-px bg-white/10" />
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`rounded-none rounded-r-full px-3 ${disliked ? "bg-white/10 text-white" : ""}`}
                      onClick={() => {
                        if (!isAuthenticated) { toast.info("Sign in to dislike"); return; }
                        dislikeMutation.mutate();
                      }}
                      disabled={dislikeMutation.isPending}
                    >
                      <ThumbsDown className={`h-4 w-4 ${disliked ? "fill-current" : ""}`} />
                    </Button>
                  </div>

                  {/* Share */}
                  <Button variant="outline" size="sm" className="gap-2 rounded-full" onClick={handleShare}>
                    <Share2 className="h-4 w-4" /> Share
                  </Button>

                  {/* Download */}
                  <div className="relative">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 rounded-full"
                      onClick={() => setShowDownload(!showDownload)}
                    >
                      <Download className="h-4 w-4" /> Download
                    </Button>
                    {showDownload && (
                      <div className="absolute right-0 top-full mt-2 z-50 w-44 rounded-xl border border-white/10 bg-card/95 backdrop-blur-xl shadow-xl overflow-hidden">
                        {downloadQualities.map((q) => (
                          <a
                            key={q}
                            href={api.downloadUrl(videoId, q)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors"
                            onClick={(e) => {
                              if (!isAuthenticated) {
                                e.preventDefault();
                                toast.info("Sign in to download videos");
                                return;
                              }
                              setShowDownload(false);
                            }}
                          >
                            <Download className="h-3.5 w-3.5 text-muted-foreground" />
                            {q === "best" ? "Best quality" : q === "audio" ? "Audio only (M4A)" : q}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Watch Later */}
                  <WatchLaterButton
                    videoId={videoId}
                    title={video.title}
                    thumbnail={video.thumbnails?.[0]?.url}
                    channelName={video.channelName}
                    channelId={video.channelId}
                    duration={video.duration ? `${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, "0")}` : undefined}
                    variant="full"
                  />
                </div>
              </div>

              {/* Tags */}
              {video.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {video.tags.slice(0, 10).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs cursor-pointer hover:bg-white/10"
                      onClick={() => window.location.href = `/search?q=${encodeURIComponent(tag)}`}>
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Channel + subscribe + description */}
              <div className="rounded-xl bg-white/[0.03] border border-white/5 overflow-hidden">
                {/* Channel row */}
                <div className="flex items-center justify-between gap-4 flex-wrap p-4 pb-3">
                  <Link href={`/channel/${video.channelId}`} className="flex items-center gap-3 group">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                      {(() => {
                        // Support multiple shapes: { url } object or string URL; fallback to video thumbnail
                        const thumb: string | undefined =
                          (video.channelThumbnail as any)?.url ??
                          (typeof (video.channelThumbnail as any) === "string" ? (video.channelThumbnail as any) : undefined) ??
                          video.thumbnails?.[0]?.url;
                        if (thumb) {
                          return <img src={thumb} alt="" className="h-full w-full object-cover" />;
                        }
                        return <User className="h-5 w-5 text-muted-foreground" />;
                      })()}
                    </div>
                    <span className="font-semibold group-hover:text-primary transition-colors">
                      {video.channelName}
                    </span>
                  </Link>
                    {channelInfo?.subscriberCount && (
                      <div className="text-sm text-muted-foreground">{channelInfo.subscriberCount} subscribers</div>
                    )}


                  <Button
                    variant={subscribed ? "outline" : "default"}
                    size="sm"
                    className={`gap-2 rounded-full ${subscribed ? "border-white/20" : ""}`}
                    onClick={async () => {
                      const ready = await ensureSubscribeReady();
                      if (!ready) return;
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

                {/* Description — YouTube-style expand */}
                {video.description && (
                  <VideoDescription description={video.description} publishedAt={video.publishedAt} viewCount={video.viewCount} />
                )}
              </div>

              {/* Post comment */}
              {isAuthenticated && user?.youtubeChannelId && (
                <div className="space-y-3 rounded-xl bg-white/[0.02] border border-white/5 p-4">
                  <p className="text-sm font-medium">Add a comment</p>
                  <Textarea
                    placeholder="Share your thoughts..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="bg-white/5 border-white/10 resize-none min-h-[80px]"
                    maxLength={500}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{commentText.length}/500</span>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setCommentText("")}>Cancel</Button>
                      <Button
                        size="sm"
                        disabled={!commentText.trim() || commentMutation.isPending}
                        onClick={() => commentMutation.mutate(commentText.trim())}
                      >
                        {commentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Comment"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <CommentSection videoId={video.id} />
            </div>

            {/* ── Sidebar ───────────────────────────────────────────────── */}
            {!isTheater && (
              <div className="space-y-4">
                {video.isLive && <LiveChat videoId={video.id} />}

                {/* Personalized engine recommendations first */}
                {(videoRecs?.related && videoRecs.related.length >= 5) ? (
                  <VideoRecommendationPanel
                    items={videoRecs.related}
                    isLoading={videoRecsLoading}
                  />
                ) : (
                  /* Fallback to YouTube's own related videos */
                  <RelatedVideos
                    videoId={video.id}
                    fallbackQuery={`${video.title} ${video.channelName}`.trim()}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
