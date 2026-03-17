"use client";

import { useParams } from "next/navigation";
import { useSidebar } from "@/contexts/sidebar-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Play, Trash2, Lock, Globe, FileX } from "lucide-react";
import { usePlaylist, useDeletePlaylist } from "@/hooks/usePlaylists";
import { usePlayerStore } from "@/store/playerStore";
import { toast } from "sonner";
import Link from "next/link";

export default function PlaylistPage() {
  const { isCollapsed } = useSidebar();
  const sidebarPadding = isCollapsed ? "lg:pl-[72px]" : "lg:pl-[248px]";

  const params = useParams();
  const playlistId = params.id as string;

  const { data: playlist, isLoading, error } = usePlaylist(playlistId);
  const deletePlaylist = useDeletePlaylist();
  const { addToQueue } = usePlayerStore();

  const handlePlayAll = () => {
    if (!playlist || playlist.videos.length === 0) return;

    // Add first video to queue and play
    const firstVideo = playlist.videos[0];
    addToQueue({
      videoId: firstVideo.videoId,
      title: firstVideo.title,
      thumbnail: firstVideo.thumbnail,
    });

    // Add remaining videos to queue
    playlist.videos.slice(1).forEach((video) => {
      addToQueue({
        videoId: video.videoId,
        title: video.title,
        thumbnail: video.thumbnail,
      });
    });

    toast.success(`Added ${playlist.videos.length} videos to queue`);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this playlist?")) return;
    try {
      await deletePlaylist.mutateAsync(playlistId);
      window.location.href = "/library";
    } catch (error) {
      toast.error("Failed to delete playlist");
    }
  };

  const getPrivacyIcon = (privacy: string) => {
    switch (privacy) {
      case "PUBLIC":
        return <Globe className="h-4 w-4 text-green-500" />;
      case "UNLISTED":
        return <Globe className="h-4 w-4 text-yellow-500" />;
      default:
        return <Lock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f]">
        <main className={cn("container mx-auto px-4 py-6 max-w-5xl", sidebarPadding)}>
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-32 bg-gray-800 rounded" />
            <div className="h-64 bg-gray-800 rounded-xl" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-800 rounded-lg" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="min-h-screen bg-[#0f0f0f]">
        <main className={cn("container mx-auto px-4 py-6 max-w-5xl", sidebarPadding)}>
          <Button variant="ghost" className="mb-4 gap-2" onClick={() => window.history.back()}>
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          <div className="flex flex-col items-center justify-center py-20">
            <FileX className="h-16 w-16 text-gray-600 mb-4" />
            <h2 className="text-xl font-semibold">Playlist not found</h2>
            <p className="text-gray-500 mt-2">This playlist may be private or does not exist.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <main className={cn("container mx-auto px-4 py-6 max-w-5xl", sidebarPadding)}>
        <Button variant="ghost" className="mb-4 gap-2" onClick={() => window.history.back()}>
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Playlist Info */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl p-4 sticky top-20">
              {/* Thumbnail */}
              <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden mb-4">
                {playlist.videos[0]?.thumbnail ? (
                  <img
                    src={playlist.videos[0].thumbnail}
                    alt={playlist.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600">
                    <Play className="h-12 w-12" />
                  </div>
                )}
              </div>

              {/* Title and info */}
              <h1 className="text-xl font-bold">{playlist.name}</h1>
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
                {getPrivacyIcon(playlist.privacy)}
                <span>{playlist.privacy.toLowerCase()}</span>
                <span>•</span>
                <span>{playlist._count.videos} videos</span>
              </div>

              {playlist.description && (
                <p className="mt-3 text-sm text-gray-400">{playlist.description}</p>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={handlePlayAll}
                  disabled={playlist.videos.length === 0}
                  className="flex-1 gap-2"
                >
                  <Play className="h-4 w-4" /> Play All
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Video List */}
          <div className="lg:col-span-2 space-y-2">
            {playlist.videos.length === 0 ? (
              <div className="bg-card rounded-xl p-8 text-center">
                <p className="text-gray-400">This playlist has no videos yet.</p>
              </div>
            ) : (
              playlist.videos.map((video, index) => (
                <Link
                  key={video.id}
                  href={`/watch/${video.videoId}`}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-card transition-colors group"
                >
                  <span className="text-gray-500 text-sm w-6">{index + 1}</span>
                  <div className="flex-shrink-0 w-40 h-24 bg-gray-800 rounded overflow-hidden">
                    {video.thumbnail ? (
                      <img
                        src={video.thumbnail}
                        alt={video.title || "Video"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <Play className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate group-hover:text-blue-400">
                      {video.title || "Untitled Video"}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Added {new Date(video.addedAt).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
