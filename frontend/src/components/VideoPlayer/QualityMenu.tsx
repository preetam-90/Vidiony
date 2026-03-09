"use client";

import { Check, MonitorUp, Wifi } from "lucide-react";
import type { QualityLevel } from "@/hooks/usePlayerState";

interface QualityMenuProps {
  levels: QualityLevel[];
  activeId: number | null;
  onChange: (id: number) => void;
  onClose: () => void;
}

export function QualityMenu({ levels, activeId, onChange, onClose }: QualityMenuProps) {
  if (levels.length === 0) return null;

  return (
    <div className="vidion-menu" role="menu" aria-label="Quality">
      <div className="vidion-menu-header">Quality</div>

      <button
        type="button"
        className={`vidion-menu-item ${activeId === -1 ? "is-active" : ""}`}
        onClick={() => {
          onChange(-1);
          onClose();
        }}
      >
        <Wifi size={14} />
        <span>Auto</span>
        {activeId === -1 ? <Check size={14} className="vidion-menu-check" /> : null}
      </button>

      {[...levels]
        .sort((a, b) => b.height - a.height)
        .map((level) => (
          <button
            key={level.id}
            type="button"
            className={`vidion-menu-item ${activeId === level.id ? "is-active" : ""}`}
            onClick={() => {
              onChange(level.id);
              onClose();
            }}
          >
            <MonitorUp size={14} />
            <span>{level.label}</span>
            {activeId === level.id ? <Check size={14} className="vidion-menu-check" /> : null}
          </button>
        ))}
    </div>
  );
}
