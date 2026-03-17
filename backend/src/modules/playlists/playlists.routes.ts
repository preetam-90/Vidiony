/**
 * Playlists routes — /api/playlists/*
 *
 * CRUD operations for user playlists and video management.
 */

import type { FastifyPluginAsync } from "fastify";
import { toErrorResponse } from "../../utils/errors.js";
import {
    CreatePlaylistSchema,
    UpdatePlaylistSchema,
    AddVideoToPlaylistSchema,
    ReorderPlaylistSchema,
} from "./playlists.schemas.js";
import {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    updatePlaylist,
    deletePlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    reorderPlaylistVideos,
} from "./playlists.service.js";

const playlistsRoutes: FastifyPluginAsync = async (fastify) => {
    // ─── Get all playlists for the user ───────────────────────────────────────────
    fastify.get("/", {
        preHandler: fastify.authenticate,
    }, async (req, reply) => {
        const { id: userId } = req.user!;
        const playlists = await getUserPlaylists(fastify.prisma, userId);
        return reply.send({ success: true, data: playlists });
    });

    // ─── Create a new playlist ───────────────────────────────────────────────────
    fastify.post("/", {
        preHandler: fastify.authenticate,
    }, async (req, reply) => {
        const { id: userId } = req.user!;
        const parsed = CreatePlaylistSchema.safeParse(req.body);
        if (!parsed.success) {
            return reply.status(400).send({
                success: false,
                error: { code: "VALIDATION_ERROR", message: "Invalid request data", details: parsed.error.issues },
            });
        }

        try {
            const playlist = await createPlaylist(fastify.prisma, userId, parsed.data);
            return reply.status(201).send({ success: true, data: playlist });
        } catch (err) {
            const status = (err as any).statusCode || 500;
            const error = toErrorResponse(err);
            return reply.status(status).send({ success: false, error });
        }
    });

    // ─── Get playlist details (with privacy check) ───────────────────────────────
    fastify.get("/:id", {
        preHandler: fastify.optionalAuthenticate,
    }, async (req, reply) => {
        const { id } = req.params as { id: string };
        const userId = req.user?.id;

        try {
            const playlist = await getPlaylistById(fastify.prisma, id, userId);
            return reply.send({ success: true, data: playlist });
        } catch (err) {
            const status = (err as any).statusCode || 500;
            const error = toErrorResponse(err);
            return reply.status(status).send({ success: false, error });
        }
    });

    // ─── Update playlist ─────────────────────────────────────────────────────────
    fastify.put("/:id", {
        preHandler: fastify.authenticate,
    }, async (req, reply) => {
        const { id } = req.params as { id: string };
        const { id: userId } = req.user!;
        const parsed = UpdatePlaylistSchema.safeParse(req.body);
        if (!parsed.success) {
            return reply.status(400).send({
                success: false,
                error: { code: "VALIDATION_ERROR", message: "Invalid request data", details: parsed.error.issues },
            });
        }

        try {
            const playlist = await updatePlaylist(fastify.prisma, id, userId, parsed.data);
            return reply.send({ success: true, data: playlist });
        } catch (err) {
            const status = (err as any).statusCode || 500;
            const error = toErrorResponse(err);
            return reply.status(status).send({ success: false, error });
        }
    });

    // ─── Delete playlist ─────────────────────────────────────────────────────────
    fastify.delete("/:id", {
        preHandler: fastify.authenticate,
    }, async (req, reply) => {
        const { id } = req.params as { id: string };
        const { id: userId } = req.user!;

        try {
            await deletePlaylist(fastify.prisma, id, userId);
            return reply.send({ success: true, message: "Playlist deleted" });
        } catch (err) {
            const status = (err as any).statusCode || 500;
            const error = toErrorResponse(err);
            return reply.status(status).send({ success: false, error });
        }
    });

    // ─── Add video to playlist ───────────────────────────────────────────────────
    fastify.post("/:id/videos", {
        preHandler: fastify.authenticate,
    }, async (req, reply) => {
        const { id: playlistId } = req.params as { id: string };
        const { id: userId } = req.user!;
        const parsed = AddVideoToPlaylistSchema.safeParse(req.body);
        if (!parsed.success) {
            return reply.status(400).send({
                success: false,
                error: { code: "VALIDATION_ERROR", message: "Invalid request data", details: parsed.error.issues },
            });
        }

        try {
            const playlistVideo = await addVideoToPlaylist(fastify.prisma, playlistId, userId, parsed.data);
            return reply.status(201).send({ success: true, data: playlistVideo });
        } catch (err) {
            const status = (err as any).statusCode || 500;
            const error = toErrorResponse(err);
            return reply.status(status).send({ success: false, error });
        }
    });

    // ─── Remove video from playlist ──────────────────────────────────────────────
    fastify.delete("/:id/videos/:videoId", {
        preHandler: fastify.authenticate,
    }, async (req, reply) => {
        const { id: playlistId, videoId } = req.params as { id: string; videoId: string };
        const { id: userId } = req.user!;

        try {
            await removeVideoFromPlaylist(fastify.prisma, playlistId, videoId, userId);
            return reply.send({ success: true, message: "Video removed from playlist" });
        } catch (err) {
            const status = (err as any).statusCode || 500;
            const error = toErrorResponse(err);
            return reply.status(status).send({ success: false, error });
        }
    });

    // ─── Reorder playlist videos ─────────────────────────────────────────────────
    fastify.put("/:id/reorder", {
        preHandler: fastify.authenticate,
    }, async (req, reply) => {
        const { id: playlistId } = req.params as { id: string };
        const { id: userId } = req.user!;
        const parsed = ReorderPlaylistSchema.safeParse(req.body);
        if (!parsed.success) {
            return reply.status(400).send({
                success: false,
                error: { code: "VALIDATION_ERROR", message: "Invalid request data", details: parsed.error.issues },
            });
        }

        try {
            await reorderPlaylistVideos(fastify.prisma, playlistId, userId, parsed.data);
            return reply.send({ success: true, message: "Playlist reordered" });
        } catch (err) {
            const status = (err as any).statusCode || 500;
            const error = toErrorResponse(err);
            return reply.status(status).send({ success: false, error });
        }
    });
};

export default playlistsRoutes;