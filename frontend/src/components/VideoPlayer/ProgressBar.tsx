"use client";

import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from "react";
import { useCallback, useMemo, useRef, useState } from "react";

export interface ChapterMarker {
  time: number;
  label?: string;
}

export interface PreviewThumbnail {
  time: number;
  src: string;
  alt?: string;
}

export interface PreviewSprite {
  imageUrl: string;
  frameWidth: number;
  frameHeight: number;
  backgroundPosition: string;
  backgroundSize: string;
  alt?: string;
}

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  buffered: number;
  chapterMarkers?: ChapterMarker[];
  previewThumbnails?: PreviewThumbnail[];
  getPreviewSprite?: (time: number) => PreviewSprite | null;
  onSeek: (time: number) => void;
  onSeekStart?: () => void;
  onSeekEnd?: () => void;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function ProgressBar({
  currentTime,
  duration,
  buffered,
  chapterMarkers = [],
  previewThumbnails = [],
  getPreviewSprite,
  onSeek,
  onSeekStart,
  onSeekEnd,
}: ProgressBarProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverX, setHoverX] = useState(0);
  const [hoverTime, setHoverTime] = useState(0);
  const [hoverPercent, setHoverPercent] = useState(0);
  const [trackWidth, setTrackWidth] = useState(0);

  const playedPercent = duration > 0 ? clamp((currentTime / duration) * 100, 0, 100) : 0;
  const bufferedPercent = duration > 0 ? clamp((buffered / duration) * 100, 0, 100) : 0;

  const activeThumbnail = useMemo(() => {
    if (previewThumbnails.length === 0) return null;

    return previewThumbnails.reduce<PreviewThumbnail | null>((closest, candidate) => {
      if (!closest) return candidate;
      const currentDelta = Math.abs(candidate.time - hoverTime);
      const bestDelta = Math.abs(closest.time - hoverTime);
      return currentDelta < bestDelta ? candidate : closest;
    }, null);
  }, [hoverTime, previewThumbnails]);

  const activePreviewSprite = useMemo(
    () => (getPreviewSprite ? getPreviewSprite(hoverTime) : null),
    [getPreviewSprite, hoverTime]
  );

  const activeChapterLabel = useMemo(() => {
    if (chapterMarkers.length === 0 || duration <= 0) return null;

    const closest = chapterMarkers.reduce<ChapterMarker | null>((best, chapter) => {
      if (!best) return chapter;
      const bestDistance = Math.abs((best.time / duration) * 100 - hoverPercent);
      const currentDistance = Math.abs((chapter.time / duration) * 100 - hoverPercent);
      return currentDistance < bestDistance ? chapter : best;
    }, null);

    if (!closest?.label) return null;
    const distance = Math.abs((closest.time / duration) * 100 - hoverPercent);
    return distance <= 2.4 ? closest.label : null;
  }, [chapterMarkers, duration, hoverPercent]);

  const getSeekData = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track || duration <= 0) {
        return { time: 0, x: 0, percent: 0, width: 0 };
      }

      const rect = track.getBoundingClientRect();
      const x = clamp(clientX - rect.left, 0, rect.width);
      const percent = rect.width > 0 ? x / rect.width : 0;
      return {
        x,
        percent,
        time: percent * duration,
        width: rect.width,
      };
    },
    [duration]
  );

  const updateHoverState = useCallback(
    (clientX: number) => {
      const data = getSeekData(clientX);
      setHoverX(data.x);
      setHoverTime(data.time);
      setHoverPercent(data.percent * 100);
      setTrackWidth(data.width);
      return data;
    },
    [getSeekData]
  );

  const finishDrag = useCallback(() => {
    setIsDragging(false);
    onSeekEnd?.();
  }, [onSeekEnd]);

  const startDrag = useCallback((clientX: number) => {
    setIsDragging(true);
    onSeekStart?.();
    const data = updateHoverState(clientX);
    onSeek(data.time);
  }, [onSeek, onSeekStart, updateHoverState]);

  const handleMouseMove = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    const data = updateHoverState(event.clientX);
    if (isDragging) onSeek(data.time);
  }, [isDragging, onSeek, updateHoverState]);

  const handleMouseDown = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    startDrag(event.clientX);

    const handleWindowMove = (moveEvent: MouseEvent) => {
      const data = updateHoverState(moveEvent.clientX);
      onSeek(data.time);
    };

    const handleWindowUp = () => {
      finishDrag();
      window.removeEventListener("mousemove", handleWindowMove);
      window.removeEventListener("mouseup", handleWindowUp);
    };

    window.addEventListener("mousemove", handleWindowMove);
    window.addEventListener("mouseup", handleWindowUp, { once: true });
  }, [finishDrag, onSeek, startDrag, updateHoverState]);

  const handleTouchStart = useCallback((event: ReactTouchEvent<HTMLDivElement>) => {
    startDrag(event.touches[0].clientX);
  }, [startDrag]);

  const handleTouchMove = useCallback((event: ReactTouchEvent<HTMLDivElement>) => {
    const data = updateHoverState(event.touches[0].clientX);
    onSeek(data.time);
  }, [onSeek, updateHoverState]);

  const tooltipPosition = clamp(hoverX, 56, Math.max(trackWidth - 56, 56));

  return (
    <div
      ref={trackRef}
      className={`vidion-progress ${isDragging ? "is-dragging" : ""}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={finishDrag}
      role="slider"
      aria-label="Seek video"
      aria-valuemin={0}
      aria-valuemax={Math.floor(duration || 0)}
      aria-valuenow={Math.floor(currentTime || 0)}
      aria-valuetext={formatTime(currentTime)}
    >
      {(isHovering || isDragging) && duration > 0 ? (
        <div className="vidion-progress-preview" style={{ left: tooltipPosition }}>
          {activeChapterLabel ? (
            <div className="vidion-progress-chapter-label">{activeChapterLabel}</div>
          ) : null}
          {activePreviewSprite ? (
            <div
              className="vidion-progress-preview-image is-sprite"
              role="img"
              aria-label={activePreviewSprite.alt ?? `Preview at ${formatTime(hoverTime)}`}
              style={{
                width: activePreviewSprite.frameWidth,
                height: activePreviewSprite.frameHeight,
                backgroundImage: `url("${activePreviewSprite.imageUrl}")`,
                backgroundPosition: activePreviewSprite.backgroundPosition,
                backgroundSize: activePreviewSprite.backgroundSize,
              }}
            />
          ) : activeThumbnail ? (
            <div
              className="vidion-progress-preview-image"
              role="img"
              aria-label={activeThumbnail.alt ?? `Preview at ${formatTime(hoverTime)}`}
              style={{ backgroundImage: `url("${activeThumbnail.src}")` }}
            />
          ) : null}
          <div className="vidion-progress-preview-time">{formatTime(hoverTime)}</div>
        </div>
      ) : null}

      <div className="vidion-progress-track">
        <div className="vidion-progress-buffered" style={{ width: `${bufferedPercent}%` }} />
        <div className="vidion-progress-played" style={{ width: `${playedPercent}%` }} />

        {chapterMarkers
          .filter((marker) => marker.time > 0 && marker.time < duration)
          .map((marker) => (
            <span
              key={`${marker.time}-${marker.label ?? "chapter"}`}
              className="vidion-progress-marker"
              style={{ left: `${(marker.time / duration) * 100}%` }}
              title={marker.label}
            />
          ))}
      </div>

      <div className="vidion-progress-scrubber" style={{ left: `${playedPercent}%` }} />
    </div>
  );
}
