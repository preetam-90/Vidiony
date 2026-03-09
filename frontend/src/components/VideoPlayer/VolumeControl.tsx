"use client";

import { Volume1, Volume2, VolumeX } from "lucide-react";

interface VolumeControlProps {
  isMuted: boolean;
  volume: number;
  onToggleMute: () => void;
  onVolumeChange: (value: number) => void;
}

export function VolumeControl({
  isMuted,
  volume,
  onToggleMute,
  onVolumeChange,
}: VolumeControlProps) {
  const volumePercent = `${Math.round((isMuted ? 0 : volume) * 100)}%`;
  const Icon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="vidion-volume" style={{ ["--vidion-volume" as string]: volumePercent }}>
      <button
        type="button"
        className="vidion-icon-button"
        onClick={onToggleMute}
        aria-label={isMuted ? "Unmute" : "Mute"}
        title="Mute (M)"
      >
        <Icon size={18} />
      </button>

      <label className="vidion-volume-slider-shell" aria-label="Volume">
        <span className="sr-only">Volume</span>
        <input
          className="vidion-volume-slider"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={isMuted ? 0 : volume}
          onChange={(event) => onVolumeChange(Number(event.target.value))}
        />
      </label>
    </div>
  );
}
