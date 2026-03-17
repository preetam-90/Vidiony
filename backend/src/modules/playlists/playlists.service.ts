/**
 * Playlists service — business logic for playlist management.
 */

import { PrismaClient } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { ConflictError, NotFoundError, ForbiddenError } from "../../utils/errors.js";
import type {
    CreatePlaylistBody,
    UpdatePlaylistBody,
    AddVideoToPlaylistBody,
    ReorderPlaylistBody,
} from "./playlists.schemas.js";

// ─── Playlist CRUD ─────────────────────────────────────────────────────────────

export async function createPlaylist(
    prisma: PrismaClient,
    userId: string,
    { name, description, privacy }: CreatePlaylistBody
) {
    return prisma.playlist.create({
        data: {
            name,
            description,
            privacy,
            userId,
        },
    });
}

export async function getUserPlaylists(prisma: PrismaClient, userId: string) {
    return prisma.playlist.findMany({
        where: { userId },
        include: {
            videos: {
                orderBy: { orderIndex: "asc" },
                select: {
                    id: true,
                    videoId: true,
                    title: true,
                    thumbnail: true,
                    orderIndex: true,
                },
            },
            _count: {
                select: { videos: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });
}

export async function getPlaylistById(
    prisma: PrismaClient,
    playlistId: string,
    userId?: string
) {
    const playlist = await prisma.playlist.findUnique({
        where: { id: playlistId },
        include: {
            videos: {
                orderBy: { orderIndex: "asc" },
                select: {
                    id: true,
                    videoId: true,
                    title: true,
                    thumbnail: true,
                    orderIndex: true,
                    addedAt: true,
                },
            },
            user: {
                select: { id: true, username: true, name: true },
            },
            _count: {
                select: { videos: true },
            },
        },
    });

    if (!playlist) {
        throw new NotFoundError("Playlist not found");
    }

    // Check privacy
    if (playlist.privacy === "PRIVATE" && playlist.userId !== userId) {
        throw new ForbiddenError("This playlist is private");
    }

    return playlist;
}

export async function updatePlaylist(
    prisma: PrismaClient,
    playlistId: string,
    userId: string,
    updates: UpdatePlaylistBody
) {
    const playlist = await prisma.playlist.findUnique({
        where: { id: playlistId },
        select: { userId: true },
    });

    if (!playlist) {
        throw new NotFoundError("Playlist not found");
    }

    if (playlist.userId !== userId) {
        throw new ForbiddenError("You don't own this playlist");
    }

    return prisma.playlist.update({
        where: { id: playlistId },
        data: updates,
    });
}

export async function deletePlaylist(
    prisma: PrismaClient,
    playlistId: string,
    userId: string
) {
    const playlist = await prisma.playlist.findUnique({
        where: { id: playlistId },
        select: { userId: true },
    });

    if (!playlist) {
        throw new NotFoundError("Playlist not found");
    }

    if (playlist.userId !== userId) {
        throw new ForbiddenError("You don't own this playlist");
    }

    await prisma.playlist.delete({
        where: { id: playlistId },
    });
}

// ─── Video Management ──────────────────────────────────────────────────────────

export async function addVideoToPlaylist(
    prisma: PrismaClient,
    playlistId: string,
    userId: string,
    { videoId, title, thumbnail }: AddVideoToPlaylistBody
) {
    const playlist = await prisma.playlist.findUnique({
        where: { id: playlistId },
        select: { userId: true },
    });

    if (!playlist) {
        throw new NotFoundError("Playlist not found");
    }

    if (playlist.userId !== userId) {
        throw new ForbiddenError("You don't own this playlist");
    }

    // Check if video already exists in playlist
    const existing = await prisma.playlistVideo.findUnique({
        where: {
            playlistId_videoId: {
                playlistId,
                videoId,
            },
        },
    });

    if (existing) {
        throw new ConflictError("Video already exists in this playlist");
    }

    // Get next order index
    const lastVideo = await prisma.playlistVideo.findFirst({
        where: { playlistId },
        orderBy: { orderIndex: "desc" },
        select: { orderIndex: true },
    });

    const nextOrderIndex = (lastVideo?.orderIndex ?? -1) + 1;

    return prisma.playlistVideo.create({
        data: {
            playlistId,
            videoId,
            title,
            thumbnail,
            orderIndex: nextOrderIndex,
        },
    });
}

export async function removeVideoFromPlaylist(
    prisma: PrismaClient,
    playlistId: string,
    videoId: string,
    userId: string
) {
    const playlist = await prisma.playlist.findUnique({
        where: { id: playlistId },
        select: { userId: true },
    });

    if (!playlist) {
        throw new NotFoundError("Playlist not found");
    }

    if (playlist.userId !== userId) {
        throw new ForbiddenError("You don't own this playlist");
    }

    const deleted = await prisma.playlistVideo.deleteMany({
        where: {
            playlistId,
            videoId,
        },
    });

    if (deleted.count === 0) {
        throw new NotFoundError("Video not found in playlist");
    }

    // Reorder remaining videos
    await reorderVideosAfterDeletion(prisma, playlistId);
}

export async function reorderPlaylistVideos(
    prisma: PrismaClient,
    playlistId: string,
    userId: string,
    reorderData: ReorderPlaylistBody
) {
    const playlist = await prisma.playlist.findUnique({
        where: { id: playlistId },
        select: { userId: true },
    });

    if (!playlist) {
        throw new NotFoundError("Playlist not found");
    }

    if (playlist.userId !== userId) {
        throw new ForbiddenError("You don't own this playlist");
    }

    // Update order indices in a transaction
    await prisma.$transaction(
        reorderData.map(({ id, orderIndex }) =>
            prisma.playlistVideo.update({
                where: { id },
                data: { orderIndex },
            })
        )
    );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function reorderVideosAfterDeletion(
    prisma: PrismaClient,
    playlistId: string
) {
    const videos = await prisma.playlistVideo.findMany({
        where: { playlistId },
        orderBy: { orderIndex: "asc" },
        select: { id: true },
    });

    // Reassign order indices sequentially
    await prisma.$transaction(
        videos.map((video, index) =>
            prisma.playlistVideo.update({
                where: { id: video.id },
                data: { orderIndex: index },
            })
        )
    );
}