/**
 * Auth service — business logic for registration, login, token lifecycle,
 * and YouTube OAuth2 connection.
 */

import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { env } from "../../config/env.js";
import { ConflictError, AuthError, NotFoundError } from "../../utils/errors.js";
import { encryptJson, decryptJson } from "../../utils/crypto.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface YouTubeTokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number; // ms timestamp
  token_type: string;
  scope: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseRefreshMs(): number {
  const val = env.JWT_REFRESH_EXPIRES_IN; // e.g. "7d", "24h", "3600"
  if (/^\d+$/.test(val)) return parseInt(val, 10) * 1000;
  const unit = val.slice(-1);
  const n = parseInt(val.slice(0, -1), 10);
  if (unit === "d") return n * 86_400_000;
  if (unit === "h") return n * 3_600_000;
  if (unit === "m") return n * 60_000;
  return 7 * 86_400_000; // fallback 7 days
}

function generateRefreshToken(): string {
  return randomBytes(40).toString("hex");
}

// ─── Registration ─────────────────────────────────────────────────────────────

export async function registerUser(
  prisma: PrismaClient,
  { email, username, password, name }: { email: string; username: string; password: string; name?: string }
) {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { id: true, email: true, username: true },
  });

  if (existing) {
    const field = existing.email === email ? "email" : "username";
    throw new ConflictError(`A user with this ${field} already exists`);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  return prisma.user.create({
    data: { email, username, password: passwordHash, name },
    select: {
      id: true, email: true, username: true, name: true,
      avatar: true, verified: true, youtubeConnected: true, createdAt: true,
    },
  });
}

// ─── Login ────────────────────────────────────────────────────────────────────
export async function loginUser(
  prisma: PrismaClient,
  { email, password }: { email: string; password: string }
) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true, email: true, username: true, name: true,
      avatar: true, verified: true, password: true, youtubeConnected: true,
    },
  });

  if (!user) throw new AuthError("Invalid email or password", "INVALID_CREDENTIALS");

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new AuthError("Invalid email or password", "INVALID_CREDENTIALS");

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _pw, ...safeUser } = user;
  return safeUser;
}

// ─── Token issuance ───────────────────────────────────────────────────────────

