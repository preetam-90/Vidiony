"use client";

/**
 * GlobalPlayer
 *
 * Persistent video player that lives in the root layout and never unmounts.
 *
 * ── Modes ───────────────────────────────────────────────────────────────────
 *  SLOT   isMiniPlayer=false  Fixed overlay synced to #player-slot via RAF
 *  MINI   isMiniPlayer=true   320×180 draggable floating window
 *
 * ── Drag ────────────────────────────────────────────────────────────────────
 *  Uses window pointermove/pointerup listeners (not setPointerCapture, which
 *  throws DOMException with synthetic React events and surfaces as "undefined"
 *  runtime errors in Turbopack).
 *
 * ── Keyboard ────────────────────────────────────────────────────────────────
 *  i  →  in slot mode: enter mini + navigate home
 *  i  →  in mini mode: expand back to /watch/:id
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { VideoPlayer } from "@/components/VideoPlayer";
import { MiniPlayer } from "@/components/player/MiniPlayer";
import { usePlayerStore } from "@/store/playerStore";
import { playerFunctions } from "@/lib/playerFunctions";

// ─── Constants ────────────────────────────────────────────────────────────────
const VIDEO_QUERY_DELAY_MS = 50;
const MINI_W = 320;
const MINI_H = 180;
const EDGE_MARGIN = 12;
const DEFAULT_POS = { bottom: 20, right: 20 };

// ─── Helpers ─────────────────────────────────────────────────────────────────
function clampPos(right: number, bottom: number) {
  const maxRight = window.innerWidth - MINI_W - EDGE_MARGIN;
  const maxBottom = window.innerHeight - MINI_H - EDGE_MARGIN;
  return {
    right: Math.min(Math.max(right, EDGE_MARGIN), maxRight),
    bottom: Math.min(Math.max(bottom, EDGE_MARGIN), maxBottom),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
export function GlobalPlayer() {
  const pathname = usePathname();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  // ─── Store ────────────────────────────────────────────────────────────────
  const videoMeta = usePlayerStore((s) => s.videoMeta);
  const isMiniPlayer = usePlayerStore((s) => s.isMiniPlayer);
  const {
    enterMiniPlayer,
    exitMiniPlayer,
    setIsTheaterMode,
    playNextInQueue,
    _syncPlaying,
    _syncTime,
    _syncDuration,
    _syncVolume,
  } = usePlayerStore();

  // ─── Derived ──────────────────────────────────────────────────────────────
  const isOnWatchPage = pathname.startsWith("/watch/");

  // Ref so effects can read the latest value without re-subscribing.
  const isOnWatchPageRef = useRef(isOnWatchPage);
  useEffect(() => { isOnWatchPageRef.current = isOnWatchPage; });

  // ─── Visibility ───────────────────────────────────────────────────────────
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    if (videoMeta && !isVisible) {
      setIsVisible(true);
    } else if (!videoMeta && isVisible) {
      const t = window.setTimeout(() => setIsVisible(false), 300);
      return () => window.clearTimeout(t);
    }
  }, [videoMeta, isVisible]);

  // ─── Drag state ───────────────────────────────────────────────────────────
  const [miniPos, setMiniPos] = useState(DEFAULT_POS);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({
    active: false,
    startPointerX: 0,
    startPointerY: 0,
    startRight: DEFAULT_POS.right,
    startBottom: DEFAULT_POS.bottom,
  });

  // Reset position when entering mini mode.
  useEffect(() => {
    if (isMiniPlayer) setMiniPos(DEFAULT_POS);
  }, [isMiniPlayer]);

  // ─── Global drag listeners (window-level, avoids setPointerCapture) ───────
  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag.active) return;
      const newRight = drag.startRight - (e.clientX - drag.startPointerX);
      const newBottom = drag.startBottom - (e.clientY - drag.startPointerY);
      setMiniPos(clampPos(newRight, newBottom));
    };

    const onUp = () => {
      dragRef.current.active = false;
      setIsDragging(false);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [isDragging]);

  // ─── Pointer-down handler (starts drag) ──────────────────────────────────
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isMiniPlayer) return;
      // Buttons and sliders handle their own interactions.
      if ((e.target as HTMLElement).closest('button, [role="slider"]')) return;
      e.preventDefault();
      dragRef.current = {
        active: true,
        startPointerX: e.clientX,
        startPointerY: e.clientY,
        startRight: miniPos.right,
        startBottom: miniPos.bottom,
      };
      setIsDragging(true);
    },
    [isMiniPlayer, miniPos]
  );

  // ─── Auto-mini when leaving the watch page ────────────────────────────────
  useEffect(() => {
    if (!videoMeta) return;
    if (!isOnWatchPage && !isMiniPlayer) {
      enterMiniPlayer();
    }
  }, [pathname, videoMeta, isMiniPlayer, isOnWatchPage, enterMiniPlayer]);

  // ─── Auto-navigate home when entering mini from the watch page ────────────
  const prevIsMiniRef = useRef(isMiniPlayer);
  useEffect(() => {
    const justEnteredMini = !prevIsMiniRef.current && isMiniPlayer;
    prevIsMiniRef.current = isMiniPlayer;
    if (justEnteredMini && isOnWatchPageRef.current) {
      router.push("/");
    }
  }, [isMiniPlayer, router]);

  // ─── Keyboard shortcut: i ────────────────────────────────────────────────
  //   mini mode  → expand to watch page
  //   slot mode  → enter mini (auto-home effect fires above)
  const videoMetaRef = useRef(videoMeta);
  useEffect(() => { videoMetaRef.current = videoMeta; });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const meta = videoMetaRef.current;
      if (!meta) return;
      const target = e.target as HTMLElement;
      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
        target.isContentEditable
      )
        return;
      if (e.key !== "i" && e.key !== "I") return;
      e.preventDefault();
      if (isMiniPlayer) {
        exitMiniPlayer();
        router.push(`/watch/${meta.videoId}`);
      } else {
        enterMiniPlayer();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMiniPlayer, enterMiniPlayer, exitMiniPlayer, router]);

  // ─── Sync <video> events to Zustand ──────────────────────────────────────
  useEffect(() => {
    if (!videoMeta) return;
    let detach: (() => void) | undefined;
    const timer = window.setTimeout(() => {
      const video = containerRef.current?.querySelector("video") as HTMLVideoElement | null;
      if (!video) return;
      const onPlay = () => _syncPlaying(true);
      const onPause = () => _syncPlaying(false);
      const onTime = () => _syncTime(video.currentTime);
      const onDuration = () => _syncDuration(isFinite(video.duration) ? video.duration : 0);
      const onVolume = () => _syncVolume(video.volume, video.muted);
      const onEnded = () => {
        // Get next video in queue and play it
        const { queue, currentQueueIndex, playNextInQueue } = usePlayerStore.getState();
        if (queue.length > 0 && currentQueueIndex < queue.length - 1) {
          playNextInQueue();
          const nextItem = queue[currentQueueIndex + 1];
          if (nextItem) {
            router.push(`/watch/${nextItem.videoId}`);
          }
        }
      };
      video.addEventListener("play", onPlay);
      video.addEventListener("pause", onPause);
      video.addEventListener("timeupdate", onTime);
      video.addEventListener("durationchange", onDuration);
      video.addEventListener("volumechange", onVolume);
      video.addEventListener("ended", onEnded);
      detach = () => {
        video.removeEventListener("play", onPlay);
        video.removeEventListener("pause", onPause);
        video.removeEventListener("timeupdate", onTime);
        video.removeEventListener("durationchange", onDuration);
        video.removeEventListener("volumechange", onVolume);
        video.removeEventListener("ended", onEnded);
      };
    }, VIDEO_QUERY_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
      detach?.();
    };
  }, [videoMeta?.videoId, _syncPlaying, _syncTime, _syncDuration, _syncVolume, router]);

  // ─── Slot mode: RAF loop syncs position to #player-slot ──────────────────
  useLayoutEffect(() => {
    cancelAnimationFrame(rafRef.current);
    if (!videoMeta || isMiniPlayer) return;
    const sync = () => {
      const slot = document.getElementById("player-slot");
      const el = containerRef.current;
      if (slot && el) {
        const r = slot.getBoundingClientRect();
        el.style.top = `${r.top}px`;
        el.style.left = `${r.left}px`;
        el.style.width = `${r.width}px`;
        el.style.height = `${r.height}px`;
      }
      rafRef.current = requestAnimationFrame(sync);
    };
    rafRef.current = requestAnimationFrame(sync);
    return () => cancelAnimationFrame(rafRef.current);
  }, [videoMeta, isMiniPlayer, pathname]);

  // ─── Render ───────────────────────────────────────────────────────────────
  if (!videoMeta || !isVisible) return null;

  const isMini = isMiniPlayer;

  const cls = [
    "fixed z-[9998] overflow-hidden",
    isMini ? "rounded-xl shadow-2xl shadow-black/70 group" : "rounded-xl shadow-xl shadow-black/40",
    !isDragging && "transition-[width,height,bottom,right] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
  ]
    .filter(Boolean)
    .join(" ");

  // Mini mode: position from state. Slot mode: RAF writes top/left/width/height.
  const style: React.CSSProperties = isMini
    ? {
      position: "fixed",
      bottom: `${miniPos.bottom}px`,
      right: `${miniPos.right}px`,
      width: `${MINI_W}px`,
      height: `${MINI_H}px`,
      // Clear slot-mode RAF values so they don't linger.
      top: "",
      left: "",
      cursor: isDragging ? "grabbing" : "grab",
      userSelect: "none",
    }
    : {
      // RAF overwrites these every frame; provide safe defaults for first paint.
      position: "fixed",
      top: "0px",
      left: "0px",
      width: "100%",
      height: "auto",
    };

  return (
    <div
      ref={containerRef}
      className={cls}
      style={style}
      data-global-player
      data-mini={isMini ? "" : undefined}
      data-dragging={isDragging ? "" : undefined}
      onPointerDown={isMini ? handlePointerDown : undefined}
    >
      {/* ── Persistent video player ───────────────────────────────────── */}
      <VideoPlayer
        key={videoMeta.videoId}
        videoId={videoMeta.videoId}
        streamUrl={videoMeta.streamUrl}
        title={videoMeta.title}
        poster={videoMeta.poster}
        formats={videoMeta.formats}
        captions={videoMeta.captions}
        chapters={videoMeta.chapters}
        getPreviewSprite={playerFunctions.getPreviewSprite ?? undefined}
        onTheaterChange={setIsTheaterMode}
        onMiniPlayer={enterMiniPlayer}
        autoPlay
      />

      {/* ── Mini overlay (controls + glow ring) ──────────────────────── */}
      {isMini && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          {/* Edge glow ring */}
          <div className="absolute inset-0 rounded-xl ring-1 ring-white/10" />
          {/* Top accent bar */}
          <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500 opacity-80" />
          {/* Controls — pointer-events re-enabled only here */}
          <div className="absolute inset-0 pointer-events-auto">
            <MiniPlayer containerRef={containerRef} isDragging={isDragging} />
          </div>
        </div>
      )}
    </div>
  );
}
