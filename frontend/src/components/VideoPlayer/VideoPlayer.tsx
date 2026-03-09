"use client";

import {
  AlertTriangle,
  Pause,
  Play,
  Tv2,
} from "lucide-react";
import Hls from "hls.js";
import type {
  MouseEvent as ReactMouseEvent,
  TouchEvent as ReactTouchEvent,
} from "react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { FormatMetadata } from "@/lib/api";
import { usePlayerKeyboard } from "@/hooks/usePlayerKeyboard";
import { usePlayerState, type CaptionTrack, type QualityLevel } from "@/hooks/usePlayerState";
import { VideoControls } from "./VideoControls";
import { Watermark } from "./Watermark";
import type { ChapterMarker, PreviewSprite, PreviewThumbnail } from "./ProgressBar";
import "@/styles/player.css";

export interface VideoPlayerProps {
  videoId: string;
  streamUrl?: string;
  title?: string;
  poster?: string;
  captions?: CaptionTrack[];
  formats?: FormatMetadata[];
  chapters?: ChapterMarker[];
  previewThumbnails?: PreviewThumbnail[];
  getPreviewSprite?: (time: number) => PreviewSprite | null;
  onTheaterChange?: (theater: boolean) => void;
  /** Called when the user clicks the mini-player button in the controls bar. */
  onMiniPlayer?: () => void;
  autoPlay?: boolean;
}

const BACKEND_ROOT = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")
  : "";

const API_BASE = `${BACKEND_ROOT}/api/yt`;
const CONTROLS_HIDE_DELAY = 2000;
const DOUBLE_TAP_WINDOW = 280;
const SWIPE_SEEK_SECONDS = 90;
const SWIPE_VOLUME_SCALE = 1.1;

const QUALITY_LABELS = ["144p", "240p", "360p", "480p", "720p", "1080p", "1440p", "2160p"] as const;

type ActivePanel = "speed" | "quality" | "captions" | null;
type SeekDirection = "left" | "right" | null;

function buildStreamUrl(videoId: string, quality?: string) {
  const base = `${API_BASE}/stream/${videoId}`;
  return quality ? `${base}?quality=${encodeURIComponent(quality)}` : base;
}

function buildMergeStreamUrl(videoId: string, quality: string) {
  return `${API_BASE}/merged-stream/${videoId}?quality=${encodeURIComponent(quality)}`;
}

function buildLiveManifestProxyUrl(videoId: string, manifestUrl: string) {
  return `/api/v2/live/${videoId}/manifest?url=${encodeURIComponent(manifestUrl)}`;
}