export function issueAccessToken(
  fastify: FastifyInstance,
  user: { id: string; email: string; username: string; youtubeConnected: boolean }
): string {
  return fastify.jwt.sign(
    { id: user.id, email: user.email, username: user.username, youtubeConnected: user.youtubeConnected } as any,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}

export async function issueRefreshToken(
  prisma: PrismaClient,
  userId: string,
  meta?: { ipAddress?: string; userAgent?: string }
): Promise<string> {
  const raw = generateRefreshToken();
  const tokenHash = await bcrypt.hash(raw, 10);
  const expiresAt = new Date(Date.now() + parseRefreshMs());

  await prisma.userSession.create({
    data: { userId, tokenHash, expiresAt, ...meta },
  });

  return raw;
}

// ─── Refresh token validation ─────────────────────────────────────────────────

export async function refreshAccessToken(
  fastify: FastifyInstance,
  prisma: PrismaClient,
  rawToken: string
): Promise<{ accessToken: string; refreshToken: string }> {
  // Find all non-expired sessions — we compare each hash (can't query by hash)
  const sessions = await prisma.userSession.findMany({
    where: { expiresAt: { gt: new Date() } },
    include: {
      user: {
        select: {
          id: true, email: true, username: true,
          youtubeConnected: true, avatar: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20, // safety cap
  });

  let matched: (typeof sessions)[0] | null = null;
  for (const session of sessions) {
    const ok = await bcrypt.compare(rawToken, session.tokenHash);
    if (ok) { matched = session; break; }
  }

  if (!matched) throw new AuthError("Invalid or expired refresh token", "INVALID_REFRESH_TOKEN");

  const { user } = matched;

  // Rotate: delete old session, issue new one
  await prisma.userSession.delete({ where: { id: matched.id } });
  const newRaw = await issueRefreshToken(prisma, user.id);

  return {
    accessToken: issueAccessToken(fastify, user),
    refreshToken: newRaw,
  };
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logoutUser(
  prisma: PrismaClient,
  userId: string,
  rawToken?: string
): Promise<void> {
  if (!rawToken) {
    // Invalidate ALL sessions for this user
    await prisma.userSession.deleteMany({ where: { userId } });
    return;
  }

  // Invalidate only the specific session
  const sessions = await prisma.userSession.findMany({
    where: { userId },
    select: { id: true, tokenHash: true },
  });
  for (const s of sessions) {
    if (await bcrypt.compare(rawToken, s.tokenHash)) {
      await prisma.userSession.delete({ where: { id: s.id } });
      return;
    }
  }
}

// ─── YouTube OAuth2 ───────────────────────────────────────────────────────────

export function getYouTubeAuthUrl(state?: string): string {
  if (!env.YOUTUBE_CLIENT_ID || !env.YOUTUBE_CLIENT_SECRET || !env.YOUTUBE_REDIRECT_URI) {
    throw new Error("YouTube OAuth2 credentials are not configured");
  }

  const params = new URLSearchParams({
    client_id: env.YOUTUBE_CLIENT_ID,
    redirect_uri: env.YOUTUBE_REDIRECT_URI,
    response_type: "code",
    scope: [
      "https://www.googleapis.com/auth/youtube",
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/youtube.force-ssl",
    ].join(" "),
    access_type: "offline",
    prompt: "consent",
    ...(state ? { state } : {}),
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeYouTubeCode(code: string): Promise<YouTubeTokens> {
  if (!env.YOUTUBE_CLIENT_ID || !env.YOUTUBE_CLIENT_SECRET || !env.YOUTUBE_REDIRECT_URI) {
    throw new Error("YouTube OAuth2 credentials are not configured");
  }

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.YOUTUBE_CLIENT_ID,
      client_secret: env.YOUTUBE_CLIENT_SECRET,
      redirect_uri: env.YOUTUBE_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new AuthError(`YouTube OAuth2 exchange failed: ${body}`, "YOUTUBE_OAUTH_FAILED");
  }

  const data = (await resp.json()) as Record<string, unknown>;
  return {
    access_token: data.access_token as string,
    refresh_token: data.refresh_token as string,
    expiry_date: Date.now() + (Number(data.expires_in) || 3600) * 1000,
    token_type: (data.token_type as string) || "Bearer",
    scope: (data.scope as string) || "",
  };
}

export async function refreshYouTubeToken(refreshToken: string): Promise<YouTubeTokens> {
  if (!env.YOUTUBE_CLIENT_ID || !env.YOUTUBE_CLIENT_SECRET) {
    throw new Error("YouTube OAuth2 credentials are not configured");
  }

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: env.YOUTUBE_CLIENT_ID,
      client_secret: env.YOUTUBE_CLIENT_SECRET,
      grant_type: "refresh_token",
    }),
  });

  if (!resp.ok) {
    throw new AuthError("YouTube token refresh failed", "YOUTUBE_REFRESH_FAILED");
  }

  const data = (await resp.json()) as Record<string, unknown>;
  return {
    access_token: data.access_token as string,
    refresh_token: refreshToken, // may not be rotated
    expiry_date: Date.now() + (Number(data.expires_in) || 3600) * 1000,
    token_type: (data.token_type as string) || "Bearer",
    scope: (data.scope as string) || "",
  };
}

/** Fetch the user's YouTube channel info (id + handle) using the access token. */
export async function getYouTubeChannelInfo(
  accessToken: string
): Promise<{ channelId: string; handle: string }> {
  const resp = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!resp.ok) throw new Error("Failed to fetch YouTube channel info");

  const data = (await resp.json()) as {
    items?: Array<{ id: string; snippet: { customUrl?: string } }>;
  };

  const item = data.items?.[0];
  if (!item) throw new NotFoundError("YouTube channel");

  return {
    channelId: item.id,
    handle: item.snippet.customUrl ?? "",
  };
}

/** Retrieve decrypted YouTube tokens for a user, refreshing if close to expiry. */
export async function getUserYouTubeTokens(
  prisma: PrismaClient,
  userId: string
): Promise<YouTubeTokens | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { youtubeTokens: true, youtubeConnected: true },
  });

  if (!user?.youtubeConnected || !user.youtubeTokens) return null;

  const tokens = decryptJson<YouTubeTokens>(user.youtubeTokens);
  if (!tokens) return null;

  // Refresh if expires within 5 minutes
  if (tokens.expiry_date - Date.now() < 300_000) {
    try {
      const refreshed = await refreshYouTubeToken(tokens.refresh_token);
      await prisma.user.update({
        where: { id: userId },
        data: { youtubeTokens: encryptJson(refreshed) },
      });
      return refreshed;
    } catch {
      return tokens; // return potentially stale token — better than nothing
    }
  }

  return tokens;
}

