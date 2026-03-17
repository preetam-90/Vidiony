"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ShortsActions } from "./ShortsActions";
import { ShortsOverlay } from "./ShortsOverlay";
import type { VideoThumbnail } from "@/lib/api";
import { api } from "@/lib/api";

interface ShortsPlayerProps {
  id: string;
  src?: string;
  poster?: string;
  title: string;
  description?: string;
  channelName: string;
  channelId?: string;
  channelThumbnail?: VideoThumbnail | null;
  caption?: string;
  viewCount?: string;
  likes?: number;
  comments?: number;
  isLiked?: boolean;
  isDisliked?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  onNext?: () => void;
  onPrev?: () => void;
  onClose?: () => void;
  onLike?: () => void;
  onDislike?: () => void;
}

export function ShortsPlayer({
  id,
  src,
  poster,
  title,
  description,
  channelName,
  channelId,
  channelThumbnail,
  caption,
  viewCount,
  likes = 0,
  comments = 0,
  isLiked = false,
  isDisliked = false,
  autoPlay = true,
  muted = true,
  loop = true,
  onNext,
  onPrev,
  onClose,
  onLike,
  onDislike,
}: ShortsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastTapRef = useRef<{ side: "left" | "right" | null; time: number }>({ side: null, time: 0 });
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [showOverlay, setShowOverlay] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [streamUrl, setStreamUrl] = useState<string | null>(src ?? null);
  const [isLoadingStream, setIsLoadingStream] = useState(!src);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !streamUrl) return;
    v.muted = isMuted;
    if (autoPlay) {
      v.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
    if (loop) v.loop = true;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);

    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
    };
  }, [autoPlay, isMuted, loop, streamUrl]);

  useEffect(() => {
    if (streamUrl || !id) return;
    let cancelled = false;
    setIsLoadingStream(true);
    const fetchStream = async () => {
      console.log("Fetching stream URL for video:", id);
      try {
        const response = await fetch(`/api/yt/stream/${id}`);
        console.log("Stream response status:", response.status);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        console.log("Stream data:", data);
        const rawUrl = data.proxyUrl ?? data.url;
        if (!rawUrl) throw new Error("No stream URL in response");
        if (!cancelled) {
          setStreamUrl(rawUrl);
        }
      } catch (error) {
        console.error("Failed to fetch stream URL:", error);
      } finally {
        if (!cancelled) setIsLoadingStream(false);
      }
    };
    fetchStream();
    return () => { cancelled = true; };
  }, [id, streamUrl]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        handleNext();
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        handlePrev();
      }
      if (e.key === "m" || e.key === "M") {
        toggleMute();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying]);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
    } else {
      v.pause();
    }
    setShowOverlay(true);
    window.setTimeout(() => setShowOverlay(false), 700);
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
    setFeedback(v.muted ? "Muted" : "Unmuted");
    window.setTimeout(() => setFeedback(null), 800);
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  const seekBy = useCallback((delta: number) => {
    const v = videoRef.current;
    if (!v) return;
    const newTime = Math.max(0, Math.min((v.duration || 0), v.currentTime + delta));
    v.currentTime = newTime;
    setFeedback(`${delta > 0 ? "+" : ""}${Math.round(delta)}s`);
    window.setTimeout(() => setFeedback(null), 700);
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  const handleNext = useCallback(() => {
    setFeedback("Next");
    window.setTimeout(() => setFeedback(null), 400);
    onNext?.();
  }, [onNext]);

  const handlePrev = useCallback(() => {
    setFeedback("Previous");
    window.setTimeout(() => setFeedback(null), 400);
    onPrev?.();
  }, [onPrev]);

  const handleClick = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const side = e.clientX < rect.left + rect.width / 2 ? "left" : "right";
    const now = Date.now();
    const last = lastTapRef.current;

    if (last.side === side && now - last.time < 300) {
      seekBy(side === "left" ? -10 : 10);
      lastTapRef.current = { side: null, time: 0 };
    } else {
      lastTapRef.current = { side, time: now };
      window.setTimeout(() => {
        if (lastTapRef.current.time === now) togglePlay();
      }, 280);
    }
    showControlsTemporarily();
  };

  const handleTouchStart = (ev: React.TouchEvent) => {
    const t = ev.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
  };

  const handleTouchEnd = (ev: React.TouchEvent) => {
    const start = touchStartRef.current;
    if (!start) return;
    const t = ev.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    const dt = Date.now() - start.time;

    if (Math.abs(dy) > 60 && Math.abs(dy) > Math.abs(dx)) {
      if (dy < 0) {
        handleNext();
      } else {
        handlePrev();
      }
      touchStartRef.current = null;
      return;
    }

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const side = t.clientX < rect.left + rect.width / 2 ? "left" : "right";
    const now = Date.now();
    const last = lastTapRef.current;

    if (last.side === side && now - last.time < 300) {
      seekBy(side === "left" ? -10 : 10);
      lastTapRef.current = { side: null, time: 0 };
    } else {
      lastTapRef.current = { side, time: now };
      window.setTimeout(() => {
        if (lastTapRef.current.time === now) togglePlay();
      }, 280);
    }

    touchStartRef.current = null;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full max-h-screen bg-black flex items-center justify-center touch-none overflow-hidden"
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseMove={showControlsTemporarily}
    >
      <video
        key={id}
        ref={videoRef}
        src={streamUrl ?? undefined}
        poster={poster}
        className="w-full h-full object-cover"
        playsInline
        preload="auto"
        autoPlay={autoPlay}
        muted={isMuted}
        loop={loop}
        onPlay={() => console.log("Shorts video playing")}
        onError={(e) => console.error("Shorts video error:", e)}
      />

      {isLoadingStream && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <Loader2 className="h-10 w-10 animate-spin text-red-500" />
        </div>
      )}

      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 pointer-events-none"
          >
            <div className="absolute top-4 right-4 z-20 pointer-events-auto">
              <button
                onClick={(e) => { e.stopPropagation(); onClose?.(); }}
                className="rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
                aria-label="Close"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="absolute right-4 bottom-1/3 z-20 pointer-events-auto translate-y-12">
              <ShortsActions
                likes={likes}
                comments={comments}
                isLiked={isLiked}
                isDisliked={isDisliked}
                onLike={onLike}
                onDislike={onDislike}
              />
            </div>

            <div className="absolute bottom-6 left-4 right-20 z-20 pointer-events-auto flex items-center justify-between">
              <button
                onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                className="rounded-full bg-black/50 p-3 text-white hover:bg-black/70 transition-colors"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ShortsOverlay
        title={title}
        description={description}
        channelName={channelName}
        channelId={channelId}
        channelThumbnail={channelThumbnail}
        caption={caption}
        viewCount={viewCount}
      />

      <AnimatePresence>
        {showOverlay && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="rounded-full bg-black/50 p-4 text-white">
              {isPlaying ? <Pause size={32} /> : <Play size={32} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md bg-black/60 px-4 py-2 text-white/90 text-sm font-medium"
          >
            {feedback}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
