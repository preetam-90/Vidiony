"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { ChannelInfo } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { BadgeCheck, Bell, BellRing, ChevronDown, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ChannelHeroProps {
  channel: ChannelInfo;
  channelId: string;
}

export function ChannelHero({ channel, channelId }: ChannelHeroProps) {
  const { isAuthenticated, isLoading: authLoading, refreshUser, user } = useAuth();
  const queryClient = useQueryClient();
  const [subscribedOverride, setSubscribedOverride] = useState<boolean | null>(null);
  const [notifyOn, setNotifyOn] = useState(false);
  const [showSubMenu, setShowSubMenu] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);

  // Diagnostic logging (safe)
  const bannersLength = channel.banners?.length ?? 0;
  const thumbnailsLength = channel.thumbnails?.length ?? 0;
  const computedBannerUrl = bannersLength > 0 ? channel.banners[bannersLength - 1].url : undefined;
  console.log('[ChannelHero] Channel data:', {
    id: channel.id,
    name: channel.name,
    banners: channel.banners,
    bannersLength,
    thumbnailsLength,
    bannerUrl: computedBannerUrl,
  });

  const { data: subscriptionStatus } = useQuery({
    queryKey: ["yt-subscription-status", channel.id],
    queryFn: () => api.user.getYouTubeSubscriptionStatus(channel.id),
    enabled: !authLoading && !!isAuthenticated && !!user?.youtubeChannelId,
    staleTime: 2 * 60 * 1000,
  });

  const serverSubscribed = subscriptionStatus?.subscribed ?? false;
  const subscribed = subscribedOverride ?? serverSubscribed;

  const promptYoutubeConnect = async () => {
    window.location.href = "/auth/login?error=YOUTUBE_PERMISSIONS_REQUIRED";
  };

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
      return false;
    }

    if (!currentUser.youtubeChannelId) {
      toast.info("Connect YouTube to subscribe");
      await promptYoutubeConnect();
      return false;
    }

    return true;
  };

  const subscribeMutation = useMutation({
    mutationFn: () =>
      subscribed ? api.user.unsubscribe(channel.id) : api.user.subscribe(channel.id),
    onMutate: () => {
      const previous = subscribed;
      setSubscribedOverride(!previous);
      if (previous) setNotifyOn(false);
      return { previous };
    },
    onSuccess: async (_data, _variables, context) => {
      toast.success(context?.previous ? "Unsubscribed" : "Subscribed!");
      await queryClient.invalidateQueries({ queryKey: ["yt-subscription-status", channel.id] });
      await queryClient.invalidateQueries({ queryKey: ["yt-subscriptions"] });
      setSubscribedOverride(null);
    },
    onError: (_error, _variables, context) => {
      if (context?.previous !== undefined) setSubscribedOverride(context.previous);
      if (_error instanceof Error && (_error.message.toLowerCase().includes("connect youtube") || _error.message.toLowerCase().includes("youtube account is required"))) {
        void promptYoutubeConnect();
      } else {
        toast.error(_error instanceof Error ? _error.message : "Failed to update subscription");
      }
    },
  });

  const lastBanner = channel.banners && channel.banners.length > 0 ? channel.banners[channel.banners.length - 1] : undefined;
  const lastThumb = channel.thumbnails && channel.thumbnails.length > 0 ? channel.thumbnails[channel.thumbnails.length - 1] : undefined;
  const bannerUrl = lastBanner?.url ?? lastThumb?.url;
  const avatarUrl = lastThumb?.url;

  const handle = channel.handle
    ? channel.handle.startsWith("@")
      ? channel.handle
      : `@${channel.handle}`
    : null;

  // Build stats array — handle · subs · videos
  const statParts = [
    handle,
    channel.subscriberCount ? `${channel.subscriberCount.replace(/\s*subscribers?/i, '')} subscribers` : null,
    channel.videoCount ? `${channel.videoCount.replace(/\s*videos?/i, '')} videos` : null,
  ].filter(Boolean) as string[];

  const maxDescLength = 150;
  const hasLongDesc = (channel.description?.length ?? 0) > maxDescLength;
  const displayDesc = hasLongDesc && !showFullDesc
    ? channel.description.slice(0, maxDescLength) + "…"
    : channel.description;

  const isOwner = user?.youtubeChannelId === channel.id;

  return (
    <section className="w-full">
      {/* Banner */}
      <div className="relative w-full h-[120px] sm:h-[170px] md:h-[220px] overflow-hidden bg-[#1a1a1a]">
        {bannerUrl && (
          <Image
            src={bannerUrl}
            alt=""
            fill
            className="object-cover"
            unoptimized
            priority
          />
        )}
      </div>

      {/* Channel info row */}
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Avatar + info row — avatar below banner */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6 pt-4 sm:pt-6 pb-4 sm:pb-5">
            {/* Avatar */}
            <div className="flex-shrink-0 self-center sm:self-auto">
              <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full overflow-hidden bg-[#2a2a2a] relative">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={channel.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-3xl font-bold text-white">
                    {channel.name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* Info block */}
            <div className="flex-1 min-w-0 pt-2 sm:pt-0 sm:pb-1">
              <div className="flex flex-col gap-3">
                {/* Name row */}
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-[28px] font-bold leading-tight flex items-center gap-2 flex-wrap">
                    <span>{channel.name}</span>
                    {channel.isVerified && (
                      <BadgeCheck className="h-5 w-5 sm:h-6 sm:w-6 text-[#aaaaaa] fill-[#aaaaaa] flex-shrink-0" />
                    )}
                  </h1>

                  {/* Stats row — handle · subs · videos */}
                  {statParts.length > 0 && (
                    <p className="text-sm text-[#aaaaaa] mt-1 flex flex-wrap items-center gap-0">
                      {statParts.map((part, i) => (
                        <span key={i} className="flex items-center">
                          <span>{part}</span>
                          {i < statParts.length - 1 && (
                            <span className="mx-1.5 text-[#555]">•</span>
                          )}
                        </span>
                      ))}
                    </p>
                  )}

                  {/* Description snippet */}
                  {channel.description && (
                    <div className="mt-2 text-sm text-[#aaaaaa] max-w-2xl leading-relaxed">
                      <span>{displayDesc}</span>
                      {hasLongDesc && (
                        <button
                          onClick={() => setShowFullDesc(!showFullDesc)}
                          className="text-white font-medium hover:underline ml-1 inline"
                        >
                          {showFullDesc ? " Show less" : " ...more"}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Links */}
                  {channel.links && channel.links.length > 0 && (
                    <div className="mt-2 flex items-center gap-1.5 text-sm text-[#3ea6ff]">
                      <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                      <a
                        href={channel.links[0].url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline truncate max-w-[180px]"
                      >
                        {channel.links[0].title ||
                          (() => {
                            try { return new URL(channel.links[0].url).hostname; }
                            catch { return channel.links[0].url; }
                          })()}
                      </a>
                      {channel.links.length > 1 && (
                        <span className="text-[#aaaaaa] ml-1">
                          and {channel.links.length - 1} more link{channel.links.length > 2 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  {isOwner ? (
                    <Link href="/studio">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full bg-white/10 border-transparent hover:bg-white/20 text-white font-medium px-4"
                      >
                        Customize channel
                      </Button>
                    </Link>
                  ) : (
                    <>
                      {/* Subscribe / Subscribed button */}
                      {subscribed ? (
                        <div className="relative">
                          <button
                            onClick={() => setShowSubMenu(!showSubMenu)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors"
                          >
                            <BellRing className="h-4 w-4" />
                            <span>Subscribed</span>
                            <ChevronDown className="h-3.5 w-3.5 ml-0.5" />
                          </button>
                          {showSubMenu && (
                            <div className="absolute top-full left-0 mt-1 w-44 bg-[#282828] rounded-xl shadow-2xl py-1.5 z-50 border border-white/5">
                              <button
                                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 flex items-center gap-2.5"
                                onClick={() => { setNotifyOn(!notifyOn); setShowSubMenu(false); }}
                              >
                                <Bell className={cn("h-4 w-4", notifyOn ? "text-white" : "text-[#aaa]")} />
                                {notifyOn ? "Turn off notifications" : "All notifications"}
                              </button>
                              <button
                                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 flex items-center gap-2.5"
                                onClick={async () => {
                                  const ready = await ensureSubscribeReady();
                                  if (!ready) { setShowSubMenu(false); return; }
                                  subscribeMutation.mutate();
                                  setShowSubMenu(false);
                                }}
                              >
                                <span className="h-4 w-4 text-[#aaa] flex items-center justify-center text-lg leading-none">✕</span>
                                Unsubscribe
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={async () => {
                            const ready = await ensureSubscribeReady();
                            if (!ready) return;
                            subscribeMutation.mutate();
                          }}
                          disabled={subscribeMutation.isPending}
                          className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium hover:bg-[#d9d9d9] transition-colors disabled:opacity-60"
                        >
                          Subscribe
                        </button>
                      )}

                      {/* Bell icon — only shown when subscribed */}
                      {subscribed && (
                        <button
                          onClick={() => setNotifyOn(!notifyOn)}
                          className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center transition-colors"
                          title={notifyOn ? "Turn off notifications" : "Turn on notifications"}
                        >
                          {notifyOn ? (
                            <BellRing className="h-4 w-4 text-white" />
                          ) : (
                            <Bell className="h-4 w-4 text-white" />
                          )}
                        </button>
                      )}

                      {/* Join button */}
                      <button className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors">
                        Join
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
