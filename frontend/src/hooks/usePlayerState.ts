import { useState, useCallback, useRef } from "react";

export interface CaptionTrack {
  id: string;
  label: string;
  language: string;
  src: string;
}

export interface QualityLevel {
  id: number;       // index in the list (0-based)
  label: string;    // e.g. "1080p", "720p"
  height: number;
  bitrate: number;
}

export interface PlayerState {
  // Playback
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;               // 0–1
  currentTime: number;          // seconds
  duration: number;             // seconds
  buffered: number;             // seconds
  playbackRate: number;
  isEnded: boolean;
  isWaiting: boolean;           // buffering

  // UI
  isFullscreen: boolean;
  isTheaterMode: boolean;
  isPiP: boolean;
  showControls: boolean;
  showSettings: boolean;

  // Captions
  captionsEnabled: boolean;
  activeCaptionId: string | null;

  // Quality
  activeQualityId: number | null;   // -1 = auto
  selectedQuality: string | null;   // "720p", "1080p", etc. — null = auto
  availableQualities: QualityLevel[];

  // Error
  error: string | null;
  isLoading: boolean;
}

const INITIAL: PlayerState = {
  isPlaying: false,
  isMuted: false,
  volume: 1,
  currentTime: 0,
  duration: 0,
  buffered: 0,
  playbackRate: 1,
  isEnded: false,
  isWaiting: false,
  isFullscreen: false,
  isTheaterMode: false,
  isPiP: false,
  showControls: true,
  showSettings: false,
  captionsEnabled: false,
  activeCaptionId: null,
  activeQualityId: -1,
  selectedQuality: null,
  availableQualities: [],
  error: null,
  isLoading: true,
};

export function usePlayerState() {
  const [state, setState] = useState<PlayerState>(INITIAL);

  const patch = useCallback((partial: Partial<PlayerState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const reset = useCallback(() => setState(INITIAL), []);

  return { state, patch, reset };
}
