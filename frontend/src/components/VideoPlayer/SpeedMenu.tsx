"use client";

import { Check, Gauge } from "lucide-react";

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

interface SpeedMenuProps {
  current: number;
  onChange: (rate: number) => void;
  onClose: () => void;
}

export function SpeedMenu({ current, onChange, onClose }: SpeedMenuProps) {
  return (
    <div className="vidion-menu" role="menu" aria-label="Playback speed">
      <div className="vidion-menu-header">Playback speed</div>
      {SPEEDS.map((speed) => (
        <button
          key={speed}
          type="button"
          className={`vidion-menu-item ${current === speed ? "is-active" : ""}`}
          onClick={() => {
            onChange(speed);
            onClose();
          }}
        >
          <Gauge size={14} />
          <span>{speed === 1 ? "Normal" : `${speed}×`}</span>
          {current === speed ? <Check size={14} className="vidion-menu-check" /> : null}
        </button>
      ))}
    </div>
  );
}
