"use client";

import {
  GripHorizontal,
  Maximize2,
  Pause,
  Play,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePlayerStore } from "@/store/playerStore";

interface MiniPlayerProps {
  /** Ref to the GlobalPlayer container — used to query the live <video> element. */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** True while the user is actively dragging — suppresses click-to-play jank. */
  isDragging: boolean;
}

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

function formatTime(secs: number): string {
  if (!Number.isFinite(secs) || secs < 0) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function MiniPlayer({ containerRef, isDragging }: MiniPlayerProps) {
  const router = useRouter();
  const {
    videoMeta,
    isPlaying,
    currentTime,
    duration,
    isMuted,
    volume,
    closePlayer,
    exitMiniPlayer,
  } = usePlayerStore();

  const getVideo = useCallback(
    (): HTMLVideoElement | null =>
      (containerRef.current?.querySelector("video") as HTMLVideoElement) ?? null,
    [containerRef]
  );

  // ─── Controls ──────────────────────────────────────────────────────────────
  const handlePlayPause = useCallback(() => {
    if (isDragging) return; // prevent accidental play/pause on drag-release
    const v = getVideo();
    if (!v) return;
    if (v.paused) v.play().catch(() => undefined);
    else v.pause();
  }, [getVideo, isDragging]);

  const handleMute = useCallback(() => {
    const v = getVideo();
    if (!v) return;
    v.muted = !v.muted;
  }, [getVideo]);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!duration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = clamp((e.clientX - rect.left) / rect.width, 0, 1);
      const v = getVideo();
      if (v) v.currentTime = ratio * duration;
    },
    [duration, getVideo]
  );

  /** Expand: exit mini mode and navigate to the watch page for this video. */
  const handleExpand = useCallback(() => {
    if (!videoMeta) return;
    exitMiniPlayer();
    router.push(`/watch/${videoMeta.videoId}`);
  }, [videoMeta, exitMiniPlayer, router]);

  /** Close: pause + clear the global player entirely. */
  const handleClose = useCallback(() => {
    const v = getVideo();
    if (v) v.pause();
    closePlayer();
  }, [getVideo, closePlayer]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="absolute inset-0 flex flex-col justify-between select-none">

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      {/*
        This entire bar doubles as the DRAG HANDLE.
        cursor:grab is set on the parent in GlobalPlayer when isMiniPlayer=true.
        Buttons inside break out of the drag zone — they have pointer-events and
        stop propagation so pointerdown on them doesn't start a drag.
      */}
      <div
        className="
          relative flex items-center gap-1.5
          px-2.5 pt-2 pb-2.5
          bg-gradient-to-b from-black/85 via-black/50 to-transparent
          opacity-0 group-hover:opacity-100
          transition-opacity duration-200
        "
      >
        {/* Drag affordance icon */}
        <span className="text-white/30 shrink-0 -ml-0.5 cursor-grab active:cursor-grabbing">
          <GripHorizontal size={12} />
        </span>

        {/* Title */}
        <p className="flex-1 truncate text-[11px] font-medium text-white/90 leading-none min-w-0">
          {videoMeta?.title ?? "Now playing"}
        </p>

        {/* Action buttons — must stop pointer propagation so they don't begin drags */}
        <div
          className="flex shrink-0 items-center gap-0.5"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={handleExpand}
            title="Expand (back to watch page)"
            className="
              flex h-6 w-6 items-center justify-center rounded-full
              text-white/70 hover:text-white hover:bg-white/15
              transition-colors duration-150
            "
          >
            <Maximize2 size={11} />
          </button>

          <button
            type="button"
            onClick={handleClose}
            title="Close player"
            className="
              flex h-6 w-6 items-center justify-center rounded-full
              text-white/70 hover:text-white hover:bg-white/15
              transition-colors duration-150
            "
          >
            <X size={11} />
          </button>
        </div>
      </div>

      {/* ── Centre click-to-play zone ────────────────────────────────────────── */}
      <div
        className="flex-1 cursor-pointer"
        onClick={handlePlayPause}
        role="button"
        aria-label={isPlaying ? "Pause" : "Play"}
        tabIndex={-1}
        onPointerDown={(e) => {
          // If this is a potential drag (parent will capture it), do NOT call
          // handlePlayPause on pointerdown. Click fires only on a clean tap.
          // However we must NOT stopPropagation or the parent's drag won't start.
        }}
      />

      {/* ── Bottom controls ──────────────────────────────────────────────────── */}
      <div
        className="
          flex flex-col gap-1.5
          px-2.5 pb-2 pt-3
          bg-gradient-to-t from-black/85 via-black/50 to-transparent
          opacity-0 group-hover:opacity-100
          transition-opacity duration-200
        "
        onPointerDown={(e) => e.stopPropagation()} // controls zone — no dragging
      >
        {/* Progress bar */}
        <div
          role="slider"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          tabIndex={0}
          className="relative h-[3px] w-full cursor-pointer rounded-full bg-white/20 group/bar hover:h-1 transition-all duration-150"
          onClick={handleProgressClick}
          onKeyDown={(e) => {
            const v = getVideo();
            if (!v || !duration) return;
            if (e.key === "ArrowRight") v.currentTime = clamp(v.currentTime + 5, 0, duration);
            if (e.key === "ArrowLeft") v.currentTime = clamp(v.currentTime - 5, 0, duration);
          }}
        >
          {/* Buffered ghost */}
          <div className="absolute inset-y-0 left-0 rounded-full bg-white/15" style={{ width: "100%" }} />
          {/* Played */}
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-indigo-400 transition-[width] duration-100"
            style={{ width: `${progress}%` }}
          />
          {/* Scrubber thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-white shadow opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none"
            style={{ left: `${progress}%` }}
          />
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-1.5"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {/* Play / Pause */}
          <button
            type="button"
            onClick={handlePlayPause}
            className="flex h-6 w-6 items-center justify-center rounded-full text-white hover:bg-white/15 transition-colors duration-150"
          >
            {isPlaying
              ? <Pause size={13} fill="currentColor" />
              : <Play size={13} fill="currentColor" />}
          </button>

          {/* Mute */}
          <button
            type="button"
            onClick={handleMute}
            className="flex h-6 w-6 items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/15 transition-colors duration-150"
          >
            {isMuted || volume === 0
              ? <VolumeX size={12} />
              : <Volume2 size={12} />}
          </button>

          {/* Time */}
          <span className="ml-auto text-[10px] tabular-nums text-white/50 leading-none">
            {formatTime(currentTime)}
            <span className="mx-[3px] text-white/25">/</span>
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}
