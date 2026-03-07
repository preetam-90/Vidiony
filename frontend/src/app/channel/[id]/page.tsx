"use client";

import { useParams } from "next/navigation";
import { useChannel } from "@/hooks/useYoutube";
import { Navbar } from "@/components/layout/navbar";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Video, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ChannelPage() {
  const params = useParams();
  const channelId = params.id as string;
  const { data: channel, isLoading, error } = useChannel(channelId);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-6">
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
              <div className="relative h-48 rounded-xl overflow-hidden bg-muted">
                <img
                  src={channel.banners[channel.banners.length - 1]!.url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            {/* Channel info */}
            <div className="flex items-start gap-4">
              <div className="h-20 w-20 rounded-full overflow-hidden bg-muted flex-shrink-0">
                {channel.thumbnails.length > 0 ? (
                  <img
                    src={channel.thumbnails[channel.thumbnails.length - 1]!.url}
                    alt={channel.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-2xl font-bold text-muted-foreground">
                    {channel.name?.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold">{channel.name}</h1>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  {channel.subscriberCount && (
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {channel.subscriberCount} subscribers
                    </span>
                  )}
                  {channel.videoCount && (
                    <span className="flex items-center gap-1">
                      <Video className="h-4 w-4" />
                      {channel.videoCount} videos
                    </span>
                  )}
                </div>
                {channel.description && (
                  <p className="mt-3 text-sm text-muted-foreground whitespace-pre-line line-clamp-4">
                    {channel.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
