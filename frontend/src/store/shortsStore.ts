import { create } from "zustand";
import type { VideoCardData } from "@/lib/api";

export interface ShortsData extends VideoCardData {
  videoUrl?: string;
  creator?: string;
  creatorAvatar?: string;
  likes?: number;
  comments?: number;
  caption?: string;
}

interface ShortsStoreState {
  shorts: ShortsData[];
  currentIndex: number;
  isMuted: boolean;
  isPaused: boolean;
}

interface ShortsStoreActions {
  setShorts: (shorts: ShortsData[]) => void;
  setCurrentIndex: (index: number) => void;
  nextShort: () => void;
  prevShort: () => void;
  toggleMute: () => void;
  togglePause: () => void;
  setPaused: (paused: boolean) => void;
}

export type ShortsStore = ShortsStoreState & ShortsStoreActions;

export const useShortsStore = create<ShortsStore>((set, get) => ({
  shorts: [],
  currentIndex: 0,
  isMuted: true,
  isPaused: false,

  setShorts: (shorts) => set({ shorts }),

  setCurrentIndex: (index) => set({ currentIndex: index }),

  nextShort: () => {
    const { shorts, currentIndex } = get();
    if (currentIndex < shorts.length - 1) {
      set({ currentIndex: currentIndex + 1, isPaused: false });
    }
  },

  prevShort: () => {
    const { currentIndex } = get();
    if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1, isPaused: false });
    }
  },

  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),

  togglePause: () => set((s) => ({ isPaused: !s.isPaused })),

  setPaused: (paused) => set({ isPaused: paused }),
}));