// ─── Google Login (profile + YouTube in one OAuth flow) ───────────────────────

// Resolve credentials — prefer GOOGLE_* vars, fall back to YOUTUBE_* aliases
function googleCreds() {
  const clientId = env.GOOGLE_CLIENT_ID || env.YOUTUBE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET || env.YOUTUBE_CLIENT_SECRET;
  const redirectUri = env.GOOGLE_REDIRECT_URI || "http://localhost:4000/auth/google/callback";
  if (!clientId || !clientSecret) throw new Error("Google OAuth credentials not configured");
  return { clientId, clientSecret, redirectUri };
}

/** Combined Google + YouTube scopes — one consent screen covers both */
const GOOGLE_LOGIN_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/youtube",
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/youtube.force-ssl",
].join(" ");

export function getGoogleLoginUrl(state?: string): string {
  const { clientId, redirectUri } = googleCreds();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_LOGIN_SCOPES,
    access_type: "offline",
    prompt: "consent select_account",
    ...(state ? { state } : {}),
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export interface GoogleProfile {
  sub: string;        // Google user ID
  email: string;
  email_verified: boolean;
  name: string;
  given_name?: string;
  picture?: string;   // avatar URL
}

export async function exchangeGoogleLoginCode(
  code: string
): Promise<{ tokens: YouTubeTokens; profile: GoogleProfile }> {
  const { clientId, clientSecret, redirectUri } = googleCreds();

  // Exchange code for tokens
  const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResp.ok) {
    const err = await tokenResp.text();
    throw new Error(`Google token exchange failed: ${err}`);
  }

  const tokenData = (await tokenResp.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
    scope: string;
    id_token?: string;
  };

  const tokens: YouTubeTokens = {
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token ?? "",
    expiry_date: Date.now() + tokenData.expires_in * 1000,
    token_type: tokenData.token_type,
    scope: tokenData.scope,
  };

  // Fetch Google profile using the access token
  const profileResp = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  if (!profileResp.ok) throw new Error("Failed to fetch Google profile");
  const profile = (await profileResp.json()) as GoogleProfile;

  return { tokens, profile };
}

/** Find existing user by Google sub/email, or create a new one. Always updates tokens. */
export async function findOrCreateGoogleUser(
  prisma: PrismaClient,
  profile: GoogleProfile,
  tokens: YouTubeTokens
): Promise<{ id: string; email: string; username: string; name: string | null; avatar: string | null; verified: boolean; youtubeConnected: boolean }> {
  // Try by googleId first, then by email
  let user = await prisma.user.findFirst({
    where: { OR: [{ googleId: profile.sub }, { email: profile.email }] },
  });

  // Fetch YouTube channel info for channelId/handle
  let channelId: string | null = null;
  let handle: string | null = null;
  try {
    const ch = await getYouTubeChannelInfo(tokens.access_token);
    channelId = ch.channelId;
    handle = ch.handle;
  } catch { /* non-fatal */ }

  const encryptedTokens = encryptJson(tokens);

  if (user) {
    // Update tokens and profile fields on every login
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        googleId: profile.sub,
        avatar: profile.picture ?? user.avatar,
        name: profile.name ?? user.name,
        youtubeTokens: encryptedTokens,
        youtubeConnected: true,
        youtubeChannelId: channelId ?? user.youtubeChannelId,
        youtubeHandle: handle ?? user.youtubeHandle,
      },
    });
  } else {
    // Brand new user — derive a unique username from email
    const baseUsername = profile.email.split("@")[0]!.replace(/[^a-z0-9_]/gi, "").toLowerCase().slice(0, 24);
    let username = baseUsername;
    let suffix = 0;
    while (await prisma.user.findUnique({ where: { username } })) {
      suffix++;
      username = `${baseUsername}${suffix}`;
    }

    user = await prisma.user.create({
      data: {
        email: profile.email,
        username,
        // No password — Google users can't use email/password login
        password: "",
        name: profile.name,
        avatar: profile.picture ?? null,
        googleId: profile.sub,
        verified: profile.email_verified ?? false,
        youtubeTokens: encryptedTokens,
        youtubeConnected: true,
        youtubeChannelId: channelId,
        youtubeHandle: handle,
      },
    });
  }

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    name: user.name,
    avatar: user.avatar,
    verified: user.verified,
    youtubeConnected: true,
  };
}
