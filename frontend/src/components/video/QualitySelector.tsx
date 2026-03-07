"use client";

import React from "react";
import { Check, Wifi } from "lucide-react";
import type { QualityLevel } from "@/hooks/usePlayerState";

interface QualitySelectorProps {
  levels: QualityLevel[];
  activeId: number | null;
  onChange: (id: number) => void;
  onClose: () => void;
}

export function QualitySelector({ levels, activeId, onChange, onClose }: QualitySelectorProps) {
  if (levels.length === 0) return null;

  return (
    <div className="vp-popup" style={{ minWidth: 150 }}>
      <div className="vp-popup-header">Quality</div>

      {/* Auto option */}
      <button
        className={`vp-popup-item ${activeId === -1 ? "active" : ""}`}
        onClick={() => { onChange(-1); onClose(); }}
      >
        <Wifi size={14} className="opacity-60" />
        Auto
        {activeId === -1 && <Check size={12} className="vp-check" />}
      </button>

      {[...levels]
        .sort((a, b) => b.height - a.height)
        .map((l) => (
          <button
            key={l.id}
            className={`vp-popup-item ${activeId === l.id ? "active" : ""}`}
            onClick={() => { onChange(l.id); onClose(); }}
          >
            <span className="text-xs opacity-50 w-4">{l.height >= 720 ? "HD" : ""}</span>
            {l.label}
            {activeId === l.id && <Check size={12} className="vp-check" />}
          </button>
        ))}
    </div>
  );
}
