"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Volume2, VolumeX, Captions } from "lucide-react";

interface HoverVideoPlayerProps {
  videoId: string;
  thumbnailUrl: string;
  isHovered: boolean;
  imageClassName?: string;
  disableAutoplay?: boolean;
}

/**
 * Hover-to-preview video player.
 *
 * Flow:
 *  1. User hovers a card → after a delay, fetch the proxy URL from the backend
 *  2. Backend deciphers the YouTube stream URL and returns a local proxy path
 *  3. We set the proxy path as the <video> src — this avoids CORS issues
 *  4. On mouse-leave, tear down the video to free memory
 */
export function HoverVideoPlayer({
  videoId,
  thumbnailUrl,
  isHovered,
  imageClassName = "h-full w-full object-cover",
  disableAutoplay = false,
}: HoverVideoPlayerProps) {
  const [proxyUrl, setProxyUrl] = useState<string | null>(null);
  const [shouldPlay, setShouldPlay] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showCaptions, setShowCaptions] = useState(false);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Cache resolved proxy URLs to avoid refetching on re-hover
  const cacheRef = useRef<Map<string, string>>(new Map());

  const cleanup = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setShouldPlay(false);
    setHasError(false);
    // Reset video element to free memory
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute("src");
      videoRef.current.load();
    }
  }, []);

  useEffect(() => {
    if (isHovered) {
      if (disableAutoplay) {
        // When autoplay is disabled, we don't fetch or play video
        setShouldPlay(false);
        setProxyUrl(null);
        return;
      }

      // Delay before initiating preview to skip quick hover-overs
      hoverTimerRef.current = setTimeout(async () => {
        // Check cache first
        const cached = cacheRef.current.get(videoId);
        if (cached) {
          setProxyUrl(cached);
          setShouldPlay(true);
          return;
        }

        // Fetch the stream proxy URL from backend
        const controller = new AbortController();
        abortRef.current = controller;

        try {
          const res = await fetch(
            `/api/yt/stream/${videoId}?quality=144p`,
            { signal: controller.signal }
          );

          if (!res.ok) {
            setHasError(true);
            return;
          }

          const data = await res.json();
          const url = data.proxyUrl as string | undefined;

          if (!url) {
            setHasError(true);
            return;
          }

          cacheRef.current.set(videoId, url);
          setProxyUrl(url);
          setShouldPlay(true);
        } catch (err: unknown) {
          // AbortError is expected when the user un-hovers quickly
          if (err instanceof DOMException && err.name === "AbortError") return;
          setHasError(true);
        }
      }, 600); // 600ms delay — long enough to skip incidental hovers
    } else {
      cleanup();
    }

    return cleanup;
  }, [isHovered, videoId, disableAutoplay, cleanup]);

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMuted((m) => !m);
  };

  const handleCaptionToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowCaptions((c) => !c);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      {/* Always render thumbnail as base layer */}
      <img
        src={thumbnailUrl}
        alt=""
        className={imageClassName}
        loading="lazy"
        draggable={false}
      />

      {/* Video overlay — only when ready */}
      {shouldPlay && proxyUrl && !hasError && (
        <>
          <video
            ref={videoRef}
            src={proxyUrl}
            autoPlay
            muted={isMuted}
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => {
              setShouldPlay(false);
              setHasError(true);
            }}
          >
            {showCaptions && (
              <track
                src={`/api/yt/captions/${videoId}?lang=en&kind=asr`}
                kind="captions"
                srcLang="en"
                label="English"
                default
              />
            )}
          </video>

          {/* Control buttons - only show when video is playing */}
          <div className="absolute right-2.5 top-2.5 z-20 flex flex-col gap-2">
            <button
              onClick={handleMuteToggle}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 hover:scale-110 ${
                isMuted
                  ? "bg-black/60 text-white/80 hover:bg-black/80"
                  : "bg-white/90 text-black hover:bg-white"
              }`}
              title={isMuted ? "Unmute" : "Mute"}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>

            <button
              onClick={handleCaptionToggle}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 hover:scale-110 ${
                showCaptions
                  ? "bg-white/90 text-black"
                  : "bg-black/60 text-white/80 hover:bg-black/80"
              }`}
              title={showCaptions ? "Hide captions" : "Show captions"}
              aria-label={showCaptions ? "Hide captions" : "Show captions"}
            >
              <Captions className="h-6 w-6" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
