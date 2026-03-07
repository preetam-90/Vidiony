/**
 * Zustand store — Watch History
 * Persisted in localStorage so it survives page reloads.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WatchHistoryItem {
  id: string;
  title: string;
  thumbnail: string;
  channelName: string;
  duration: string;
  watchedAt: number; // timestamp
}

interface WatchHistoryState {
  items: WatchHistoryItem[];
  addToHistory: (item: Omit<WatchHistoryItem, "watchedAt">) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
}

export const useWatchHistory = create<WatchHistoryState>()(
  persist(
    (set, get) => ({
      items: [],

      addToHistory: (item) => {
        const filtered = get().items.filter((i) => i.id !== item.id);
        set({
          items: [{ ...item, watchedAt: Date.now() }, ...filtered].slice(0, 200),
        });
      },

      removeFromHistory: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) });
      },

      clearHistory: () => set({ items: [] }),
    }),
    { name: "vidion-watch-history" }
  )
);
