"use client";

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { api, type WatchLaterItem } from "@/lib/api";
import { toast } from "sonner";

// ─── Keys ──────────────────────────────────────────────────────────────────────

const KEYS = {
  list: (sort: string) => ["watch-later", "list", sort] as const,
  check: (videoId: string) => ["watch-later", "check", videoId] as const,
  batchCheck: (ids: string[]) => ["watch-later", "batch", ids.join(",")] as const,
};

// ─── Infinite paginated list ────────────────────────────────────────────────

export function useWatchLaterList(sort: "newest" | "oldest" = "newest") {
  const { isAuthenticated } = useAuth();

  return useInfiniteQuery({
    queryKey: KEYS.list(sort),
    queryFn: async ({ pageParam = 1 }) => {
      return api.user.getWatchLaterList(pageParam, 20, sort);
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000,
  });
}

// ─── Check single video ────────────────────────────────────────────────────

export function useWatchLaterCheck(videoId: string) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: KEYS.check(videoId),
    queryFn: async () => {
      const res = await api.user.checkWatchLater(videoId);
      return res.saved;
    },
    enabled: isAuthenticated && !!videoId,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Batch check ────────────────────────────────────────────────────────────

export function useWatchLaterBatchCheck(ids: string[]) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: KEYS.batchCheck(ids),
    queryFn: async () => {
      if (ids.length === 0) return {};
      const res = await api.user.checkWatchLaterBatch(ids);
      return res.saved;
    },
    enabled: isAuthenticated && ids.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Add mutation ──────────────────────────────────────────────────────────

export function useAddToWatchLater() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  return useMutation({
    mutationFn: (data: {
      videoId: string;
      title?: string;
      thumbnail?: string;
      channelName?: string;
      channelId?: string;
      duration?: string;
    }) => {
      if (!isAuthenticated) {
        return Promise.reject(new Error("NOT_AUTHENTICATED"));
      }
      return api.user.addToWatchLater(data);
    },
    onMutate: async (data) => {
      // Optimistic: set check cache to true
      await queryClient.cancelQueries({ queryKey: KEYS.check(data.videoId) });
      const prev = queryClient.getQueryData(KEYS.check(data.videoId));
      queryClient.setQueryData(KEYS.check(data.videoId), true);
      return { prev, videoId: data.videoId };
    },
    onSuccess: (_res, data) => {
      toast.success("Saved to Watch Later");
      queryClient.setQueryData(KEYS.check(data.videoId), true);
      queryClient.invalidateQueries({ queryKey: ["watch-later", "list"] });
      // Invalidate any batch checks that include this video
      queryClient.invalidateQueries({ queryKey: ["watch-later", "batch"] });
    },
    onError: (err, data, context) => {
      if (err.message === "NOT_AUTHENTICATED") {
        toast.info("Sign in to save videos");
        return;
      }
      // Revert optimistic update
      if (context?.prev !== undefined) {
        queryClient.setQueryData(KEYS.check(data.videoId), context.prev);
      }
      toast.error("Failed to save video");
    },
  });
}

// ─── Remove mutation ────────────────────────────────────────────────────────

export function useRemoveFromWatchLater() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (videoId: string) => api.user.removeFromWatchLater(videoId),
    onMutate: async (videoId) => {
      await queryClient.cancelQueries({ queryKey: KEYS.check(videoId) });
      const prev = queryClient.getQueryData(KEYS.check(videoId));
      queryClient.setQueryData(KEYS.check(videoId), false);
      return { prev, videoId };
    },
    onSuccess: (_res, videoId) => {
      toast.success("Removed from Watch Later");
      queryClient.setQueryData(KEYS.check(videoId), false);
      queryClient.invalidateQueries({ queryKey: ["watch-later", "list"] });
      queryClient.invalidateQueries({ queryKey: ["watch-later", "batch"] });
    },
    onError: (err, videoId, context) => {
      if (context?.prev !== undefined) {
        queryClient.setQueryData(KEYS.check(videoId), context.prev);
      }
      toast.error("Failed to remove video");
    },
  });
}

// ─── Clear all mutation ─────────────────────────────────────────────────────

export function useClearWatchLater() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.user.clearWatchLater(),
    onSuccess: () => {
      toast.success("Watch Later cleared");
      queryClient.invalidateQueries({ queryKey: ["watch-later"] });
    },
    onError: () => {
      toast.error("Failed to clear Watch Later");
    },
  });
}
