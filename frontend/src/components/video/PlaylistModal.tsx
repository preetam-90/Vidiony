"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Globe, Plus, Check } from "lucide-react";
import { usePlaylists, useCreatePlaylist, useAddToPlaylist } from "@/hooks/usePlaylists";
import { useAuth } from "@/contexts/auth-context";
import { Loader2 } from "lucide-react";

interface PlaylistModalProps {
    isOpen: boolean;
    onClose: () => void;
    videoId: string;
    videoTitle?: string;
    videoThumbnail?: string;
}

export default function PlaylistModal({
    isOpen,
    onClose,
    videoId,
    videoTitle,
    videoThumbnail,
}: PlaylistModalProps) {
    const { isAuthenticated } = useAuth();
    const { data: playlists, isLoading } = usePlaylists();
    const createPlaylist = useCreatePlaylist();
    const addToPlaylist = useAddToPlaylist();

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState("");
    const [selectedPlaylists, setSelectedPlaylists] = useState<Set<string>>(new Set());
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleTogglePlaylist = (playlistId: string) => {
        const newSelected = new Set(selectedPlaylists);
        if (newSelected.has(playlistId)) {
            newSelected.delete(playlistId);
        } else {
            newSelected.add(playlistId);
        }
        setSelectedPlaylists(newSelected);
    };

    const handleCreateAndAdd = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!newPlaylistName.trim()) return;
        setIsSubmitting(true);
        try {
            const playlist = await createPlaylist.mutateAsync({
                name: newPlaylistName.trim(),
                privacy: "PRIVATE",
            });
            await addToPlaylist.mutateAsync({
                playlistId: playlist.id,
                videoId,
                title: videoTitle,
                thumbnail: videoThumbnail,
            });
            setNewPlaylistName("");
            setShowCreateForm(false);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveToSelected = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (selectedPlaylists.size === 0) return;
        setIsSubmitting(true);
        try {
            await Promise.all(
                Array.from(selectedPlaylists).map((playlistId) =>
                    addToPlaylist.mutateAsync({
                        playlistId,
                        videoId,
                        title: videoTitle,
                        thumbnail: videoThumbnail,
                    })
                )
            );
            setSelectedPlaylists(new Set());
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setShowCreateForm(false);
        setNewPlaylistName("");
        setSelectedPlaylists(new Set());
        onClose();
    };

    const getPrivacyIcon = (privacy: string) => {
        switch (privacy) {
            case "PUBLIC":
                return <Globe className="h-4 w-4 text-green-500" />;
            case "UNLISTED":
                return <Globe className="h-4 w-4 text-yellow-500" />;
            default:
                return <Lock className="h-4 w-4 text-gray-500" />;
        }
    };

    if (!isAuthenticated) {
        return (
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Save to Playlist</DialogTitle>
                        <DialogDescription>
                            Please sign in to save videos to your playlists.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={(e) => { e.preventDefault(); handleClose(); }}>
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Save to Playlist</DialogTitle>
                    <DialogDescription>
                        {videoTitle ? `Adding: ${videoTitle}` : "Save video to your playlists"}
                    </DialogDescription>
                </DialogHeader>

                {showCreateForm ? (
                    <div className="space-y-4">
                        <Input
                            placeholder="Playlist name"
                            value={newPlaylistName}
                            onChange={(e) => setNewPlaylistName(e.target.value)}
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setShowCreateForm(false);
                                }}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleCreateAndAdd(e);
                                }}
                                disabled={!newPlaylistName.trim() || isSubmitting}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    "Create & Add"
                                )}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : playlists && playlists.length > 0 ? (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {playlists.map((playlist) => (
                                    <button
                                        type="button"
                                        key={playlist.id}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleTogglePlaylist(playlist.id);
                                        }}
                                        className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${selectedPlaylists.has(playlist.id)
                                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                            : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                                            }`}
                                    >
                                        <div
                                            className={`w-5 h-5 rounded border flex items-center justify-center ${selectedPlaylists.has(playlist.id)
                                                ? "bg-blue-500 border-blue-500"
                                                : "border-gray-300 dark:border-gray-600"
                                                }`}
                                        >
                                            {selectedPlaylists.has(playlist.id) && (
                                                <Check className="h-3 w-3 text-white" />
                                            )}
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className="font-medium text-sm">{playlist.name}</p>
                                            <p className="text-xs text-gray-500">
                                                {playlist._count.videos} videos • {playlist.privacy.toLowerCase()}
                                            </p>
                                        </div>
                                        {getPrivacyIcon(playlist.privacy)}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-4">
                                You don't have any playlists yet.
                            </p>
                        )}

                        <div className="flex justify-between gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setShowCreateForm(true);
                                }}
                                className="flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                New Playlist
                            </Button>
                            {selectedPlaylists.size > 0 && (
                                <Button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleSaveToSelected(e);
                                    }}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        `Save (${selectedPlaylists.size})`
                                    )}
                                </Button>
                            )}
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}