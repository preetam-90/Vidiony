"use client";

import {
  Captions,
  CaptionsOff,
  Maximize,
  Minimize,
  MonitorPlay,
  Pause,
  PictureInPicture,
  PictureInPicture2,
  Play,
  RectangleHorizontal,
  Settings2,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { ProgressBar, type ChapterMarker, type PreviewSprite, type PreviewThumbnail } from "./ProgressBar";
import { VolumeControl } from "./VolumeControl";
import { QualityMenu } from "./QualityMenu";
import { SpeedMenu } from "./SpeedMenu";
import type { CaptionTrack, PlayerState } from "@/hooks/usePlayerState";

interface VideoControlsProps {
  state: PlayerState;
  captions: CaptionTrack[];
  activePanel: "speed" | "quality" | "captions" | null;
  onPanelChange: (panel: "speed" | "quality" | "captions" | null) => void;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onSeekDelta: (delta: number) => void;
  onMuteToggle: () => void;
  onVolumeChange: (value: number) => void;
  onFullscreen: () => void;
  onTheaterMode: () => void;
  onPiP: () => void;
  /** Activates the floating mini player (keyboard shortcut: i) */
  onMiniPlayer?: () => void;
  onSpeedChange: (rate: number) => void;
  onQualityChange: (id: number) => void;
  onCaptionsToggle: () => void;
  onCaptionSelect: (id: string) => void;
  chapterMarkers?: ChapterMarker[];
  previewThumbnails?: PreviewThumbnail[];
  getPreviewSprite?: (time: number) => PreviewSprite | null;
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

export function VideoControls({
  state,
  captions,
  activePanel,
  onPanelChange,
  onPlayPause,
  onSeek,
  onSeekDelta,
  onMuteToggle,
  onVolumeChange,
  onFullscreen,
  onTheaterMode,
  onPiP,
  onMiniPlayer,
  onSpeedChange,
  onQualityChange,
  onCaptionsToggle,
  onCaptionSelect,
  chapterMarkers,
  previewThumbnails,
  getPreviewSprite,
  onSeekStart,
  onSeekEnd,
}: VideoControlsProps) {
  const activeQuality = state.availableQualities.find((quality) => quality.id === state.activeQualityId);
  const togglePanel = (panel: "speed" | "quality" | "captions") => {
    onPanelChange(activePanel === panel ? null : panel);
  };

  return (
    <div className="vidion-controls" onClick={(event) => event.stopPropagation()}>
      <div className="vidion-controls-backdrop" />

      <div className="vidion-controls-bottom">
        <ProgressBar
          currentTime={state.currentTime}
          duration={state.duration}
          buffered={state.buffered}
          chapterMarkers={chapterMarkers}
          previewThumbnails={previewThumbnails}
          getPreviewSprite={getPreviewSprite}
          onSeek={onSeek}
          onSeekStart={onSeekStart}
          onSeekEnd={onSeekEnd}
        />

        <div className="vidion-controls-row">
          <div className="vidion-controls-group vidion-controls-group-left">
            <button
              type="button"
              className="vidion-icon-button"
              onClick={onPlayPause}
              aria-label={state.isPlaying ? "Pause" : "Play"}
              title="Play/Pause (Space)"
            >
              {state.isPlaying ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
            </button>

            <button
              type="button"
              className="vidion-icon-button"
              onClick={() => onSeekDelta(-10)}
              aria-label="Skip backward 10 seconds"
              title="Skip backward 10 seconds"
            >
              <SkipBack size={18} />
            </button>

            <button
              type="button"
              className="vidion-icon-button"
              onClick={() => onSeekDelta(10)}
              aria-label="Skip forward 10 seconds"
              title="Skip forward 10 seconds"
            >
              <SkipForward size={18} />
            </button>

            <VolumeControl
              isMuted={state.isMuted}
              volume={state.volume}
              onToggleMute={onMuteToggle}
              onVolumeChange={onVolumeChange}
            />

            <div className="vidion-time-display" aria-live="off">
              <span>{formatTime(state.currentTime)}</span>
              <span className="vidion-time-divider">/</span>
              <span>{formatTime(state.duration)}</span>
            </div>
          </div>

          <div className="vidion-controls-group vidion-controls-group-right">
            <button
              type="button"
              className={`vidion-chip-button ${activePanel === "speed" ? "is-active" : ""}`}
              onClick={() => togglePanel("speed")}
              title="Playback speed"
            >
              <Settings2 size={14} />
              <span>{state.playbackRate === 1 ? "1×" : `${state.playbackRate}×`}</span>
            </button>

            {state.availableQualities.length > 0 ? (
              <button
                type="button"
                className={`vidion-chip-button ${activePanel === "quality" ? "is-active" : ""}`}
                onClick={() => togglePanel("quality")}
                title="Quality"
              >
                <span>{activeQuality?.label ?? "Auto"}</span>
              </button>
            ) : null}

            <button
              type="button"
              className={`vidion-icon-button ${state.captionsEnabled ? "is-active" : ""}`}
              onClick={() => togglePanel("captions")}
              aria-label="Subtitles"
              title="Subtitles"
            >
              {state.captionsEnabled ? <Captions size={18} /> : <CaptionsOff size={18} />}
            </button>

            <button
              type="button"
              className={`vidion-icon-button ${state.isPiP ? "is-active" : ""}`}
              onClick={onPiP}
              aria-label="Picture in picture"
              title="Picture in picture"
            >
              {state.isPiP ? <PictureInPicture size={18} /> : <PictureInPicture2 size={18} />}
            </button>

            {/* ── Mini player toggle ────────────────────────────────────── */}
            {onMiniPlayer ? (
              <button
                type="button"
                className="vidion-icon-button"
                onClick={onMiniPlayer}
                aria-label="Mini player"
                title="Mini player (i)"
              >
                <RectangleHorizontal size={18} />
              </button>
            ) : null}

            <button
              type="button"
              className={`vidion-icon-button ${state.isTheaterMode ? "is-active" : ""}`}
              onClick={onTheaterMode}
              aria-label="Theater mode"
              title="Theater mode"
            >
              <MonitorPlay size={18} />
            </button>

            <button
              type="button"
              className="vidion-icon-button"
              onClick={onFullscreen}
              aria-label={state.isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              title="Fullscreen (F)"
            >
              {state.isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>
      </div>

      {activePanel === "speed" ? (
        <div className="vidion-floating-menu vidion-floating-menu-right">
          <SpeedMenu current={state.playbackRate} onChange={onSpeedChange} onClose={() => onPanelChange(null)} />
        </div>
      ) : null}

      {activePanel === "quality" && state.availableQualities.length > 0 ? (
        <div className="vidion-floating-menu vidion-floating-menu-right">
          <QualityMenu
            levels={state.availableQualities}
            activeId={state.activeQualityId}
            onChange={onQualityChange}
            onClose={() => onPanelChange(null)}
          />
        </div>
      ) : null}

      {activePanel === "captions" ? (
        <div className="vidion-floating-menu vidion-floating-menu-right">
          <div className="vidion-menu" role="menu" aria-label="Subtitles">
            <div className="vidion-menu-header">Subtitles</div>

            <button
              type="button"
              className={`vidion-menu-item ${!state.captionsEnabled ? "is-active" : ""}`}
              onClick={() => {
                if (state.captionsEnabled) onCaptionsToggle();
                onPanelChange(null);
              }}
            >
              <CaptionsOff size={14} />
              <span>Off</span>
            </button>

            {captions.length > 0 ? captions.map((caption) => {
              const isActive = state.captionsEnabled && state.activeCaptionId === caption.id;

              return (
                <button
                  key={caption.id}
                  type="button"
                  className={`vidion-menu-item ${isActive ? "is-active" : ""}`}
                  onClick={() => {
                    onCaptionSelect(caption.id);
                    onPanelChange(null);
                  }}
                >
                  <Captions size={14} />
                  <span>{caption.label}</span>
                </button>
              );
            }) : (
              <div className="vidion-menu-item is-disabled">No subtitles available</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
