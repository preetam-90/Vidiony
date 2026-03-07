"use client";

import React, {
  useRef, useEffect, useState, useCallback,
} from "react";
import Hls from "hls.js";
import { Play, Pause, AlertTriangle, Tv2 } from "lucide-react";
import { usePlayerState } from "@/hooks/usePlayerState";
import { usePlayerKeyboard } from "@/hooks/usePlayerKeyboard";
import { PlayerControls } from "./PlayerControls";
import "@/styles/player.css";
import type { CaptionTrack, QualityLevel } from "@/hooks/usePlayerState";
import type { FormatMetadata } from "@/lib/api";

// ─────────────────────────────────────────────────────────────────────────────

export interface VideoPlayerProps {
  videoId: string;
  streamUrl?: string;
  title?: string;
  poster?: string;
  captions?: CaptionTrack[];
  /** Video format list from the /video/:id response — used to build quality menu */
  formats?: FormatMetadata[];
  onTheaterChange?: (theater: boolean) => void;
  autoPlay?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────

const BACKEND_ROOT =
  process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/yt\/?$/, "").replace(/\/$/, "")
    : "";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api/yt";

/** Supported quality labels that map to backend yt-dlp format selectors */
const QUALITY_LABELS = ["144p", "240p", "360p", "480p", "720p", "1080p", "1440p", "2160p"] as const;
type QualityLabel = (typeof QUALITY_LABELS)[number];

function buildStreamUrl(videoId: string, quality?: string): string {
  const base = `${API_BASE}/stream/${videoId}`;
  return quality ? `${base}?quality=${encodeURIComponent(quality)}` : base;
}

/** Points directly at the ffmpeg merge endpoint — no JSON wrapping */
function buildMergeStreamUrl(videoId: string, quality: string): string {
  return `${API_BASE}/merged-stream/${videoId}?quality=${encodeURIComponent(quality)}`;
}

/** Derive quality levels from the formats metadata returned by /api/yt/video/:id */
function deriveQualityLevels(formats: FormatMetadata[]): QualityLevel[] {
  // Collect unique heights from combined (video+audio) or video-only formats
  const seen = new Set<number>();
  const levels: QualityLevel[] = [];

  formats
    .filter((f) => f.hasVideo && f.height && f.height > 0)
    .sort((a, b) => (b.height ?? 0) - (a.height ?? 0))
    .forEach((f, idx) => {
      const h = f.height!;
      const label = f.qualityLabel ?? `${h}p`;
      // Normalise label to one of our supported quality tags
      const normalized = QUALITY_LABELS.find((q) => q === `${h}p`) ?? label;
      if (!seen.has(h)) {
        seen.add(h);
        levels.push({ id: idx, label: normalized, height: h, bitrate: f.bitrate });
      }
    });

  return levels;
}

const CONTROLS_HIDE_DELAY = 3000;
type SeekFlash = "left" | "right" | null;
type ActivePanel = "speed" | "quality" | "captions" | null;

// ─────────────────────────────────────────────────────────────────────────────