function normalizePlayableUrl(videoId: string, url: string): string {
  // Relative paths that start with /api/ or /proxy/ are already routed through
  // Next.js rewrites (port 3000 → 4000). Return them as-is so the browser
  // never bypasses the rewrite layer and hits the backend directly (which would
  // trigger CORS errors). This covers the live manifest proxy URL returned by
  // the backend: /api/v2/live/:videoId/manifest?url=...
  if (url.startsWith("/api/") || url.startsWith("/proxy/")) {
    return url;
  }

  const absoluteUrl = url.startsWith("http") ? url : `${BACKEND_ROOT}${url}`;

  try {
    const parsed = new URL(absoluteUrl, typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
    const proxiedUpstream = parsed.pathname === "/proxy/stream"
      ? parsed.searchParams.get("url")
      : null;
    const upstreamUrl = proxiedUpstream ? decodeURIComponent(proxiedUpstream) : absoluteUrl;

    // Segment files (.ts, .aac) should always go through /proxy/stream, never the manifest proxy
    if (upstreamUrl.endsWith(".ts") || upstreamUrl.endsWith(".aac") || /\.(ts|aac)[\?#]/.test(upstreamUrl)) {
      return `/proxy/stream?url=${encodeURIComponent(upstreamUrl)}`;
    }

    // Manifest files (.m3u8) go through the live manifest proxy for URL rewriting
    if (
      upstreamUrl.includes("manifest.googlevideo.com") ||
      upstreamUrl.includes("/api/manifest/") ||
      upstreamUrl.includes(".m3u8")
    ) {
      return buildLiveManifestProxyUrl(videoId, upstreamUrl);
    }
  } catch {
    // ignore URL parsing errors and return original
  }

  return absoluteUrl;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function deriveQualityLevels(formats: FormatMetadata[]): QualityLevel[] {
  const seenHeights = new Set<number>();
  const levels: QualityLevel[] = [];

  formats
    .filter((format) => format.hasVideo && format.height && format.height > 0)
    .sort((a, b) => (b.height ?? 0) - (a.height ?? 0))
    .forEach((format, index) => {
      const height = format.height ?? 0;
      if (seenHeights.has(height)) return;
      seenHeights.add(height);

      levels.push({
        id: index,
        height,
        bitrate: format.bitrate,
        label: QUALITY_LABELS.find((label) => label === `${height}p`) ?? format.qualityLabel ?? `${height}p`,
      });
    });

  return levels;
}

export function VideoPlayer({
  videoId,
  streamUrl: providedStreamUrl,
  title,
  poster,
  captions = [],
  formats = [],
  chapters = [],
  previewThumbnails = [],
  getPreviewSprite,
  onTheaterChange,
  onMiniPlayer,
  autoPlay = true,
}: VideoPlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seekFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSeekRef = useRef<number | null>(null);
  const pendingPlayRef = useRef(false);
  const lastTapRef = useRef<{ side: "left" | "right" | null; time: number }>({ side: null, time: 0 });
  const touchGestureRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    startTime: number;
    startCurrentTime: number;
    startVolume: number;
    mode: "seek" | "volume" | null;
    side: "left" | "right" | null;
  }>({
    active: false,
    startX: 0,
    startY: 0,
    startTime: 0,
    startCurrentTime: 0,
    startVolume: 1,
    mode: null,
    side: null,
  });

  const { state, patch } = usePlayerState();
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(
    providedStreamUrl ? normalizePlayableUrl(videoId, providedStreamUrl) : null
  );
  const [isFetchingUrl, setIsFetchingUrl] = useState(!providedStreamUrl);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [centerFeedback, setCenterFeedback] = useState<"play" | "pause" | null>(null);
  const [seekFlash, setSeekFlash] = useState<SeekDirection>(null);
  const [gestureLabel, setGestureLabel] = useState<string | null>(null);

  useEffect(() => {
    if (formats.length === 0) return;
    const levels = deriveQualityLevels(formats);
    if (levels.length > 0) {
      patch({ availableQualities: levels, activeQualityId: -1, selectedQuality: null });
    }
  }, [formats, patch]);

  useEffect(() => {
    if (providedStreamUrl || !videoId) return;

    let cancelled = false;
    patch({ error: null, isLoading: true });

    fetch(buildStreamUrl(videoId))
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((data) => {
        if (cancelled) return;
        const rawUrl: string | undefined = data.proxyUrl ?? data.url;
        if (!rawUrl) throw new Error("No stream URL in response");
        setResolvedUrl(normalizePlayableUrl(videoId, rawUrl));
      })
      .catch((error: Error) => {
        if (!cancelled) {
          patch({ error: error.message, isLoading: false });
        }
      })
      .finally(() => {
        if (!cancelled) setIsFetchingUrl(false);
      });

    return () => {
      cancelled = true;
    };
  }, [patch, providedStreamUrl, videoId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !resolvedUrl) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    patch({ isLoading: true, error: null });

    // Detect HLS streams. The live manifest proxy URL (/api/v2/live/:id/manifest)
    // doesn't contain "hls" or ".m3u8" in its path, so we also check for "/manifest"
    // and "/live/" to ensure hls.js handles it instead of native <video> src.
    const isHls =
      resolvedUrl.includes(".m3u8") ||
      resolvedUrl.includes("playlist") ||
      resolvedUrl.includes("/manifest") ||
      resolvedUrl.includes("/live/") ||
      resolvedUrl.includes("hls");
    const resumeAt = pendingSeekRef.current;
    const shouldPlay = pendingPlayRef.current || autoPlay;

    pendingSeekRef.current = null;
    pendingPlayRef.current = false;

    const afterLoad = () => {
      if (resumeAt !== null) video.currentTime = resumeAt;
      if (shouldPlay) video.play().catch(() => undefined);
    };

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, backBufferLength: 90 });
      hlsRef.current = hls;
      hls.loadSource(resolvedUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        if (state.availableQualities.length === 0) {
          patch({
            availableQualities: data.levels.map((level, index) => ({
              id: index,
              label: level.height ? `${level.height}p` : `Level ${index + 1}`,
              height: level.height ?? 0,
              bitrate: level.bitrate,
            })),
          });
        }
        afterLoad();
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) return;

        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          hls.startLoad();
          return;
        }

        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
          return;
        }

        patch({ error: "Playback error. Please try again.", isLoading: false });
      });
    } else {
      video.src = resolvedUrl;
      video.load();
      video.addEventListener("loadedmetadata", afterLoad, { once: true });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [autoPlay, patch, resolvedUrl, state.availableQualities.length]);

  const clearControlsTimer = useCallback(() => {
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
  }, []);

  const showControlsTemporarily = useCallback(() => {
    setControlsVisible(true);
    clearControlsTimer();

    if (state.isPlaying && activePanel === null) {
      controlsTimerRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, CONTROLS_HIDE_DELAY);
    }
  }, [activePanel, clearControlsTimer, state.isPlaying]);

  const handlePanelChange = useCallback((panel: ActivePanel) => {
    setActivePanel(panel);
    clearControlsTimer();
    setControlsVisible(true);

    if (panel === null && state.isPlaying) {
      controlsTimerRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, CONTROLS_HIDE_DELAY);
    }
  }, [clearControlsTimer, state.isPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => {
      patch({ isPlaying: true, isEnded: false });
      showControlsTemporarily();
    };
    const onPause = () => {
      patch({ isPlaying: false });
      clearControlsTimer();
      setControlsVisible(true);
    };
    const onEnded = () => {
      patch({ isPlaying: false, isEnded: true });
      clearControlsTimer();
      setControlsVisible(true);
    };
    const onWaiting = () => patch({ isWaiting: true });
    const onCanPlay = () => patch({ isWaiting: false, isLoading: false });
    const onLoadedMetadata = () => patch({ duration: video.duration, isLoading: false });
    const onTimeUpdate = () => {
      patch({ currentTime: video.currentTime });
      if (video.buffered.length > 0) {
        patch({ buffered: video.buffered.end(video.buffered.length - 1) });
      }
    };
    const onVolumeChange = () => patch({ volume: video.volume, isMuted: video.muted });
    const onRateChange = () => patch({ playbackRate: video.playbackRate });
    const onError = () => patch({ error: "Video playback error. The stream may have expired.", isLoading: false });

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("volumechange", onVolumeChange);
    video.addEventListener("ratechange", onRateChange);
    video.addEventListener("error", onError);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("volumechange", onVolumeChange);
      video.removeEventListener("ratechange", onRateChange);
      video.removeEventListener("error", onError);
    };
  }, [clearControlsTimer, patch, showControlsTemporarily]);

  useEffect(() => {
    const onFullscreenChange = () => {
      patch({ isFullscreen: Boolean(document.fullscreenElement) });
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, [patch]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onEnterPip = () => patch({ isPiP: true });
    const onLeavePip = () => patch({ isPiP: false });

    video.addEventListener("enterpictureinpicture", onEnterPip);
    video.addEventListener("leavepictureinpicture", onLeavePip);

    return () => {
      video.removeEventListener("enterpictureinpicture", onEnterPip);
      video.removeEventListener("leavepictureinpicture", onLeavePip);
    };
  }, [patch]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    Array.from(video.querySelectorAll("track")).forEach((track) => track.remove());

    captions.forEach((caption) => {
      const track = document.createElement("track");
      track.kind = "subtitles";
      track.label = caption.label;
      track.srclang = caption.language;
      track.src = caption.src;
      track.dataset.captionId = caption.id;
      video.appendChild(track);
    });
  }, [captions]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const targetId = state.activeCaptionId ?? captions[0]?.id ?? null;
    Array.from(video.querySelectorAll("track")).forEach((element) => {
      const trackElement = element as HTMLTrackElement;
      if (!trackElement.track) return;

      trackElement.track.mode = state.captionsEnabled && trackElement.dataset.captionId === targetId
        ? "showing"
        : "hidden";
    });
  }, [captions, state.activeCaptionId, state.captionsEnabled]);

  useEffect(() => () => {
    clearControlsTimer();
    if (seekFlashTimerRef.current) clearTimeout(seekFlashTimerRef.current);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
  }, [clearControlsTimer]);

  const showFeedback = useCallback((type: "play" | "pause") => {
    setCenterFeedback(type);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => setCenterFeedback(null), 500);
  }, []);

  const showSeekFlash = useCallback((direction: SeekDirection, label: string) => {
    setSeekFlash(direction);
    setGestureLabel(label);

    if (seekFlashTimerRef.current) clearTimeout(seekFlashTimerRef.current);
    seekFlashTimerRef.current = setTimeout(() => {
      setSeekFlash(null);
      setGestureLabel(null);
    }, 700);
  }, []);

  const handlePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => undefined);
      showFeedback("play");
    } else {
      video.pause();
      showFeedback("pause");
    }
  }, [showFeedback]);

  const handleSeek = useCallback((time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = clamp(time, 0, state.duration || Number.MAX_SAFE_INTEGER);
  }, [state.duration]);

  const handleSeekDelta = useCallback((delta: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = clamp(video.currentTime + delta, 0, state.duration || Number.MAX_SAFE_INTEGER);
    showSeekFlash(delta < 0 ? "left" : "right", `${delta > 0 ? "+" : ""}${Math.round(delta)}s`);
    showControlsTemporarily();
  }, [showControlsTemporarily, showSeekFlash, state.duration]);

  const handleVolumeChange = useCallback((value: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = clamp(value, 0, 1);
    if (video.volume > 0) video.muted = false;
  }, []);

  const handleVolumeStep = useCallback((delta: number) => {
    const video = videoRef.current;
    if (!video) return;

    const nextVolume = clamp((video.muted ? 0 : video.volume) + delta, 0, 1);
    video.volume = nextVolume;
    video.muted = nextVolume === 0;
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  const handleMuteToggle = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  }, []);

  const handleFullscreen = useCallback(async () => {
    const root = playerRef.current;
    if (!root) return;

    try {
      if (!document.fullscreenElement) await root.requestFullscreen();
      else await document.exitFullscreen();
    } catch {
      // noop
    }
  }, []);

  const handleTheaterMode = useCallback(() => {
    const nextTheater = !state.isTheaterMode;
    patch({ isTheaterMode: nextTheater });
    onTheaterChange?.(nextTheater);
  }, [onTheaterChange, patch, state.isTheaterMode]);

  const handlePiP = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else if (document.pictureInPictureEnabled) await video.requestPictureInPicture();
    } catch {
      // noop
    }
  }, []);

  const handleSpeedChange = useCallback((rate: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
  }, []);

  const handleQualityChange = useCallback((id: number) => {
    const video = videoRef.current;
    if (!video) return;

    const quality = state.availableQualities.find((level) => level.id === id);
    const qualityLabel = id === -1 ? null : quality ? `${quality.height}p` : null;

    if (qualityLabel === state.selectedQuality) return;

    pendingSeekRef.current = video.currentTime;
    pendingPlayRef.current = !video.paused;
    patch({ activeQualityId: id, selectedQuality: qualityLabel, isLoading: true, error: null });

    if (qualityLabel === null) {
      setIsFetchingUrl(true);
      fetch(buildStreamUrl(videoId))
        .then(async (response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.json();
        })
        .then((data) => {
          const rawUrl: string | undefined = data.proxyUrl ?? data.url;
          if (!rawUrl) throw new Error("No stream URL");
          setResolvedUrl(normalizePlayableUrl(videoId, rawUrl));
        })
        .catch((error: Error) => {
          pendingSeekRef.current = null;
          pendingPlayRef.current = false;
          patch({ error: error.message, isLoading: false });
        })
        .finally(() => setIsFetchingUrl(false));
      return;
    }

    setResolvedUrl(buildMergeStreamUrl(videoId, qualityLabel));
  }, [patch, state.availableQualities, state.selectedQuality, videoId]);

  const handleCaptionsToggle = useCallback(() => {
    patch({ captionsEnabled: !state.captionsEnabled });
  }, [patch, state.captionsEnabled]);

  const handleCaptionSelect = useCallback((id: string) => {
    patch({ activeCaptionId: id, captionsEnabled: true });
  }, [patch]);

  const handleRetry = useCallback(() => {
    patch({ error: null, isLoading: true });
    setResolvedUrl(null);
    setIsFetchingUrl(true);

    fetch(buildStreamUrl(videoId))
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((data) => {
        const rawUrl: string | undefined = data.proxyUrl ?? data.url;
        if (!rawUrl) throw new Error("No stream URL");
        setResolvedUrl(normalizePlayableUrl(videoId, rawUrl));
      })
      .catch((error: Error) => patch({ error: error.message, isLoading: false }))
      .finally(() => setIsFetchingUrl(false));
  }, [patch, videoId]);

  const handleRootTouchStart = useCallback((event: ReactTouchEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest(".vidion-controls")) return;

    const touch = event.touches[0];
    const root = playerRef.current;
    const rect = root?.getBoundingClientRect();
    const side = rect && touch.clientX < rect.left + rect.width / 2 ? "left" : "right";
    const video = videoRef.current;

    touchGestureRef.current = {
      active: true,
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      startCurrentTime: video?.currentTime ?? 0,
      startVolume: video?.muted ? 0 : (video?.volume ?? 1),
      mode: null,
      side,
    };
  }, []);

  const handleRootTouchMove = useCallback((event: ReactTouchEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest(".vidion-controls")) return;

    const gesture = touchGestureRef.current;
    const video = videoRef.current;
    const root = playerRef.current;
    if (!gesture.active || !video || !root) return;

    const touch = event.touches[0];
    const deltaX = touch.clientX - gesture.startX;
    const deltaY = touch.clientY - gesture.startY;
    const rootRect = root.getBoundingClientRect();

    if (!gesture.mode) {
      if (Math.abs(deltaX) > 18 || Math.abs(deltaY) > 18) {
        gesture.mode = Math.abs(deltaX) > Math.abs(deltaY) ? "seek" : "volume";
      } else {
        return;
      }
    }

    event.preventDefault();
    showControlsTemporarily();

    if (gesture.mode === "seek") {
      const deltaSeconds = (deltaX / rootRect.width) * SWIPE_SEEK_SECONDS;
      video.currentTime = clamp(gesture.startCurrentTime + deltaSeconds, 0, state.duration || Number.MAX_SAFE_INTEGER);
      setGestureLabel(`${deltaSeconds >= 0 ? "+" : ""}${Math.round(deltaSeconds)}s`);
      return;
    }

    const nextVolume = clamp(gesture.startVolume - (deltaY / rootRect.height) * SWIPE_VOLUME_SCALE, 0, 1);
    video.volume = nextVolume;
    video.muted = nextVolume === 0;
    setGestureLabel(`Vol ${Math.round(nextVolume * 100)}%`);
  }, [showControlsTemporarily, state.duration]);

  const handleRootTouchEnd = useCallback(() => {
    const gesture = touchGestureRef.current;
    if (!gesture.active) return;

    const now = Date.now();
    const interactionDuration = now - gesture.startTime;
    const wasSwipe = gesture.mode !== null;

    if (!wasSwipe && interactionDuration < DOUBLE_TAP_WINDOW && gesture.side) {
      const lastTap = lastTapRef.current;
      if (lastTap.side === gesture.side && now - lastTap.time < DOUBLE_TAP_WINDOW) {
        handleSeekDelta(gesture.side === "left" ? -10 : 10);
        lastTapRef.current = { side: null, time: 0 };
      } else {
        lastTapRef.current = { side: gesture.side, time: now };
        window.setTimeout(() => {
          if (lastTapRef.current.time === now) {
            showControlsTemporarily();
          }
        }, DOUBLE_TAP_WINDOW);
      }
    }

    if (wasSwipe) {
      window.setTimeout(() => setGestureLabel(null), 450);
    }

    touchGestureRef.current.active = false;
    touchGestureRef.current.mode = null;
  }, [handleSeekDelta, showControlsTemporarily]);

  usePlayerKeyboard({
    enabled: true,
    onPlayPause: handlePlayPause,
    onSeek: handleSeekDelta,
    onVolumeToggle: handleMuteToggle,
    onFullscreen: handleFullscreen,
    onCaptionToggle: handleCaptionsToggle,
    onSpeedChange: handleSpeedChange,
    onVolumeStep: handleVolumeStep,
    getCurrentSpeed: () => state.playbackRate,
  });

  const handleVideoClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest(".vidion-controls, .vidion-watermark")) return;

    if (activePanel) {
      setActivePanel(null);
      return;
    }

    handlePlayPause();
    showControlsTemporarily();
  };

  const handleVideoDoubleClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest(".vidion-controls, .vidion-watermark")) return;
    handleFullscreen();
  };

  const playerClasses = useMemo(() => [
    "vidion-player",
    controlsVisible ? "controls-visible" : "controls-hidden",
    state.isFullscreen ? "is-fullscreen" : "",
  ].filter(Boolean).join(" "), [controlsVisible, state.isFullscreen]);

  const showSpinner = (isFetchingUrl || state.isLoading || state.isWaiting) && !state.error;

  const playerNode = (
    <div
      ref={playerRef}
      className={playerClasses}
      tabIndex={0}
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => {
        if (state.isPlaying && activePanel === null) {
          clearControlsTimer();
          controlsTimerRef.current = setTimeout(() => setControlsVisible(false), 250);
        }
      }}
      style={{ cursor: controlsVisible ? "default" : "none" }}
    >
      <div
        className="vidion-player-stage"
        onClick={handleVideoClick}
        onDoubleClick={handleVideoDoubleClick}
        onTouchStart={handleRootTouchStart}
        onTouchMove={handleRootTouchMove}
        onTouchEnd={handleRootTouchEnd}
      >
        <video
          ref={videoRef}
          className="vidion-player-video"
          poster={poster}
          playsInline
          preload="metadata"
        />

        <div className="vidion-player-shade vidion-player-shade-top" />
        <div className="vidion-player-shade vidion-player-shade-bottom" />
        <div className="vidion-player-vignette" />

        {title ? (
          <div className={`vidion-player-header ${controlsVisible ? "is-visible" : ""}`}>
            <div className="vidion-player-title">{title}</div>
          </div>
        ) : null}

        {showSpinner ? (
          <div className="vidion-player-spinner-shell">
            <div className="vidion-player-spinner" />
          </div>
        ) : null}

        {state.error ? (
          <div className="vidion-player-error">
            <AlertTriangle size={34} />
            <h3>Playback error</h3>
            <p>{state.error}</p>
            <button type="button" className="vidion-error-button" onClick={handleRetry}>
              Try again
            </button>
          </div>
        ) : null}

        {centerFeedback ? (
          <div className="vidion-feedback-shell">
            <div className="vidion-feedback-badge">
              {centerFeedback === "play" ? <Play size={28} fill="currentColor" /> : <Pause size={28} />}
            </div>
          </div>
        ) : null}

        <div className={`vidion-skip-flash is-left ${seekFlash === "left" ? "is-visible" : ""}`}>
          <div className="vidion-skip-flash-badge">{gestureLabel ?? "-10s"}</div>
        </div>
        <div className={`vidion-skip-flash is-right ${seekFlash === "right" ? "is-visible" : ""}`}>
          <div className="vidion-skip-flash-badge">{gestureLabel ?? "+10s"}</div>
        </div>

        {gestureLabel && !seekFlash ? (
          <div className="vidion-gesture-indicator">{gestureLabel}</div>
        ) : null}

        {state.isPiP ? (
          <div className="vidion-pip-indicator">
            <Tv2 size={18} />
            <span>Playing in Picture-in-Picture</span>
          </div>
        ) : null}

        {!state.error ? (
          <div className={`vidion-controls-layer ${controlsVisible ? "is-visible" : ""}`}>
            <VideoControls
              state={state}
              captions={captions}
              activePanel={activePanel}
              onPanelChange={handlePanelChange}
              onPlayPause={handlePlayPause}
              onSeek={handleSeek}
              onSeekDelta={handleSeekDelta}
              onMuteToggle={handleMuteToggle}
              onVolumeChange={handleVolumeChange}
              onFullscreen={handleFullscreen}
              onTheaterMode={handleTheaterMode}
              onPiP={handlePiP}
              onMiniPlayer={onMiniPlayer}
              onSpeedChange={handleSpeedChange}
              onQualityChange={handleQualityChange}
              onCaptionsToggle={handleCaptionsToggle}
              onCaptionSelect={handleCaptionSelect}
              chapterMarkers={chapters}
              previewThumbnails={previewThumbnails}
              getPreviewSprite={getPreviewSprite}
              onSeekStart={clearControlsTimer}
              onSeekEnd={showControlsTemporarily}
            />
          </div>
        ) : null}

        <Watermark />
      </div>
    </div>
  );

  if (state.isTheaterMode) {
    return (
      <div
        className="vidion-theater-shell"
        onClick={(event) => {
          if (event.target === event.currentTarget) handleTheaterMode();
        }}
      >
        {playerNode}
      </div>
    );
  }

  return playerNode;
}
