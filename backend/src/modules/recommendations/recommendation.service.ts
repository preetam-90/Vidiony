/**
 * Vidion Recommendation Engine
 *
 * Multi-layer candidate generation → scoring → ranking pipeline.
 *
 * Layers (in priority order):
 *  1. Collaborative Filtering   — users who watched X also watched Y
 *  2. Channel Affinity          — more from channels the user loves
 *  3. Category / Tag Similarity — content-based matching from watch history
 *  4. Trending                  — global trending videos as fill-in
 *  5. Cold-start fallback       — trending + newest when user has no history
 *
 * Scoring formula:
 *   final_score = (collab × 0.35) + (channel × 0.25) + (category × 0.20)
 *               + (trending × 0.15) + (tag_sim × 0.05)
 *
 * NOTE: Neon/Postgres preserves camelCase column names exactly as defined
 * in the Prisma schema (no snake_case mapping). All raw SQL must use
 * double-quoted camelCase identifiers: "userId", "videoId", "channelId", etc.
 */

import type { PrismaClient } from "@prisma/client";
import { getCachedData, setCachedData, delCachedData } from "../../services/cache.service.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RecommendationItem {
  id: string;          // YouTube video ID
  title: string;
  thumbnail: string;
  channelName: string;
  channelId: string;
  duration?: string;
  viewCount?: string;
  publishedAt?: string;
  score: number;
  source: "collaborative" | "channel" | "category" | "trending" | "cold_start";
}

export interface ContinueWatchingItem {
  id: string;
  title: string;
  thumbnail: string;
  channelName: string;
  channelId: string;
  duration: number;
  progress: number;
  watchPercentage: number;
  watchedAt: string;
}

export interface HomeRecommendations {
  recommendedVideos: RecommendationItem[];
  trendingVideos: RecommendationItem[];
  continueWatching: ContinueWatchingItem[];
  fromYourChannels: RecommendationItem[];
  coldStart: boolean;
}

