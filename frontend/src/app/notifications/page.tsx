"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { api, type YTNotification } from "@/lib/api";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { useSidebar } from "@/contexts/sidebar-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Bell, Video, LogIn, Youtube, Clock, Play } from "lucide-react";
import Link from "next/link";

function NotificationCard({ notification }: { notification: YTNotification }) {
  const hasVideo = !!notification.videoId;
  const hasThumbnail = !!notification.thumbnail;

  return (
    <Link
      href={hasVideo ? `/watch/${notification.videoId}` : "#"}
      className={`flex items-start gap-4 rounded-xl p-3 hover:bg-white/[0.04] transition-colors ${!notification.isRead ? "bg-violet-600/5" : ""}`}
    >
      {hasThumbnail ? (
        <div className="relative flex-shrink-0 w-40 aspect-video rounded-lg overflow-hidden bg-white/5">
          <img src={notification.thumbnail!} alt="" className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
          <Bell className="h-5 w-5 text-muted-foreground" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium line-clamp-2 leading-snug">
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
          {notification.channelName}
        </p>
        <p className="text-xs text-muted-foreground/60 mt-0.5 flex items-center gap-1.5">
          <Clock className="h-3 w-3" />
          {notification.sentAt}
        </p>
      </div>

      {!notification.isRead && (
        <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
      )}
    </Link>
  );
}

function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-4 rounded-xl p-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/4 mt-2" />
      </div>
    </div>
  );
}

function NotAuthed() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      <div className="h-20 w-20 rounded-full bg-violet-600/10 flex items-center justify-center">
        <Bell className="h-10 w-10 text-violet-400" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold">Sign in to view notifications</h2>
        <p className="text-muted-foreground mt-2 max-w-md">
          Create a Vidion account and connect your YouTube to see notifications from your subscribed channels.
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
    window.location.href = "/auth/login?error=YOUTUBE_PERMISSIONS_REQUIRED";
  };

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      <div className="h-20 w-20 rounded-full bg-red-600/10 flex items-center justify-center">
        <Youtube className="h-10 w-10 text-red-500" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold">Connect YouTube to see notifications</h2>
        <p className="text-muted-foreground mt-2 max-w-md">
          Link your YouTube account to get notifications from your subscribed channels.
        </p>
      </div>
      <Button onClick={handleConnect} className="gap-2">
        <Youtube className="h-4 w-4" /> Connect YouTube Account
      </Button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center">
        <Bell className="h-10 w-10 text-muted-foreground" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold">No notifications</h2>
        <p className="text-muted-foreground mt-2 max-w-md">
          You don&apos;t have any notifications yet. Subscribe to channels to receive updates when they upload new videos.
        </p>
      </div>
      <Button asChild variant="outline">
        <Link href="/subscriptions">Browse Subscriptions</Link>
      </Button>
    </div>
  );
}

export default function NotificationsPage() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const { isCollapsed } = useSidebar();
  const sidebarPadding = isCollapsed ? "lg:pl-[72px]" : "lg:pl-[248px]";

  const { data: notificationsData, isLoading: notifLoading, error } = useQuery({
    queryKey: ["yt-notifications"],
    queryFn: () => api.user.getNotifications(),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });

  console.log("[Notifications] isAuthenticated:", isAuthenticated, "youtubeChannelId:", user?.youtubeChannelId, "data:", notificationsData, "error:", error);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f]">
        <Navbar />
        <Sidebar />
        <main className={cn("container mx-auto px-4 py-8 max-w-4xl", sidebarPadding)}>
          <div className="space-y-3">
            <NotificationSkeleton />
            <NotificationSkeleton />
            <NotificationSkeleton />
          </div>
        </main>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0f0f0f]">
        <Navbar />
        <Sidebar />
        <main className={cn("container mx-auto px-4 py-8 max-w-4xl", sidebarPadding)}>
          <NotAuthed />
        </main>
      </div>
    );
  }

  if (!user?.youtubeChannelId) {
    return (
      <div className="min-h-screen bg-[#0f0f0f]">
        <Navbar />
        <Sidebar />
        <main className={cn("container mx-auto px-4 py-8 max-w-4xl", sidebarPadding)}>
          <NotConnected />
        </main>
      </div>
    );
  }

  const notifications = notificationsData?.notifications ?? [];
  const unseenCount = notificationsData?.unseenCount ?? 0;

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Navbar />
      <Sidebar />
      <main className={cn("container mx-auto px-4 py-8 max-w-4xl", sidebarPadding)}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Notifications</h1>
            {unseenCount > 0 && (
              <Badge className="bg-blue-600">{unseenCount}</Badge>
            )}
          </div>
        </div>

        {notifLoading && (
          <div className="space-y-3">
            <NotificationSkeleton />
            <NotificationSkeleton />
            <NotificationSkeleton />
          </div>
        )}

        {!notifLoading && notifications.length === 0 && (
          <EmptyState />
        )}

        {!notifLoading && notifications.length > 0 && (
          <div className="space-y-2">
            {notifications.map((notif) => (
              <NotificationCard key={notif.id} notification={notif} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
