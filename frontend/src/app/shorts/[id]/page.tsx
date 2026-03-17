"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Zap, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { ShortsPlayer } from "@/components/video/ShortsPlayer";
import type { VideoCardData } from "@/lib/api";

interface ShortsPageData extends VideoCardData {
  videoUrl?: string;
}

export default function ShortsVideoPage() {
  const params = useParams();
  const router = useRouter();
  const shortId = params.id as string;
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);

  const { data: videos, isLoading: isLoadingList } = useQuery({
    queryKey: ["category-videos", "shorts"],
    queryFn: async () => {
      const result = await api.search("programming shorts coding tutorial quick tips");
      return result.videos as ShortsPageData[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: videoDetails, isLoading: isLoadingVideo } = useQuery({
    queryKey: ["video", shortId],
    queryFn: async () => {
      const result = await api.getVideo(shortId);
      return result.video;
    },
    enabled: !!shortId,
    staleTime: 10 * 60 * 1000,
  });

  const currentIndex = videos?.findIndex((v) => v.id === shortId) ?? -1;
  const currentVideo = videos?.[currentIndex];
  const hasNext = currentIndex >= 0 && currentIndex < (videos?.length ?? 0) - 1;
  const hasPrev = currentIndex > 0;

  const handleNext = () => {
    if (hasNext && videos) {
      router.push(`/shorts/${videos[currentIndex + 1].id}`);
    }
  };

  const handlePrev = () => {
    if (hasPrev && videos) {
      router.push(`/shorts/${videos[currentIndex - 1].id}`);
    }
  };

  const handleClose = () => {
    router.push("/");
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    if (isDisliked) setIsDisliked(false);
  };

  const handleDislike = () => {
    setIsDisliked(!isDisliked);
    if (isLiked) setIsLiked(false);
  };

  const isLoading = isLoadingList || isLoadingVideo;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-red-500" />
          <div className="flex items-center gap-2 text-white/60">
            <Zap className="h-5 w-5" />
            <span>Loading Short...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!currentVideo) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white/60">Short not found</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black">
      <ShortsPlayer
        id={currentVideo.id}
        src={currentVideo.videoUrl}
        poster={currentVideo.thumbnails?.[0]?.url}
        title={currentVideo.title}
        description={videoDetails?.description}
        channelName={currentVideo.channelName}
        channelId={currentVideo.channelId}
        channelThumbnail={currentVideo.channelThumbnail}
        viewCount={currentVideo.viewCount}
        likes={isLiked ? 1 : 0}
        comments={0}
        isLiked={isLiked}
        isDisliked={isDisliked}
        autoPlay
        muted
        loop
        onNext={handleNext}
        onPrev={handlePrev}
        onClose={handleClose}
        onLike={handleLike}
        onDislike={handleDislike}
      />

      {hasPrev && (
        <button
          onClick={handlePrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          aria-label="Previous short"
        >
          <ChevronLeft className="h-8 w-8" />
        </button>
      )}

      {hasNext && (
        <button
          onClick={handleNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          aria-label="Next short"
        >
          <ChevronRight className="h-8 w-8" />
        </button>
      )}
    </div>
  );
}
