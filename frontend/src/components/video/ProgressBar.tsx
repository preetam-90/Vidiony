"use client";

import React, { useRef, useState, useCallback } from "react";

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  buffered: number;
  onSeek: (time: number) => void;
  onSeekStart?: () => void;
  onSeekEnd?: () => void;
}

function formatTime(secs: number): string {
  if (!isFinite(secs) || isNaN(secs)) return "0:00";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function ProgressBar({
  currentTime,
  duration,
  buffered,
  onSeek,
  onSeekStart,
  onSeekEnd,
}: ProgressBarProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);
  const [hoverX, setHoverX] = useState(0);
  const [hoverTime, setHoverTime] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const pct = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;
  const bufPct = duration > 0 ? Math.min((buffered / duration) * 100, 100) : 0;

  const getTimeFromEvent = useCallback(
    (e: React.MouseEvent | MouseEvent): number => {
      if (!trackRef.current) return 0;
      const rect = trackRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      return ratio * duration;
    },
    [duration]
  );

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clampedX = Math.max(0, Math.min(rect.width, x));
    setHoverX(clampedX);
    setHoverTime(getTimeFromEvent(e));
    if (isDragging) onSeek(getTimeFromEvent(e));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    onSeekStart?.();
    onSeek(getTimeFromEvent(e));

    const handleGlobalMove = (me: MouseEvent) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (me.clientX - rect.left) / rect.width));
      onSeek(ratio * duration);
      const x = me.clientX - rect.left;
      setHoverX(Math.max(0, Math.min(rect.width, x)));
      setHoverTime(ratio * duration);
    };

    const handleGlobalUp = () => {
      setIsDragging(false);
      onSeekEnd?.();
      window.removeEventListener("mousemove", handleGlobalMove);
      window.removeEventListener("mouseup", handleGlobalUp);
    };

    window.addEventListener("mousemove", handleGlobalMove);
    window.addEventListener("mouseup", handleGlobalUp);
  };

  // Touch support
  const handleTouchStart = (e: React.TouchEvent) => {
    onSeekStart?.();
    const touch = e.touches[0];
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
    onSeek(ratio * duration);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
    onSeek(ratio * duration);
  };

  // Tooltip clamping so it doesn't overflow edges
  const tooltipOffset = (() => {
    if (!trackRef.current) return hoverX;
    const w = trackRef.current.getBoundingClientRect().width;
    return Math.max(30, Math.min(w - 30, hoverX));
  })();

  return (
    <div
      className="vp-progress-wrapper"
      ref={trackRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => { setHovering(false); }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={onSeekEnd}
    >
      {/* Tooltip */}
      {hovering && duration > 0 && (
        <div
          className="vp-progress-tooltip"
          style={{ left: tooltipOffset }}
        >
          {formatTime(hoverTime)}
        </div>
      )}

      {/* Track */}
      <div className="vp-progress-track">
        {/* Buffered */}
        <div className="vp-progress-buffered" style={{ width: `${bufPct}%` }} />
        {/* Played */}
        <div className="vp-progress-played" style={{ width: `${pct}%` }} />
      </div>

      {/* Thumb */}
      <div
        className="vp-progress-thumb"
        style={{ left: `calc(${pct}% + 16px)` }}
      />
    </div>
  );
}
