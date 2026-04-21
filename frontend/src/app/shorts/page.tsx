"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Zap, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { ShortsPlayer } from "@/components/video/ShortsPlayer";
import type { VideoCardData } from "@/lib/api";

interface ShortsPageData extends VideoCardData {
  videoUrl?: string;
}

export default function ShortsFeedPage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [randomStats, setRandomStats] = useState({ likes: 0, comments: 0 });
  const [loadedVideos, setLoadedVideos] = useState<Set<number>>(new Set());

  useEffect(() => {
    setRandomStats({
      likes: Math.floor(Math.random() * 100000),
      comments: Math.floor(Math.random() * 5000)
    });
  }, [currentIndex]);

  const { data: videos, isLoading } = useQuery({
    queryKey: ["category-videos", "shorts"],
    queryFn: async () => {
      try {
        const result = await api.search("programming shorts coding tutorial quick tips");

        return result.videos as ShortsPageData[];
      } catch (err) {
        console.error("Shorts search failed:", err);
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {

  }, [videos]);

  useEffect(() => {
    if (videos && videos.length > 0) {
      setLoadedVideos(new Set([0]));
      const preloadNext = async () => {
        if (currentIndex < videos.length - 1) {
          const nextVideo = videos[currentIndex + 1];
          if (nextVideo?.videoUrl) {
            const link = document.createElement("link");
            link.rel = "preload";
            link.as = "video";
            link.href = nextVideo.videoUrl;
            document.head.appendChild(link);
            setLoadedVideos((prev) => new Set([...prev, currentIndex + 1]));
          }
        }
      };
      preloadNext();
    }
  }, [videos, currentIndex]);

  const handleScroll = useCallback((e: WheelEvent) => {
    if (!videos || videos.length === 0) return;

    if (e.deltaY > 20 && currentIndex < videos.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else if (e.deltaY < -20 && currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [videos, currentIndex]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("wheel", handleScroll, { passive: true });
    return () => container.removeEventListener("wheel", handleScroll);
  }, [handleScroll]);

  const handleNext = useCallback(() => {
    if (videos && currentIndex < videos.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [videos, currentIndex]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const handleClose = useCallback(() => {
    router.push("/");
  }, [router]);

  const handleVideoClick = useCallback((index: number) => {
    router.push(`/shorts/${videos?.[index]?.id}`);
  }, [videos, router]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-red-500" />
          <div className="flex items-center gap-2 text-white/60">
            <Zap className="h-5 w-5" />
            <span>Loading Shorts...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white/60">No shorts available</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="fixed inset-0 bg-black overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full h-full"
        >
          <ShortsPlayer
            id={videos[currentIndex].id}
            src={videos[currentIndex].videoUrl}
            poster={videos[currentIndex].thumbnails?.[0]?.url}
            title={videos[currentIndex].title}
            channelName={videos[currentIndex].channelName}
            channelId={videos[currentIndex].channelId}
            channelThumbnail={videos[currentIndex].channelThumbnail}
            viewCount={videos[currentIndex].viewCount}
            likes={Math.floor(Math.random() * 100000)}
            comments={Math.floor(Math.random() * 5000)}
            autoPlay
            muted
            loop
            onNext={handleNext}
            onPrev={handlePrev}
            onClose={handleClose}
          />
        </motion.div>
      </AnimatePresence>

      <div className="absolute top-4 left-4 z-30">
        <button
          onClick={handleClose}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors backdrop-blur-sm"
        >
          <Zap className="h-5 w-5 text-red-500" />
          <span className="font-semibold">Shorts</span>
        </button>
      </div>

      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2">
        {videos.slice(Math.max(0, currentIndex - 2), currentIndex + 3).map((video, idx) => {
          const actualIndex = Math.max(0, currentIndex - 2) + idx;
          return (
            <button
              key={video.id}
              onClick={() => setCurrentIndex(actualIndex)}
              className={`w-2 h-8 rounded-full transition-all ${actualIndex === currentIndex
                ? "bg-white"
                : "bg-white/30 hover:bg-white/50"
                }`}
              aria-label={`Go to short ${actualIndex + 1}`}
            />
          );
        })}
      </div>
    </div>
  );
}