export function VideoPlayer({
  videoId,
  streamUrl: propStreamUrl,
  title,
  poster,
  captions = [],
  formats = [],
  onTheaterChange,
  autoPlay = true,
}: VideoPlayerProps) {
  const playerRootRef  = useRef<HTMLDivElement>(null);
  const videoRef       = useRef<HTMLVideoElement>(null);
  const hlsRef         = useRef<Hls | null>(null);
  const controlsTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seekFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Preserved state across quality switches
  const pendingSeekRef    = useRef<number | null>(null);
  const pendingPlayRef    = useRef<boolean>(false); // resume playing after switch?

  const { state, patch } = usePlayerState();

  const [resolvedUrl,   setResolvedUrl]   = useState<string | null>(propStreamUrl ?? null);
  const [isFetchingUrl, setIsFetchingUrl] = useState(!propStreamUrl);
  const [activePanel,   setActivePanel]   = useState<ActivePanel>(null);
  const [seekFlash,     setSeekFlash]     = useState<SeekFlash>(null);
  const [centerFeedback, setCenterFeedback] = useState<"play" | "pause" | null>(null);
  const [feedbackKey,   setFeedbackKey]   = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);

  // ─── Build quality list from formats prop ─────────────────────────────────

  useEffect(() => {
    if (formats.length === 0) return;
    const levels = deriveQualityLevels(formats);
    if (levels.length > 0) {
      patch({ availableQualities: levels, activeQualityId: -1, selectedQuality: null });
    }
  }, [formats]);

  // ─── Fetch initial stream URL ──────────────────────────────────────────────

  useEffect(() => {
    if (propStreamUrl) {
      setResolvedUrl(propStreamUrl);
      setIsFetchingUrl(false);
      return;
    }
    if (!videoId) return;

    let cancelled = false;
    setIsFetchingUrl(true);
    setResolvedUrl(null);
    patch({ error: null, isLoading: true });

    fetch(buildStreamUrl(videoId))
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((data) => {
        if (cancelled) return;
        const raw: string | undefined = data.proxyUrl ?? data.url;
        if (!raw) throw new Error("No stream URL in response");
        setResolvedUrl(raw.startsWith("http") ? raw : `${BACKEND_ROOT}${raw}`);
      })
      .catch((e) => { if (!cancelled) patch({ error: e.message, isLoading: false }); })
      .finally(() => { if (!cancelled) setIsFetchingUrl(false); });

    return () => { cancelled = true; };
  }, [videoId, propStreamUrl]);

  // ─── Load URL into video / HLS ─────────────────────────────────────────────

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !resolvedUrl) return;

    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

    patch({ isLoading: true, error: null });

    const isHls =
      resolvedUrl.includes(".m3u8") ||
      resolvedUrl.includes("playlist") ||
      resolvedUrl.includes("hls");

    const resumeAt  = pendingSeekRef.current;
    const shouldPlay = pendingPlayRef.current || autoPlay;
    pendingSeekRef.current = null;
    pendingPlayRef.current = false;

    const afterLoad = () => {
      if (resumeAt !== null) video.currentTime = resumeAt;
      if (shouldPlay) video.play().catch(() => {});
    };

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, backBufferLength: 90 });
      hlsRef.current = hls;
      hls.loadSource(resolvedUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_e, data) => {
        if (state.availableQualities.length === 0) {
          const levels: QualityLevel[] = data.levels.map((l, i) => ({
            id: i,
            label: l.height ? `${l.height}p` : `Level ${i}`,
            height: l.height ?? 0,
            bitrate: l.bitrate,
          }));
          patch({ availableQualities: levels });
        }
        afterLoad();
      });

      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
          else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
          else patch({ error: "Playback error. Please try again." });
        }
      });
    } else {
      // Plain MP4 — must call load() explicitly so the browser re-fetches
      // the new src even if a stream is already active
      video.src = resolvedUrl;
      video.load();
      video.addEventListener("loadedmetadata", afterLoad, { once: true });
    }

    return () => {
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    };
  }, [resolvedUrl]);

  // ─── Video event wiring ────────────────────────────────────────────────────

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onPlay        = () => patch({ isPlaying: true, isEnded: false });
    const onPause       = () => patch({ isPlaying: false });
    const onEnded       = () => patch({ isPlaying: false, isEnded: true });
    const onWaiting     = () => patch({ isWaiting: true });
    const onCanPlay     = () => patch({ isWaiting: false, isLoading: false });
    const onLoaded      = () => patch({ duration: v.duration, isLoading: false });
    const onTimeUpdate  = () => {
      patch({ currentTime: v.currentTime });
      if (v.buffered.length > 0)
        patch({ buffered: v.buffered.end(v.buffered.length - 1) });
    };
    const onVolumeChange = () => patch({ volume: v.volume, isMuted: v.muted });
    const onRateChange   = () => patch({ playbackRate: v.playbackRate });
    const onError        = () => patch({
      error: "Video playback error. The stream may have expired.",
      isLoading: false,
    });

    v.addEventListener("play",           onPlay);
    v.addEventListener("pause",          onPause);
    v.addEventListener("ended",          onEnded);
    v.addEventListener("waiting",        onWaiting);
    v.addEventListener("canplay",        onCanPlay);
    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("timeupdate",     onTimeUpdate);
    v.addEventListener("volumechange",   onVolumeChange);
    v.addEventListener("ratechange",     onRateChange);
    v.addEventListener("error",          onError);

    return () => {
      v.removeEventListener("play",           onPlay);
      v.removeEventListener("pause",          onPause);
      v.removeEventListener("ended",          onEnded);
      v.removeEventListener("waiting",        onWaiting);
      v.removeEventListener("canplay",        onCanPlay);
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("timeupdate",     onTimeUpdate);
      v.removeEventListener("volumechange",   onVolumeChange);
      v.removeEventListener("ratechange",     onRateChange);
      v.removeEventListener("error",          onError);
    };
  }, []);

  // ─── Fullscreen + PiP sync ────────────────────────────────────────────────

  useEffect(() => {
    const onFS = () =>
      patch({ isFullscreen: !!(document.fullscreenElement || (document as any).webkitFullscreenElement) });
    document.addEventListener("fullscreenchange", onFS);
    document.addEventListener("webkitfullscreenchange", onFS);
    return () => {
      document.removeEventListener("fullscreenchange", onFS);
      document.removeEventListener("webkitfullscreenchange", onFS);
    };
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onEnter = () => patch({ isPiP: true });
    const onLeave = () => patch({ isPiP: false });
    v.addEventListener("enterpictureinpicture", onEnter);
    v.addEventListener("leavepictureinpicture", onLeave);
    return () => {
      v.removeEventListener("enterpictureinpicture", onEnter);
      v.removeEventListener("leavepictureinpicture", onLeave);
    };
  }, []);

  // ─── Caption track sync ───────────────────────────────────────────────────

  // 1. Rebuild <track> elements whenever the caption list changes.
  //    We remove all existing tracks first so there are no duplicates.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    // Remove all existing <track> children
    Array.from(v.querySelectorAll("track")).forEach((t) => t.remove());
    captions.forEach((cap) => {
      const el = document.createElement("track");
      el.kind     = "subtitles";
      el.label    = cap.label;
      el.srclang  = cap.language;
      el.src      = cap.src;
      // Store our id in a data attribute — TextTrack.id is read-only
      el.dataset.captionId = cap.id;
      v.appendChild(el);
    });
  }, [captions]);

  // 2. Activate / deactivate tracks whenever captionsEnabled or activeCaptionId changes.
  //    Default to the first track when no explicit selection has been made.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const targetId = state.activeCaptionId ?? captions[0]?.id ?? null;
    Array.from(v.querySelectorAll("track")).forEach((el) => {
      const trackEl = el as HTMLTrackElement;
      const id      = trackEl.dataset.captionId ?? "";
      const tt      = trackEl.track;
      if (!tt) return;
      tt.mode = state.captionsEnabled && id === targetId ? "showing" : "hidden";
    });
  }, [state.captionsEnabled, state.activeCaptionId, captions]);

  // ─── Controls visibility ──────────────────────────────────────────────────

  const showControlsTemporarily = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    if (state.isPlaying) {
      controlsTimer.current = setTimeout(() => {
        if (activePanel === null) setControlsVisible(false);
      }, CONTROLS_HIDE_DELAY);
    }
  }, [state.isPlaying, activePanel]);

  useEffect(() => {
    if (activePanel !== null) {
      if (controlsTimer.current) clearTimeout(controlsTimer.current);
      setControlsVisible(true);
    } else {
      showControlsTemporarily();
    }
  }, [activePanel]);

  useEffect(() => {
    if (!state.isPlaying) {
      setControlsVisible(true);
      if (controlsTimer.current) clearTimeout(controlsTimer.current);
    } else {
      showControlsTemporarily();
    }
  }, [state.isPlaying]);

  // ─── Playback handlers ────────────────────────────────────────────────────

  const handlePlayPause = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play().catch(() => {}); triggerFeedback("play"); }
    else          { v.pause();                triggerFeedback("pause"); }
  }, []);

  const handleSeek = useCallback((time: number) => {
    const v = videoRef.current;
    if (v) v.currentTime = Math.max(0, Math.min(state.duration, time));
  }, [state.duration]);

  const handleSeekDelta = useCallback((delta: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(state.duration, v.currentTime + delta));
    triggerSeekFlash(delta > 0 ? "right" : "left");
    showControlsTemporarily();
  }, [state.duration, showControlsTemporarily]);

  const handleVolume = useCallback((val: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = val;
    if (val > 0) v.muted = false;
  }, []);

  const handleMuteToggle = useCallback(() => {
    const v = videoRef.current;
    if (v) v.muted = !v.muted;
  }, []);

  const handleFullscreen = useCallback(async () => {
    const el = playerRootRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) await el.requestFullscreen();
      else await document.exitFullscreen();
    } catch {}
  }, []);

  const handleTheater = useCallback(() => {
    patch({ isTheaterMode: !state.isTheaterMode });
    onTheaterChange?.(!state.isTheaterMode);
  }, [state.isTheaterMode, onTheaterChange, patch]);

  const handlePiP = useCallback(async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else if (document.pictureInPictureEnabled) await v.requestPictureInPicture();
    } catch {}
  }, []);

  const handleSpeedChange = useCallback((rate: number) => {
    const v = videoRef.current;
    if (v) v.playbackRate = rate;
  }, []);

  // ─── Quality switching ────────────────────────────────────────────────────
  // For specific quality:  set resolvedUrl → /api/yt/merged-stream/:id?quality=Xp
  //   The backend runs yt-dlp (parallel video+audio) then pipes through ffmpeg.
  //   The endpoint IS the stream — no JSON, just raw fragmented MP4.
  // For Auto: refetch the original combined proxy URL.
  const handleQualityChange = useCallback((id: number) => {
    const v = videoRef.current;
    if (!v) return;

    const level = state.availableQualities.find((q) => q.id === id);
    const qualityLabel = id === -1 ? null : level ? `${level.height}p` : null;

    if (qualityLabel === state.selectedQuality) return;

    pendingSeekRef.current = v.currentTime;
    pendingPlayRef.current = !v.paused;
    patch({ activeQualityId: id, selectedQuality: qualityLabel, isLoading: true, error: null });

    if (qualityLabel === null) {
      // Auto — go back to original combined stream
      setIsFetchingUrl(true);
      fetch(buildStreamUrl(videoId))
        .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
        .then((data) => {
          const raw: string | undefined = data.proxyUrl ?? data.url;
          if (!raw) throw new Error("No stream URL");
          setResolvedUrl(raw.startsWith("http") ? raw : `${BACKEND_ROOT}${raw}`);
        })
        .catch((e) => {
          pendingSeekRef.current = null;
          pendingPlayRef.current = false;
          patch({ error: e.message, isLoading: false });
        })
        .finally(() => setIsFetchingUrl(false));
    } else {
      // Specific quality — point directly at the merged-stream endpoint.
      // The endpoint streams fragmented MP4; no JSON parsing needed.
      setResolvedUrl(buildMergeStreamUrl(videoId, qualityLabel));
    }
  }, [videoId, state.availableQualities, state.selectedQuality, patch]);

  const handleCaptionToggle = useCallback(() =>
    patch({ captionsEnabled: !state.captionsEnabled }), [state.captionsEnabled, patch]);

  const handleCaptionSelect = useCallback((id: string) =>
    patch({ activeCaptionId: id, captionsEnabled: true }), [patch]);

  // ─── Keyboard shortcuts ───────────────────────────────────────────────────

  usePlayerKeyboard({
    enabled: true,
    onPlayPause:     handlePlayPause,
    onSeek:          handleSeekDelta,
    onVolumeToggle:  handleMuteToggle,
    onFullscreen:    handleFullscreen,
    onCaptionToggle: handleCaptionToggle,
    onSpeedChange:   handleSpeedChange,
    getCurrentSpeed: () => state.playbackRate,
  });

  // ─── UI helpers ───────────────────────────────────────────────────────────

  const triggerFeedback = (type: "play" | "pause") => {
    setCenterFeedback(type);
    setFeedbackKey((k) => k + 1);
    setTimeout(() => setCenterFeedback(null), 550);
  };

  const triggerSeekFlash = (dir: "left" | "right") => {
    setSeekFlash(dir);
    if (seekFlashTimer.current) clearTimeout(seekFlashTimer.current);
    seekFlashTimer.current = setTimeout(() => setSeekFlash(null), 600);
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".vp-controls-layer")) return;
    if (activePanel) { setActivePanel(null); return; }
    handlePlayPause();
    showControlsTemporarily();
  };

  const handleVideoDblClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".vp-controls-layer")) return;
    handleFullscreen();
  };

  const handleRetry = () => {
    patch({ error: null, isLoading: true });
    pendingSeekRef.current = null;
    pendingPlayRef.current = false;
    setResolvedUrl(null);
    setIsFetchingUrl(true);
    fetch(buildStreamUrl(videoId))
      .then((r) => r.json())
      .then((data) => {
        const raw = data.proxyUrl ?? data.url;
        if (!raw) throw new Error("No stream URL");
        setResolvedUrl(raw.startsWith("http") ? raw : `${BACKEND_ROOT}${raw}`);
      })
      .catch((e) => patch({ error: e.message, isLoading: false }))
      .finally(() => setIsFetchingUrl(false));
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  const showSpinner = (isFetchingUrl || state.isLoading || state.isWaiting) && !state.error;

  const playerContent = (
    <div
      ref={playerRootRef}
      className="vp-root"
      tabIndex={0}
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => {
        if (state.isPlaying && activePanel === null)
          controlsTimer.current = setTimeout(() => setControlsVisible(false), 500);
      }}
      style={{ cursor: controlsVisible ? "default" : "none" }}
    >
      <div className="vp-aspect" onClick={handleVideoClick} onDoubleClick={handleVideoDblClick}>

        {/* Native <video> */}
        <video ref={videoRef} className="vp-video" poster={poster} playsInline preload="metadata" />

        {/* Top gradient + title */}
        <div className={`vp-gradient-top vp-controls-layer ${controlsVisible ? "visible" : "hidden"}`}>
          {title && <div className="vp-title-bar"><span className="vp-title-text">{title}</span></div>}
        </div>

        {/* Spinner */}
        {showSpinner && (
          <div className="vp-spinner-wrap"><div className="vp-spinner" /></div>
        )}

        {/* Error */}
        {state.error && (
          <div className="vp-error-overlay">
            <AlertTriangle size={36} color="#f87171" />
            <h3>Playback Error</h3>
            <p>{state.error}</p>
            <button className="vp-retry-btn" onClick={handleRetry}>Try again</button>
          </div>
        )}

        {/* PiP indicator */}
        {state.isPiP && (
          <div className="vp-pip-indicator">
            <Tv2 size={32} />
            Playing in Picture-in-Picture
          </div>
        )}

        {/* Play/pause feedback */}
        {centerFeedback && (
          <div className="vp-center-feedback">
            <div className="vp-feedback-icon" key={feedbackKey}>
              {centerFeedback === "play"
                ? <Play size={28} fill="white" />
                : <Pause size={28} fill="white" />}
            </div>
          </div>
        )}

        {/* Seek flash left */}
        <div className={`vp-seek-flash left ${seekFlash === "left" ? "show" : ""}`}>
          <div className="vp-seek-flash-inner">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white" opacity={0.9}>
              <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
            </svg>
            <span>-10s</span>
          </div>
        </div>

        {/* Seek flash right */}
        <div className={`vp-seek-flash right ${seekFlash === "right" ? "show" : ""}`}>
          <div className="vp-seek-flash-inner">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white" opacity={0.9}>
              <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/>
            </svg>
            <span>+10s</span>
          </div>
        </div>

        {/* Controls */}
        {!state.error && (
          <div className={`vp-controls-layer ${controlsVisible ? "visible" : "hidden"}`}>
            <PlayerControls
              state={state}
              captionTracks={captions}
              activePanel={activePanel}
              setActivePanel={setActivePanel}
              onPlayPause={handlePlayPause}
              onSeek={handleSeek}
              onSeekDelta={handleSeekDelta}
              onVolume={handleVolume}
              onMuteToggle={handleMuteToggle}
              onFullscreen={handleFullscreen}
              onTheater={handleTheater}
              onPiP={handlePiP}
              onSpeedChange={handleSpeedChange}
              onQualityChange={handleQualityChange}
              onCaptionToggle={handleCaptionToggle}
              onCaptionSelect={handleCaptionSelect}
              onSeekStart={() => { if (controlsTimer.current) clearTimeout(controlsTimer.current); }}
              onSeekEnd={showControlsTemporarily}
            />
          </div>
        )}
      </div>
    </div>
  );

  if (state.isTheaterMode) {
    return (
      <div className="vp-theater-container"
        onClick={(e) => { if (e.target === e.currentTarget) handleTheater(); }}>
        {playerContent}
      </div>
    );
  }

  return playerContent;
}
