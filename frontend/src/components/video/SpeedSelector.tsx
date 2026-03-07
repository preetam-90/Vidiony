"use client";

import React from "react";
import { Check, Gauge } from "lucide-react";

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

interface SpeedSelectorProps {
  current: number;
  onChange: (rate: number) => void;
  onClose: () => void;
}

export function SpeedSelector({ current, onChange, onClose }: SpeedSelectorProps) {
  return (
    <div className="vp-popup" style={{ minWidth: 140 }}>
      <div className="vp-popup-header">Speed</div>
      {SPEEDS.map((s) => (
        <button
          key={s}
          className={`vp-popup-item ${current === s ? "active" : ""}`}
          onClick={() => { onChange(s); onClose(); }}
        >
          <Gauge size={14} className="opacity-60" />
          {s === 1 ? "Normal" : `${s}×`}
          {current === s && <Check size={12} className="vp-check" />}
        </button>
      ))}
    </div>
  );
}
