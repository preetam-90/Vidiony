"use client";

import React, { useCallback } from "react";
import {
  Play, Pause, Volume2, VolumeX, Volume1,
  Maximize, Minimize, PictureInPicture2, PictureInPicture,
  Captions, CaptionsOff, Settings, MonitorPlay,
  SkipBack, SkipForward, Gauge,
} from "lucide-react";
import { ProgressBar } from "./ProgressBar";
import { SpeedSelector } from "./SpeedSelector";
import { QualitySelector } from "./QualitySelector";
import { CaptionToggle } from "./CaptionToggle";
import type { PlayerState, CaptionTrack, QualityLevel } from "@/hooks/usePlayerState";

function formatTime(secs: number): string {
  if (!isFinite(secs) || isNaN(secs)) return "0:00";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

type ActivePanel = "speed" | "quality" | "captions" | null;

interface PlayerControlsProps {
  state: PlayerState;
  captionTracks: CaptionTrack[];
  activePanel: ActivePanel;
  setActivePanel: (p: ActivePanel) => void;

  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onSeekDelta: (delta: number) => void;
  onVolume: (v: number) => void;
  onMuteToggle: () => void;
  onFullscreen: () => void;
  onTheater: () => void;
  onPiP: () => void;
  onSpeedChange: (rate: number) => void;
  onQualityChange: (id: number) => void;
  onCaptionToggle: () => void;
  onCaptionSelect: (id: string) => void;
  onSeekStart?: () => void;
  onSeekEnd?: () => void;
}

export function PlayerControls({
  state,
  captionTracks,
  activePanel,
  setActivePanel,

  onPlayPause,
  onSeek,
  onSeekDelta,
  onVolume,
  onMuteToggle,
  onFullscreen,
  onTheater,
  onPiP,
  onSpeedChange,
  onQualityChange,
  onCaptionToggle,
  onCaptionSelect,
  onSeekStart,
  onSeekEnd,
}: PlayerControlsProps) {
  const {
    isPlaying, isMuted, volume, currentTime, duration, buffered,
    playbackRate, isFullscreen, isTheaterMode, isPiP,
    captionsEnabled, activeCaptionId, activeQualityId, availableQualities,
  } = state;

  const volPct = isMuted ? 0 : volume * 100;

  const VolumeIcon =
    isMuted || volume === 0 ? VolumeX
    : volume < 0.5 ? Volume1
    : Volume2;

  const togglePanel = useCallback(
    (panel: ActivePanel) => setActivePanel(activePanel === panel ? null : panel),
    [activePanel, setActivePanel]
  );

  return (
    <div
      className="vp-controls-inner"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top gradient + title handled externally */}
      <div className="vp-gradient-bottom" />

      {/* Progress bar */}
      <ProgressBar
        currentTime={currentTime}
        duration={duration}
        buffered={buffered}
        onSeek={onSeek}
        onSeekStart={onSeekStart}
        onSeekEnd={onSeekEnd}
      />

      {/* Control bar */}
      <div className="vp-control-bar">
        {/* Play / Pause */}
        <button className="vp-btn" onClick={onPlayPause} title={isPlaying ? "Pause (K)" : "Play (K)"}>
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>

        {/* Rewind */}
        <button className="vp-btn" onClick={() => onSeekDelta(-10)} title="Rewind 10s (J)">
          <SkipBack size={16} />
        </button>

        {/* Forward */}
        <button className="vp-btn" onClick={() => onSeekDelta(10)} title="Forward 10s (L)">
          <SkipForward size={16} />
        </button>

        {/* Volume */}
        <div className="vp-volume-group">
          <button className="vp-btn" onClick={onMuteToggle} title="Mute (M)">
            <VolumeIcon size={18} />
          </button>
          <div
            className="vp-volume-slider-wrap"
            style={{ ["--vp-vol" as string]: `${volPct}%` }}
          >
            <input
              type="range"
              className="vp-volume-slider"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolume(parseFloat(e.target.value))}
              style={{ ["--vp-vol" as string]: `${volPct}%` }}
            />
          </div>
        </div>

        {/* Time */}
        <span className="vp-time">
          {formatTime(currentTime)}
          <span className="vp-time-sep"> / </span>
          {formatTime(duration)}
        </span>

        <div className="vp-spacer" />

        {/* Speed indicator (click to open) */}
        {playbackRate !== 1 && (
          <button
            className="vp-btn"
            style={{ fontSize: 11, fontWeight: 700, width: "auto", padding: "0 6px", gap: 2 }}
            onClick={() => togglePanel("speed")}
            title="Playback speed"
          >
            <Gauge size={13} />{playbackRate}×
          </button>
        )}

        {/* Captions */}
        <button
          className={`vp-btn ${captionsEnabled ? "active" : ""}`}
          data-captions-on={captionsEnabled ? "true" : "false"}
          onClick={() => togglePanel("captions")}
          title="Captions (C)"
        >
          {captionsEnabled ? <Captions size={18} /> : <CaptionsOff size={18} />}
        </button>

        {/* Settings / Speed */}
        <button
          className={`vp-btn ${activePanel === "speed" ? "active" : ""}`}
          onClick={() => togglePanel("speed")}
          title="Playback speed"
        >
          <Settings size={16} />
        </button>

        {/* Quality selector — shown whenever we have levels (MP4 or HLS) */}
        {availableQualities.length > 0 && (
          <button
            className={`vp-btn ${activePanel === "quality" ? "active" : ""}`}
            onClick={() => togglePanel("quality")}
            title="Quality"
            style={{ fontSize: 10, fontWeight: 700, width: "auto", padding: "0 8px", letterSpacing: "0.04em" }}
          >
            {activeQualityId === -1
              ? "AUTO"
              : (availableQualities.find((q) => q.id === activeQualityId)?.label ?? "AUTO")}
          </button>
        )}

        {/* Theater mode */}
        <button
          className={`vp-btn ${isTheaterMode ? "active" : ""}`}
          onClick={onTheater}
          title="Theater mode (T)"
        >
          <MonitorPlay size={16} />
        </button>

        {/* PiP */}
        <button
          className={`vp-btn ${isPiP ? "active" : ""}`}
          onClick={onPiP}
          title="Picture in Picture"
        >
          {isPiP ? <PictureInPicture size={16} /> : <PictureInPicture2 size={16} />}
        </button>

        {/* Fullscreen */}
        <button className="vp-btn" onClick={onFullscreen} title="Fullscreen (F)">
          {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
        </button>
      </div>

      {/* Popup panels */}
      {activePanel === "speed" && (
        <SpeedSelector
          current={playbackRate}
          onChange={onSpeedChange}
          onClose={() => setActivePanel(null)}
        />
      )}

      {activePanel === "quality" && availableQualities.length > 0 && (
        <QualitySelector
          levels={availableQualities}
          activeId={activeQualityId}
          onChange={onQualityChange}
          onClose={() => setActivePanel(null)}
        />
      )}

      {activePanel === "captions" && (
        <CaptionToggle
          tracks={captionTracks}
          enabled={captionsEnabled}
          activeId={activeCaptionId}
          onToggle={onCaptionToggle}
          onSelect={onCaptionSelect}
          onClose={() => setActivePanel(null)}
        />
      )}
    </div>
  );
}
