import { z } from "zod";

export const SearchQuerySchema = z.object({
  q: z.string().min(1, "Search query is required"),
  type: z.enum(["video", "channel", "playlist", "movie"]).optional(),
  upload_date: z.enum(["hour", "today", "week", "month", "year"]).optional(),
  duration: z.enum(["short", "medium", "long"]).optional(),
  sort_by: z.enum(["relevance", "rating", "upload_date", "view_count"]).optional(),
});

export const VideoIdParamSchema = z.object({
  id: z.string().min(1, "Video ID is required"),
});

export const ChannelIdParamSchema = z.object({
  id: z.string().min(1, "Channel ID is required"),
});

export const StreamParamsSchema = z.object({
  videoId: z.string().min(1, "Video ID is required"),
  // itag comes in as a URL segment string — coerce to number
  itag: z.coerce.number().int().positive().optional(),
});

export const StreamQuerySchema = z.object({
  // Accept any quality string — yt-dlp handles the format selector.
  // Normalise to just the height portion ("1080p60" → "1080p") so our
  // qualityToHeight helper always finds a match.
  quality: z
    .string()
    .optional()
    .default("360p")
    .transform((q) => {
      // Strip fps suffix: "1080p60" → "1080p", "720p60" → "720p"
      const match = q.match(/^(\d+p)/);
      return match ? match[1] : q;
    }),
});

// page and limit arrive as query strings; coerce to numbers automatically
export const FeedQuerySchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(8),
});
