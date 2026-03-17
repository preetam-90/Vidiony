/**
 * Global Player Store — Zustand
 *
 * Manages the lifecycle of the persistent global video player.
 * The player lives in the layout and never unmounts during navigation.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FormatMetadata } from "@/lib/api";
import type { CaptionTrack } from "@/hooks/usePlayerState";
import type { ChapterMarker } from "@/components/VideoPlayer/ProgressBar";

export interface VideoMeta {
  videoId: string;
  title?: string;
  poster?: string;
  formats?: FormatMetadata[];
  captions?: CaptionTrack[];
  chapters?: ChapterMarker[];
  /** For live streams — pre-resolved HLS/DASH manifest URL */
  streamUrl?: string;
  isLive?: boolean;
}

export interface QueueItem {
  videoId: string;
  title?: string;
  thumbnail?: string;
  channelName?: string;
  duration?: string;
}

export interface PlayerStoreState {
  // ─── Current video ───────────────────────────────────────────────────────────
  videoMeta: VideoMeta | null;

  // ─── Mirrored playback state (synced from native <video> events) ─────────────
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;

  // ─── UI mode ─────────────────────────────────────────────────────────────────
  isMiniPlayer: boolean;
  /** Theater mode — toggled inside VideoPlayer, watched by watch page for layout */
  isTheaterMode: boolean;

  // ─── Queue ───────────────────────────────────────────────────────────────────
  queue: QueueItem[];
  currentQueueIndex: number;
  isQueueVisible: boolean;
}

export interface PlayerStoreActions {
  /** Begin playback of a new video (or reload metadata for current). */
  playVideo: (meta: VideoMeta) => void;
  /** Stop playback, clear metadata, dismiss the player entirely. */
  closePlayer: () => void;
  /** Toggle between full-size slot mode and floating mini player. */
  toggleMiniPlayer: () => void;
  /** Switch to mini player mode. */
  enterMiniPlayer: () => void;
  /** Restore full-size slot mode. */
  exitMiniPlayer: () => void;
  /** Toggle theater mode (called from VideoPlayer's onTheaterChange callback). */
  setIsTheaterMode: (val: boolean) => void;
  /** Seek to specific time (calls through to store sync; actual seek is via videoRef). */
  setCurrentTime: (time: number) => void;

  // ─── Queue actions ───────────────────────────────────────────────────────────
  addToQueue: (item: QueueItem) => void;
  removeFromQueue: (videoId: string) => void;
  reorderQueue: (startIndex: number, endIndex: number) => void;
  playNextInQueue: () => void;
  playFromQueue: (index: number) => QueueItem | undefined;
  clearQueue: () => void;
  toggleQueueVisibility: () => void;

  // ─── Internal sync helpers (called from GlobalPlayer's video event listeners) ─
  _syncPlaying: (val: boolean) => void;
  _syncTime: (currentTime: number) => void;
  _syncDuration: (duration: number) => void;
  _syncVolume: (volume: number, isMuted: boolean) => void;
}

export type PlayerStore = PlayerStoreState & PlayerStoreActions;

const INITIAL_STATE: PlayerStoreState = {
  videoMeta: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  isMuted: false,
  isMiniPlayer: false,
  isTheaterMode: false,
  queue: [],
  currentQueueIndex: -1,
  isQueueVisible: false,
};

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,

      playVideo: (meta) =>
        set({
          videoMeta: meta,
          isMiniPlayer: false,
          isPlaying: false,
          currentTime: 0,
          duration: 0,
          isTheaterMode: false,
        }),

      closePlayer: () =>
        set({
          ...INITIAL_STATE,
        }),

      toggleMiniPlayer: () =>
        set((s) => ({ isMiniPlayer: !s.isMiniPlayer })),

      enterMiniPlayer: () => set({ isMiniPlayer: true }),

      exitMiniPlayer: () => set({ isMiniPlayer: false }),

      setIsTheaterMode: (val) => set({ isTheaterMode: val }),

      setCurrentTime: (time) => set({ currentTime: time }),

      // ─── Queue actions ───────────────────────────────────────────────────────────
      addToQueue: (item) =>
        set((s) => ({ queue: [...s.queue, item] })),

      removeFromQueue: (videoId) =>
        set((s) => ({
          queue: s.queue.filter((item) => item.videoId !== videoId),
          currentQueueIndex: s.currentQueueIndex >= s.queue.length - 1 ? s.currentQueueIndex - 1 : s.currentQueueIndex,
        })),

      reorderQueue: (startIndex, endIndex) =>
        set((s) => {
          const newQueue = [...s.queue];
          const [removed] = newQueue.splice(startIndex, 1);
          newQueue.splice(endIndex, 0, removed);
          return { queue: newQueue };
        }),

      playNextInQueue: () =>
        set((s) => {
          if (s.queue.length === 0 || s.currentQueueIndex >= s.queue.length - 1) return s;
          const nextIndex = s.currentQueueIndex + 1;
          const nextItem = s.queue[nextIndex];
          if (!nextItem) return s;
          // Assume playVideo is called externally, here we just update index
          return { currentQueueIndex: nextIndex };
        }),

      playFromQueue: (index) => {
        let item: QueueItem | undefined;
        set((s) => {
          if (index < 0 || index >= s.queue.length) return s;
          item = s.queue[index];
          if (!item) return s;
          return { currentQueueIndex: index };
        });
        return item;
      },

      clearQueue: () =>
        set({ queue: [], currentQueueIndex: -1 }),

      toggleQueueVisibility: () =>
        set((s) => ({ isQueueVisible: !s.isQueueVisible })),

      _syncPlaying: (val) => set({ isPlaying: val }),
      _syncTime: (currentTime) => set({ currentTime }),
      _syncDuration: (duration) => set({ duration }),
      _syncVolume: (volume, isMuted) => set({ volume, isMuted }),
    }),
    {
      name: 'player-store',
      partialize: (state) => ({ queue: state.queue, currentQueueIndex: state.currentQueueIndex }),
    }
  )
);
