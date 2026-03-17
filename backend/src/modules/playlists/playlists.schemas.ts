import { z } from "zod";

export const CreatePlaylistSchema = z.object({
    name: z.string().min(1, "Playlist name is required").max(100, "Name too long"),
    description: z.string().max(500).optional(),
    privacy: z.enum(["PUBLIC", "PRIVATE", "UNLISTED"]).default("PRIVATE"),
});

export const UpdatePlaylistSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    privacy: z.enum(["PUBLIC", "PRIVATE", "UNLISTED"]).optional(),
});

export const AddVideoToPlaylistSchema = z.object({
    videoId: z.string().min(1, "Video ID is required"),
    title: z.string().optional(),
    thumbnail: z.string().optional(),
});

export const ReorderPlaylistSchema = z.array(
    z.object({
        id: z.string(),
        orderIndex: z.number().int().min(0),
    })
).min(1, "At least one video required for reordering");

export type CreatePlaylistBody = z.infer<typeof CreatePlaylistSchema>;
export type UpdatePlaylistBody = z.infer<typeof UpdatePlaylistSchema>;
export type AddVideoToPlaylistBody = z.infer<typeof AddVideoToPlaylistSchema>;
export type ReorderPlaylistBody = z.infer<typeof ReorderPlaylistSchema>;