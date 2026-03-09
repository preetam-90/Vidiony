import { useCallback, useEffect } from "react";

const SPEED_STEPS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

interface UsePlayerKeyboardOptions {
  enabled: boolean;
  onPlayPause: () => void;
  onSeek: (delta: number) => void;
  onVolumeToggle: () => void;
  onFullscreen: () => void;
  onCaptionToggle: () => void;
  onSpeedChange: (rate: number) => void;
  onVolumeStep: (delta: number) => void;
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
  onVolumeStep,
  getCurrentSpeed,
}: UsePlayerKeyboardOptions) {
  const handleKey = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    const target = event.target as HTMLElement | null;
    const tag = target?.tagName?.toLowerCase();
    const isTypingTarget = tag === "input" || tag === "textarea" || tag === "select" || target?.isContentEditable;
    if (isTypingTarget) return;

    const currentSpeed = getCurrentSpeed();
    const speedIndex = SPEED_STEPS.indexOf(currentSpeed);

    switch (event.key) {
      case " ":
      case "k":
      case "K":
        event.preventDefault();
        onPlayPause();
        break;

      case "j":
      case "J":
        event.preventDefault();
        onSeek(-10);
        break;

      case "l":
      case "L":
        event.preventDefault();
        onSeek(10);
        break;

      case "ArrowRight":
        event.preventDefault();
        onSeek(10);
        break;

      case "ArrowLeft":
        event.preventDefault();
        onSeek(-10);
        break;

      case "ArrowUp":
        event.preventDefault();
        onVolumeStep(0.05);
        break;

      case "ArrowDown":
        event.preventDefault();
        onVolumeStep(-0.05);
        break;

      case "f":
      case "F":
        event.preventDefault();
        onFullscreen();
        break;

      case "m":
      case "M":
        event.preventDefault();
        onVolumeToggle();
        break;

      case "c":
      case "C":
        event.preventDefault();
        onCaptionToggle();
        break;

      case ">":
        if (event.shiftKey) {
          event.preventDefault();
          const nextSpeed = SPEED_STEPS[Math.min(speedIndex + 1, SPEED_STEPS.length - 1)];
          onSpeedChange(nextSpeed);
        }
        break;

      case "<":
        if (event.shiftKey) {
          event.preventDefault();
          const previousSpeed = SPEED_STEPS[Math.max(speedIndex - 1, 0)];
          onSpeedChange(previousSpeed);
        }
        break;

      default:
        break;
    }
  }, [enabled, getCurrentSpeed, onCaptionToggle, onFullscreen, onPlayPause, onSeek, onSpeedChange, onVolumeStep, onVolumeToggle]);

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);
}
