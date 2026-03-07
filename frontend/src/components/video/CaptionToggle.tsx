"use client";

import React from "react";
import { Check, Subtitles, X } from "lucide-react";
import type { CaptionTrack } from "@/hooks/usePlayerState";

interface CaptionToggleProps {
  tracks: CaptionTrack[];
  enabled: boolean;
  activeId: string | null;
  onToggle: () => void;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function CaptionToggle({
  tracks,
  enabled,
  activeId,
  onToggle,
  onSelect,
  onClose,
}: CaptionToggleProps) {
  return (
    <div className="vp-popup" style={{ minWidth: 160 }}>
      <div className="vp-popup-header">Captions</div>

      {/* Off */}
      <button
        className={`vp-popup-item ${!enabled ? "active" : ""}`}
        onClick={() => { if (enabled) onToggle(); onClose(); }}
      >
        <X size={14} className="opacity-60" />
        Off
        {!enabled && <Check size={12} className="vp-check" />}
      </button>

      {tracks.length > 0 ? (
        tracks.map((t) => (
          <button
            key={t.id}
            className={`vp-popup-item ${enabled && activeId === t.id ? "active" : ""}`}
            onClick={() => {
              onSelect(t.id);
              if (!enabled) onToggle();
              onClose();
            }}
          >
            <Subtitles size={14} className="opacity-60" />
            {t.label}
            {enabled && activeId === t.id && <Check size={12} className="vp-check" />}
          </button>
        ))
      ) : (
        <div className="vp-popup-item" style={{ opacity: 0.4, cursor: "default", pointerEvents: "none" }}>
          No captions available
        </div>
      )}
    </div>
  );
}
