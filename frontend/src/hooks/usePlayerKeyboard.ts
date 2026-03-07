import { useEffect, useCallback } from "react";

const SPEED_STEPS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

interface UsePlayerKeyboardOptions {
  enabled: boolean;
  onPlayPause: () => void;
  onSeek: (delta: number) => void;
  onVolumeToggle: () => void;
  onFullscreen: () => void;
  onCaptionToggle: () => void;
  onSpeedChange: (rate: number) => void;
  getCurrentSpeed: () => number;
}

export function usePlayerKeyboard({
  enabled,
  onPlayPause,
  onSeek,
  onVolumeToggle,
  onFullscreen,
  onCaptionToggle,
  onSpeedChange,
  getCurrentSpeed,
}: UsePlayerKeyboardOptions) {
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Don't capture when user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      const speed = getCurrentSpeed();
      const idx = SPEED_STEPS.indexOf(speed);

      switch (e.key) {
        case " ":
        case "k":
        case "K":
          e.preventDefault();
          onPlayPause();
          break;

        case "j":
        case "J":
          e.preventDefault();
          onSeek(-10);
          break;

        case "l":
        case "L":
          e.preventDefault();
          onSeek(10);
          break;

        case "ArrowRight":
          e.preventDefault();
          onSeek(5);
          break;

        case "ArrowLeft":
          e.preventDefault();
          onSeek(-5);
          break;

        case "f":
        case "F":
          e.preventDefault();
          onFullscreen();
          break;

        case "m":
        case "M":
          e.preventDefault();
          onVolumeToggle();
          break;

        case "c":
        case "C":
          e.preventDefault();
          onCaptionToggle();
          break;

        case ">":
          if (e.shiftKey) {
            e.preventDefault();
            const next = SPEED_STEPS[Math.min(idx + 1, SPEED_STEPS.length - 1)];
            onSpeedChange(next);
          }
          break;

        case "<":
          if (e.shiftKey) {
            e.preventDefault();
            const prev = SPEED_STEPS[Math.max(idx - 1, 0)];
            onSpeedChange(prev);
          }
          break;

        default:
          break;
      }
    },
    [enabled, onPlayPause, onSeek, onVolumeToggle, onFullscreen, onCaptionToggle, onSpeedChange, getCurrentSpeed]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);
}
