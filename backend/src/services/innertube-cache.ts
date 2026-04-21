import { Innertube } from "youtubei.js";
import { env } from "../config/env.js";
import {
  getUserYouTubeTokens,
  type YouTubeTokens,
} from "../modules/auth/auth.service.js";

type CacheEntry = {
  yt: Innertube;
  expiresAt: number;
  tokens: YouTubeTokens;
};

const TTL_MS = 30 * 60 * 1000;
const REFRESH_WINDOW_MS = 5 * 60 * 1000;

const innertubeByUser = new Map<string, CacheEntry>();

function isExpiringSoon(expiresAt: number): boolean {
  return expiresAt - Date.now() <= REFRESH_WINDOW_MS;
}

function resolveOAuthClient() {
  const clientId = env.GOOGLE_CLIENT_ID || env.YOUTUBE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET || env.YOUTUBE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return undefined;

  return {
    client_id: clientId,
    client_secret: clientSecret,
  };
}

async function createAuthenticatedInnertube(tokens: YouTubeTokens): Promise<Innertube> {
  const yt = await Innertube.create();
  await yt.session.signIn({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: new Date(tokens.expiry_date).toISOString(),
    token_type: tokens.token_type ?? "Bearer",
    scope: tokens.scope ?? "",
    client: resolveOAuthClient(),
  });

  return yt;
}

export function invalidateUser(userId: string): void {
  innertubeByUser.delete(userId);
}

export async function getInnertubeForUser(
  prisma: { user: { findUnique: unknown } },
  userId: string
): Promise<Innertube> {
  const cached = innertubeByUser.get(userId);
  if (cached && !isExpiringSoon(cached.expiresAt)) {
    return cached.yt;
  }

  const tokens = await getUserYouTubeTokens(prisma as any, userId);
  if (!tokens) {
    throw new Error("YOUTUBE_AUTH_REQUIRED");
  }

  // if tokens were auto-refreshed in getUserYouTubeTokens, use the latest values
  const nextTokens = tokens;
  const yt = await createAuthenticatedInnertube(nextTokens);
  innertubeByUser.set(userId, {
    yt,
    tokens: nextTokens,
    expiresAt: Date.now() + TTL_MS,
  });

  return yt;
}
