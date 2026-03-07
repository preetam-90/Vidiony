/**
 * Zustand store — Likes (local-only, persisted)
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LikesState {
  liked: Set<string>;
  disliked: Set<string>;
  toggleLike: (id: string) => void;
  toggleDislike: (id: string) => void;
  isLiked: (id: string) => boolean;
  isDisliked: (id: string) => boolean;
}

export const useLikes = create<LikesState>()(
  persist(
    (set, get) => ({
      liked: new Set<string>(),
      disliked: new Set<string>(),

      toggleLike: (id) => {
        const { liked, disliked } = get();
        const newLiked = new Set(liked);
        const newDisliked = new Set(disliked);
        if (newLiked.has(id)) {
          newLiked.delete(id);
        } else {
          newLiked.add(id);
          newDisliked.delete(id);
        }
        set({ liked: newLiked, disliked: newDisliked });
      },

      toggleDislike: (id) => {
        const { liked, disliked } = get();
        const newLiked = new Set(liked);
        const newDisliked = new Set(disliked);
        if (newDisliked.has(id)) {
          newDisliked.delete(id);
        } else {
          newDisliked.add(id);
          newLiked.delete(id);
        }
        set({ liked: newLiked, disliked: newDisliked });
      },

      isLiked: (id) => get().liked.has(id),
      isDisliked: (id) => get().disliked.has(id),
    }),
    {
      name: "vidion-likes",
      // Custom serializer for Set
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const parsed = JSON.parse(str);
          return {
            ...parsed,
            state: {
              ...parsed.state,
              liked: new Set(parsed.state.liked ?? []),
              disliked: new Set(parsed.state.disliked ?? []),
            },
          };
        },
        setItem: (name, value) => {
          const serialized = {
            ...value,
            state: {
              ...value.state,
              liked: Array.from(value.state.liked ?? []),
              disliked: Array.from(value.state.disliked ?? []),
            },
          };
          localStorage.setItem(name, JSON.stringify(serialized));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