export interface VideoPageRecommendations {
  related: RecommendationItem[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TTL_HOME       = 600;   // 10 minutes
const TTL_VIDEO_PAGE = 900;   // 15 minutes

// Scoring weights (must sum to 1.0)
const WEIGHTS = {
  collaborative: 0.35,
  channel:       0.25,
  category:      0.20,
  trending:      0.15,
  tag_sim:       0.05,
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalise(scores: Map<string, number>): Map<string, number> {
  const max = Math.max(...scores.values(), 1);
  const out = new Map<string, number>();
  for (const [k, v] of scores) out.set(k, v / max);
  return out;
}

function mergeScores(
  parts: Array<{ weight: number; scores: Map<string, number> }>
): Map<string, number> {
  const merged = new Map<string, number>();
  for (const { weight, scores } of parts) {
    const norm = normalise(scores);
    for (const [id, s] of norm) {
      merged.set(id, (merged.get(id) ?? 0) + s * weight);
    }
  }
  return merged;
}

// ─── Layer 1: Collaborative Filtering ─────────────────────────────────────────

async function collaborativeFiltering(
  prisma: PrismaClient,
  userId: string,
  watchedIds: Set<string>,
  dislikedIds: Set<string>
): Promise<Map<string, number>> {
  if (watchedIds.size === 0) return new Map();

  const userIds = Array.from(watchedIds).slice(0, 50);

  // Find users with overlapping watch history (≥2 shared videos)
  const similarUsers = await prisma.$queryRaw<Array<{ userId: string; overlap: number }>>`
    SELECT wh2."userId", COUNT(*)::int AS overlap
    FROM watch_history wh1
    JOIN watch_history wh2
      ON wh1."videoId" = wh2."videoId"
     AND wh2."userId" != ${userId}
    WHERE wh1."userId" = ${userId}
      AND wh1."videoId" = ANY(${userIds}::text[])
    GROUP BY wh2."userId"
    HAVING COUNT(*) >= 2
    ORDER BY overlap DESC
    LIMIT 200
  `;

  if (similarUsers.length === 0) return new Map();

  const similarUserIds = similarUsers.map((u) => u.userId);
  const watchedArr    = Array.from(watchedIds);
  const dislikedArr   = dislikedIds.size > 0 ? Array.from(dislikedIds) : ["__none__"];

  // Videos watched by similar users that the current user hasn't seen
  const candidates = await prisma.$queryRaw<
    Array<{ videoId: string; title: string; thumbnail: string; channelName: string; channelId: string; score: number }>
  >`
    SELECT
      wh."videoId",
      MAX(wh.title)         AS title,
      MAX(wh.thumbnail)     AS thumbnail,
      MAX(wh."channelName") AS "channelName",
      MAX(wh."channelId")   AS "channelId",
      COUNT(*)::int         AS score
    FROM watch_history wh
    WHERE wh."userId"  = ANY(${similarUserIds}::text[])
      AND wh."videoId" != ALL(${watchedArr}::text[])
      AND wh."videoId" != ALL(${dislikedArr}::text[])
      AND wh.title IS NOT NULL
    GROUP BY wh."videoId"
    ORDER BY score DESC
    LIMIT 80
  `;

  const scores = new Map<string, number>();
  for (const c of candidates) scores.set(c.videoId, c.score);
  return scores;
}

// ─── Layer 2: Channel Affinity ─────────────────────────────────────────────────

async function channelAffinity(
  prisma: PrismaClient,
  userId: string,
  watchedIds: Set<string>
): Promise<{ scores: Map<string, number>; topChannels: string[] }> {
  if (watchedIds.size === 0) return { scores: new Map(), topChannels: [] };

  const topChannels = await prisma.$queryRaw<Array<{ channelId: string; watchCount: number }>>`
    SELECT "channelId", COUNT(*)::int AS "watchCount"
    FROM watch_history
    WHERE "userId"    = ${userId}
      AND "channelId" IS NOT NULL
      AND "channelId" != ''
    GROUP BY "channelId"
    ORDER BY "watchCount" DESC
    LIMIT 15
  `;

  if (topChannels.length === 0) return { scores: new Map(), topChannels: [] };

  const channelIds  = topChannels.map((c) => c.channelId);
  const maxCount    = topChannels[0]?.watchCount ?? 1;
  const channelWeights = new Map<string, number>(
    topChannels.map((c) => [c.channelId, c.watchCount / maxCount])
  );
  const watchedArr = Array.from(watchedIds);

  const candidates = await prisma.$queryRaw<
    Array<{ videoId: string; title: string; thumbnail: string; channelName: string; channelId: string }>
  >`
    SELECT DISTINCT ON (wh."videoId")
      wh."videoId",
      wh.title,
      wh.thumbnail,
      wh."channelName",
      wh."channelId"
    FROM watch_history wh
    WHERE wh."channelId" = ANY(${channelIds}::text[])
      AND wh."userId"    != ${userId}
      AND wh."videoId"   != ALL(${watchedArr}::text[])
      AND wh.title IS NOT NULL
    ORDER BY wh."videoId", wh."watchedAt" DESC
    LIMIT 60
  `;

  const scores = new Map<string, number>();
  for (const c of candidates) {
    const w = channelWeights.get(c.channelId) ?? 0.5;
    scores.set(c.videoId, (scores.get(c.videoId) ?? 0) + w);
  }
  return { scores, topChannels: channelIds };
}

// ─── Layer 3: Category / Tag Similarity ────────────────────────────────────────

async function contentSimilarity(
  prisma: PrismaClient,
  userId: string,
  watchedIds: Set<string>
): Promise<Map<string, number>> {
  if (watchedIds.size === 0) return new Map();

  const topCategories = await prisma.$queryRaw<Array<{ category: string; cnt: number }>>`
    SELECT category, COUNT(*)::int AS cnt
    FROM watch_history
    WHERE "userId"  = ${userId}
      AND category IS NOT NULL
    GROUP BY category
    ORDER BY cnt DESC
    LIMIT 5
  `;

  if (topCategories.length === 0) return new Map();
  const cats       = topCategories.map((c) => c.category);
  const watchedArr = Array.from(watchedIds);

  const candidates = await prisma.$queryRaw<
    Array<{ videoId: string; title: string; thumbnail: string; channelName: string; channelId: string; cnt: number }>
  >`
    SELECT
      "videoId",
      MAX(title)         AS title,
      MAX(thumbnail)     AS thumbnail,
      MAX("channelName") AS "channelName",
      MAX("channelId")   AS "channelId",
      COUNT(*)::int      AS cnt
    FROM watch_history
    WHERE category  = ANY(${cats}::text[])
      AND "userId"  != ${userId}
      AND "videoId" != ALL(${watchedArr}::text[])
      AND title IS NOT NULL
    GROUP BY "videoId"
    ORDER BY cnt DESC
    LIMIT 60
  `;

  const scores = new Map<string, number>();
  for (const c of candidates) scores.set(c.videoId, c.cnt);
  return scores;
}

// ─── Layer 4: Trending Videos ──────────────────────────────────────────────────

async function getTrendingCandidates(
  prisma: PrismaClient,
  watchedIds: Set<string>,
  limit = 50
): Promise<Array<RecommendationItem & { trendingScore: number }>> {
  const rows = await prisma.trendingVideo.findMany({
    orderBy: { rank: "asc" },
    take: limit * 2,
  });

  return rows
    .filter((r) => !watchedIds.has(r.id))
    .slice(0, limit)
    .map((r) => ({
      id: r.id,
      title: r.title,
      thumbnail: r.thumbnail,
      channelName: r.channelName,
      channelId: r.channelId,
      viewCount: r.viewCount,
      publishedAt: r.publishedAt,
      duration: r.duration,
      score: 0,
      source: "trending" as const,
      trendingScore: (limit - r.rank + 1) / limit,
    }));
}

// ─── Video metadata lookup ─────────────────────────────────────────────────────

async function buildMetadataMap(
  prisma: PrismaClient,
  videoIds: string[]
): Promise<Map<string, { title: string; thumbnail: string; channelName: string; channelId: string }>> {
  if (videoIds.length === 0) return new Map();

  const map = new Map<string, { title: string; thumbnail: string; channelName: string; channelId: string }>();

  // Fast path: trending table
  const trending = await prisma.trendingVideo.findMany({
    where: { id: { in: videoIds } },
    select: { id: true, title: true, thumbnail: true, channelName: true, channelId: true },
  });
  for (const t of trending) {
    map.set(t.id, { title: t.title, thumbnail: t.thumbnail, channelName: t.channelName, channelId: t.channelId });
  }

  // Fill gaps from watch_history
  const missing = videoIds.filter((id) => !map.has(id));
  if (missing.length > 0) {
    const history = await prisma.$queryRaw<
      Array<{ videoId: string; title: string; thumbnail: string; channelName: string; channelId: string }>
    >`
      SELECT DISTINCT ON ("videoId")
        "videoId", title, thumbnail, "channelName", "channelId"
      FROM watch_history
      WHERE "videoId" = ANY(${missing}::text[])
        AND title IS NOT NULL
      ORDER BY "videoId", "watchedAt" DESC
    `;
    for (const h of history) {
      map.set(h.videoId, {
        title: h.title ?? "",
        thumbnail: h.thumbnail ?? "",
        channelName: h.channelName ?? "",
        channelId: h.channelId ?? "",
      });
    }
  }
  return map;
}

// ─── Anti-spam filtering ───────────────────────────────────────────────────────

async function getDislikedIds(prisma: PrismaClient, userId: string): Promise<Set<string>> {
  const rows = await prisma.userInteraction.findMany({
    where: { userId, actionType: "DISLIKE" },
    select: { videoId: true },
  });
  return new Set(rows.map((r) => r.videoId));
}

async function getSkippedIds(prisma: PrismaClient, userId: string): Promise<Set<string>> {
  const rows = await prisma.userInteraction.findMany({
    where: { userId, actionType: "SKIP" },
    select: { videoId: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return new Set(rows.map((r) => r.videoId));
}

// ─── Main: Home Recommendations ───────────────────────────────────────────────

export async function getHomeRecommendations(
  prisma: PrismaClient,
  userId: string
): Promise<HomeRecommendations> {
  const cacheKey = `user_recommendations:${userId}`;
  const cached   = await getCachedData<HomeRecommendations>(cacheKey);
  if (cached) return cached;

  const [watchHistory, dislikedIds, skippedIds] = await Promise.all([
    prisma.watchHistory.findMany({
      where: { userId },
      orderBy: { watchedAt: "desc" },
      take: 100,
      select: {
        videoId:     true,
        title:       true,
        thumbnail:   true,
        channelName: true,
        channelId:   true,
        duration:    true,
        progress:    true,
        watchedAt:   true,
      },
    }),
    getDislikedIds(prisma, userId),
    getSkippedIds(prisma, userId),
  ]);

  const coldStart  = watchHistory.length < 3;
  const watchedIds = new Set(watchHistory.map((h) => h.videoId));

  // ── Continue watching ───────────────────────────────────────────────────────
  const continueWatching: ContinueWatchingItem[] = watchHistory
    .filter((h) => {
      if (!h.duration || h.duration <= 0 || h.progress <= 5) return false;
      const pct = (h.progress / h.duration) * 100;
      return pct >= 5 && pct < 90;
    })
    .slice(0, 10)
    .map((h) => ({
      id:              h.videoId,
      title:           h.title ?? "",
      thumbnail:       h.thumbnail ?? "",
      channelName:     h.channelName ?? "",
      channelId:       h.channelId ?? "",
      duration:        h.duration ?? 0,
      progress:        h.progress,
      watchPercentage: h.duration ? Math.round((h.progress / h.duration) * 100) : 0,
      watchedAt:       h.watchedAt.toISOString(),
    }));

  // ── Trending (always fetched) ───────────────────────────────────────────────
  const trendingCandidates = await getTrendingCandidates(prisma, watchedIds, 30);
  const trendingVideos: RecommendationItem[] = trendingCandidates.map((t) => ({
    id:          t.id,
    title:       t.title,
    thumbnail:   t.thumbnail,
    channelName: t.channelName,
    channelId:   t.channelId,
    viewCount:   t.viewCount,
    publishedAt: t.publishedAt,
    duration:    t.duration,
    score:       t.trendingScore,
    source:      "trending",
  }));

  // ── Cold-start ──────────────────────────────────────────────────────────────
  if (coldStart) {
    const result: HomeRecommendations = {
      recommendedVideos: trendingCandidates
        .slice(0, 20)
        .map((t) => ({ ...t, source: "cold_start" as const })),
      trendingVideos: trendingVideos.slice(0, 20),
      continueWatching,
      fromYourChannels: [],
      coldStart: true,
    };
    await setCachedData(cacheKey, result, TTL_HOME);
    return result;
  }

  // ── Multi-layer candidate generation ───────────────────────────────────────
  const [collabScores, { scores: channelScores, topChannels }, categoryScores] =
    await Promise.all([
      collaborativeFiltering(prisma, userId, watchedIds, dislikedIds),
      channelAffinity(prisma, userId, watchedIds),
      contentSimilarity(prisma, userId, watchedIds),
    ]);

  const trendingScoreMap = new Map<string, number>(
    trendingCandidates.map((t) => [t.id, t.trendingScore])
  );

  // Merge & rank
  const allCandidateIds = new Set<string>([
    ...collabScores.keys(),
    ...channelScores.keys(),
    ...categoryScores.keys(),
    ...trendingScoreMap.keys(),
  ]);
  const filteredSet = new Set([...dislikedIds, ...skippedIds]);
  for (const id of filteredSet) allCandidateIds.delete(id);

  const finalScores = mergeScores([
    { weight: WEIGHTS.collaborative, scores: collabScores    },
    { weight: WEIGHTS.channel,       scores: channelScores   },
    { weight: WEIGHTS.category,      scores: categoryScores  },
    { weight: WEIGHTS.trending,      scores: trendingScoreMap },
  ]);

  const ranked = [...allCandidateIds]
    .map((id) => ({ id, score: finalScores.get(id) ?? 0 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 60);

  const metaMap = await buildMetadataMap(prisma, ranked.map((r) => r.id));

  function toItem(
    id: string,
    score: number,
    source: RecommendationItem["source"]
  ): RecommendationItem | null {
    const meta    = metaMap.get(id);
    if (!meta || !meta.title) return null;
    const trending = trendingCandidates.find((t) => t.id === id);
    return {
      id,
      title:       meta.title,
      thumbnail:   meta.thumbnail,
      channelName: meta.channelName,
      channelId:   meta.channelId,
      viewCount:   trending?.viewCount,
      publishedAt: trending?.publishedAt,
      duration:    trending?.duration,
      score,
      source,
    };
  }

  // "Recommended for you"
  const recommendedVideos = ranked
    .slice(0, 30)
    .map(({ id, score }): RecommendationItem | null => {
      const src: RecommendationItem["source"] =
        (collabScores.get(id) ?? 0) > (categoryScores.get(id) ?? 0)
          ? "collaborative"
          : "category";
      return toItem(id, score, src);
    })
    .filter((x): x is RecommendationItem => x !== null)
    .slice(0, 20);

  // "From your channels"
  const channelCandidateIds = [...channelScores.keys()]
    .filter((id) => !filteredSet.has(id))
    .sort((a, b) => (channelScores.get(b) ?? 0) - (channelScores.get(a) ?? 0))
    .slice(0, 20);

  const channelMeta = await buildMetadataMap(prisma, channelCandidateIds);
  const fromYourChannels: RecommendationItem[] = channelCandidateIds
    .map((id): RecommendationItem | null => {
      const meta = channelMeta.get(id);
      if (!meta || !meta.title) return null;
      return {
        id,
        title:       meta.title,
        thumbnail:   meta.thumbnail,
        channelName: meta.channelName,
        channelId:   meta.channelId,
        score:       channelScores.get(id) ?? 0,
        source:      "channel",
      };
    })
    .filter((x): x is RecommendationItem => x !== null)
    .slice(0, 12);

  const result: HomeRecommendations = {
    recommendedVideos:
      recommendedVideos.length >= 4
        ? recommendedVideos
        : trendingCandidates.slice(0, 20).map((t) => ({ ...t, source: "cold_start" as const })),
    trendingVideos: trendingVideos.slice(0, 20),
    continueWatching,
    fromYourChannels,
    coldStart: false,
  };

  await setCachedData(cacheKey, result, TTL_HOME);
  return result;
}

// ─── Video Page Recommendations ───────────────────────────────────────────────

export async function getVideoPageRecommendations(
  prisma: PrismaClient,
  videoId: string,
  userId?: string
): Promise<VideoPageRecommendations> {
  const cacheKey = `video_related:${videoId}:${userId ?? "anon"}`;
  const cached   = await getCachedData<VideoPageRecommendations>(cacheKey);
  if (cached) return cached;

  const watchedIds = userId
    ? new Set(
        (
          await prisma.watchHistory.findMany({
            where: { userId },
            select: { videoId: true },
            orderBy: { watchedAt: "desc" },
            take: 300,
          })
        ).map((h) => h.videoId)
      )
    : new Set<string>();

  const dislikedIds = userId ? await getDislikedIds(prisma, userId) : new Set<string>();
  const watchedArr  = watchedIds.size > 0 ? Array.from(watchedIds) : ["__none__"];
  const videoMeta   = await buildMetadataMap(prisma, [videoId]);
  const channelId   = videoMeta.get(videoId)?.channelId ?? "";

  // Collaborative: users who watched this video → their other videos
  const collabCandidates = await prisma.$queryRaw<
    Array<{ videoId: string; title: string; thumbnail: string; channelName: string; channelId: string; cnt: number }>
  >`
    SELECT
      wh2."videoId",
      MAX(wh2.title)         AS title,
      MAX(wh2.thumbnail)     AS thumbnail,
      MAX(wh2."channelName") AS "channelName",
      MAX(wh2."channelId")   AS "channelId",
      COUNT(*)::int          AS cnt
    FROM watch_history wh1
    JOIN watch_history wh2
      ON wh1."userId" = wh2."userId"
     AND wh2."videoId" != ${videoId}
    WHERE wh1."videoId" = ${videoId}
      AND wh2.title IS NOT NULL
    GROUP BY wh2."videoId"
    ORDER BY cnt DESC
    LIMIT 40
  `;

  // Channel: more videos from same channel (watched by any user)
  const channelCandidates = channelId
    ? await prisma.$queryRaw<
        Array<{ videoId: string; title: string; thumbnail: string; channelName: string; channelId: string }>
      >`
        SELECT DISTINCT ON (wh."videoId")
          wh."videoId",
          wh.title,
          wh.thumbnail,
          wh."channelName",
          wh."channelId"
        FROM watch_history wh
        WHERE wh."channelId" = ${channelId}
          AND wh."videoId"   != ${videoId}
          AND wh.title IS NOT NULL
        ORDER BY wh."videoId", wh."watchedAt" DESC
        LIMIT 20
      `
    : [];

  // Trending fill-in
  const trendingFill = await getTrendingCandidates(
    prisma,
    new Set([videoId, ...watchedIds, ...dislikedIds]),
    20
  );

  // Merge scores
  const scores = new Map<string, number>();
  for (const c of collabCandidates) {
    scores.set(c.videoId, (scores.get(c.videoId) ?? 0) + c.cnt * WEIGHTS.collaborative * 100);
  }
  for (const c of channelCandidates) {
    scores.set(c.videoId, (scores.get(c.videoId) ?? 0) + 50 * WEIGHTS.channel);
  }
  for (const t of trendingFill) {
    scores.set(t.id, (scores.get(t.id) ?? 0) + t.trendingScore * WEIGHTS.trending * 100);
  }

  // Filter watched & disliked
  for (const id of [...watchedIds, ...dislikedIds]) scores.delete(id);

  const ranked = [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30);

  // Build metadata
  const allIds = [...new Set([
    ...ranked.map(([id]) => id),
    ...collabCandidates.map((c) => c.videoId),
    ...channelCandidates.map((c) => c.videoId),
  ])];
  const metaMap = await buildMetadataMap(prisma, allIds);

  const getVideoMeta = (id: string) => {
    const m = metaMap.get(id);
    if (m) return m;
    const collab = collabCandidates.find((c) => c.videoId === id);
    if (collab)
      return { title: collab.title, thumbnail: collab.thumbnail, channelName: collab.channelName, channelId: collab.channelId };
    const ch = channelCandidates.find((c) => c.videoId === id);
    if (ch)
      return { title: ch.title, thumbnail: ch.thumbnail, channelName: ch.channelName, channelId: ch.channelId };
    return null;
  };

  const related: RecommendationItem[] = ranked
    .map(([id, score]): RecommendationItem | null => {
      const m = getVideoMeta(id);
      if (!m?.title) return null;
      const trending = trendingFill.find((t) => t.id === id);
      const src: RecommendationItem["source"] =
        collabCandidates.find((c) => c.videoId === id) ? "collaborative" : "category";
      return {
        id,
        title:       m.title,
        thumbnail:   m.thumbnail,
        channelName: m.channelName,
        channelId:   m.channelId,
        viewCount:   trending?.viewCount,
        publishedAt: trending?.publishedAt,
        duration:    trending?.duration,
        score,
        source:      src,
      };
    })
    .filter((x): x is RecommendationItem => x !== null)
    .slice(0, 20);

  // Pad with trending if not enough results
  if (related.length < 10) {
    for (const t of trendingFill) {
      if (related.length >= 20) break;
      if (!related.find((r) => r.id === t.id)) {
        related.push({ ...t, source: "trending" });
      }
    }
  }

  const result: VideoPageRecommendations = { related };
  await setCachedData(cacheKey, result, TTL_VIDEO_PAGE);
  return result;
}

// ─── Cache invalidation ────────────────────────────────────────────────────────

export async function invalidateUserRecommendations(userId: string): Promise<void> {
  await delCachedData(`user_recommendations:${userId}`);
}

export async function invalidateVideoRecommendations(videoId: string): Promise<void> {
  await delCachedData(`video_related:${videoId}`);
}
