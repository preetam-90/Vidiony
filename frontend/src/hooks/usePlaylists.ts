"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────────

export interface Playlist {
    id: string;
    name: string;
    description?: string;
    privacy: "PUBLIC" | "PRIVATE" | "UNLISTED";
    userId: string;
    createdAt: string;
    updatedAt: string;
    videos: PlaylistVideo[];
    _count: {
        videos: number;
    };
}

export interface PlaylistVideo {
    id: string;
    videoId: string;
    title?: string;
    thumbnail?: string;
    orderIndex: number;
    addedAt: string;
}

interface CreatePlaylistBody {
    name: string;
    description?: string;
    privacy?: "PUBLIC" | "PRIVATE" | "UNLISTED";
}

interface AddVideoBody {
    videoId: string;
    title?: string;
    thumbnail?: string;
}

// ─── API Functions ─────────────────────────────────────────────────────────────

async function fetchPlaylists(): Promise<Playlist[]> {
    const res = await fetch("/api/playlists", { credentials: "include" });
    if (!res.ok) {
        let errorMessage = "Failed to fetch playlists";
        try {
            const error = await res.json();
            errorMessage = error?.error?.message || error?.message || errorMessage;
        } catch {
            // Ignore JSON parse errors
        }
        throw new Error(errorMessage);
    }
    const data = await res.json();
    return data.data;
}

async function fetchPlaylist(id: string): Promise<Playlist> {
    const res = await fetch(`/api/playlists/${id}`, { credentials: "include" });
    if (!res.ok) {
        let errorMessage = "Failed to fetch playlist";
        try {
            const error = await res.json();
            errorMessage = error?.error?.message || error?.message || errorMessage;
        } catch {
            // Ignore JSON parse errors
        }
        throw new Error(errorMessage);
    }
    const data = await res.json();
    return data.data;
}

async function createPlaylist(body: CreatePlaylistBody): Promise<Playlist> {
    const res = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const message = errorData?.error?.message || errorData?.message || "Failed to create playlist";
        console.error("[Playlist Error]", message, errorData);
        throw new Error(message);
    }

    return res.json().then(d => d.data);
}

async function updatePlaylist(id: string, body: Partial<CreatePlaylistBody>): Promise<Playlist> {
    const res = await fetch(`/api/playlists/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
    });
    if (!res.ok) {
        let errorMessage = "Failed to update playlist";
        try {
            const error = await res.json();
            errorMessage = error?.error?.message || error?.message || errorMessage;
        } catch {
            // Ignore
        }
        throw new Error(errorMessage);
    }
    const data = await res.json();
    return data.data;
}

async function deletePlaylist(id: string): Promise<void> {
    const res = await fetch(`/api/playlists/${id}`, {
        method: "DELETE",
        credentials: "include",
    });
    if (!res.ok) {
        let errorMessage = "Failed to delete playlist";
        try {
            const error = await res.json();
            errorMessage = error?.error?.message || error?.message || errorMessage;
        } catch {
            // Ignore
        }
        throw new Error(errorMessage);
    }
}

async function addVideoToPlaylist(playlistId: string, body: AddVideoBody): Promise<PlaylistVideo> {
    const res = await fetch(`/api/playlists/${playlistId}/videos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
    });
    if (!res.ok) {
        let errorMessage = "Failed to add video to playlist";
        try {
            const error = await res.json();
            errorMessage = error?.error?.message || error?.message || errorMessage;
        } catch {
            // Ignore
        }
        throw new Error(errorMessage);
    }
    const data = await res.json();
    return data.data;
}

async function removeVideoFromPlaylist(playlistId: string, videoId: string): Promise<void> {
    const res = await fetch(`/api/playlists/${playlistId}/videos/${videoId}`, {
        method: "DELETE",
        credentials: "include",
    });
    if (!res.ok) {
        let errorMessage = "Failed to remove video from playlist";
        try {
            const error = await res.json();
            errorMessage = error?.error?.message || error?.message || errorMessage;
        } catch {
            // Ignore
        }
        throw new Error(errorMessage);
    }
}

// ─── Query Keys ────────────────────────────────────────────────────────────────

const KEYS = {
    lists: () => ["playlists", "list"] as const,
    detail: (id: string) => ["playlists", "detail", id] as const,
};

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function usePlaylists() {
    const { isAuthenticated } = useAuth();

    return useQuery({
        queryKey: KEYS.lists(),
        queryFn: fetchPlaylists,
        enabled: isAuthenticated,
        staleTime: 2 * 60 * 1000,
    });
}

export function usePlaylist(id: string) {
    const { isAuthenticated } = useAuth();

    return useQuery({
        queryKey: KEYS.detail(id),
        queryFn: () => fetchPlaylist(id),
        enabled: isAuthenticated && !!id,
        staleTime: 2 * 60 * 1000,
    });
}

export function useCreatePlaylist() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createPlaylist,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: KEYS.lists() });
            toast.success("Playlist created");
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });
}

export function useUpdatePlaylist() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...body }: { id: string } & Partial<CreatePlaylistBody>) =>
            updatePlaylist(id, body),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: KEYS.lists() });
            queryClient.invalidateQueries({ queryKey: KEYS.detail(id) });
            toast.success("Playlist updated");
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });
}

export function useDeletePlaylist() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deletePlaylist,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: KEYS.lists() });
            toast.success("Playlist deleted");
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });
}

export function useAddToPlaylist() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ playlistId, videoId, title, thumbnail }: { playlistId: string } & AddVideoBody) =>
            addVideoToPlaylist(playlistId, { videoId, title, thumbnail }),
        onSuccess: (_, { playlistId }) => {
            queryClient.invalidateQueries({ queryKey: KEYS.lists() });
            queryClient.invalidateQueries({ queryKey: KEYS.detail(playlistId) });
            toast.success("Added to playlist");
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });
}

export function useRemoveFromPlaylist() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ playlistId, videoId }: { playlistId: string; videoId: string }) =>
            removeVideoFromPlaylist(playlistId, videoId),
        onSuccess: (_, { playlistId }) => {
            queryClient.invalidateQueries({ queryKey: KEYS.lists() });
            queryClient.invalidateQueries({ queryKey: KEYS.detail(playlistId) });
            toast.success("Removed from playlist");
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });
}