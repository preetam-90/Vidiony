/**
 * Auth routes — /auth/*
 *
 * Google OAuth authentication system:
 *   - Google OAuth2 for login (includes YouTube scopes)
 *   - JWT access tokens + httpOnly refresh token cookies
 *   - Session management
 */

import type { FastifyPluginAsync } from "fastify";
import { env } from "../../config/env.js";
import { toErrorResponse } from "../../utils/errors.js";
import {
  issueAccessToken,
  issueRefreshToken,
  refreshAccessToken,
  logoutUser,
  getGoogleLoginUrl,
  exchangeGoogleLoginCode,
  findOrCreateGoogleUser,
  getUserSessions,
  deleteAllSessionsForUser,
} from "./auth.service.js";
import { invalidateUser } from "../../services/innertube-cache.js";

const REFRESH_COOKIE = "vidion_refresh";
const ACCESS_COOKIE = "access_token";
const ACCESS_MAX_AGE_SEC = 15 * 60; // 15 minutes
const REFRESH_MAX_AGE_SEC = 30 * 86_400; // 30 days

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // ─── Refresh ──────────────────────────────────────────────────────────────
  fastify.post(
    "/refresh",
    {
      // refresh rate limit: 10 requests per minute
      config: { rateLimit: { max: 10, timeWindow: 60_000 } },
    },
    async (req, reply) => {
      // Accept token from cookie OR request body
      const rawToken: string | undefined =
        req.cookies?.[REFRESH_COOKIE] ||
        (req.body as Record<string, string>)?.refreshToken;

      if (!rawToken) {
        return reply.status(401).send({
          success: false,
          error: { code: "NO_REFRESH_TOKEN", message: "Refresh token not provided" },
        });
      }

      try {
        const { accessToken, refreshToken } = await refreshAccessToken(fastify, fastify.prisma, rawToken);

        // Rotate cookies
        reply.setCookie(ACCESS_COOKIE, accessToken, {
          httpOnly: true,
          secure: env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: ACCESS_MAX_AGE_SEC,
        });

        reply.setCookie(REFRESH_COOKIE, refreshToken, {
          httpOnly: true,
          secure: env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: REFRESH_MAX_AGE_SEC,
        });

        return reply.send({ success: true });
      } catch (err) {
        const e = toErrorResponse(err);
        return reply.status(401).send({ success: false, error: e });
      }
    }
  );

  // ─── Logout ───────────────────────────────────────────────────────────────
  fastify.post("/logout", {
    preHandler: [fastify.authenticate],
  }, async (req, reply) => {
    const rawToken: string | undefined = req.cookies?.[REFRESH_COOKIE];
    await logoutUser(fastify.prisma, req.user!.id, rawToken);
    invalidateUser(req.user!.id);

    reply.clearCookie(REFRESH_COOKIE, { path: "/" });
    reply.clearCookie(ACCESS_COOKIE, { path: "/" });
    return reply.send({ success: true, message: "Logged out" });
  });

  // Logout from all sessions
  fastify.post("/logout-all", {
    preHandler: [fastify.authenticate],
  }, async (req, reply) => {
    await logoutUser(fastify.prisma, req.user!.id);
    invalidateUser(req.user!.id);
    reply.clearCookie(REFRESH_COOKIE, { path: "/" });
    reply.clearCookie(ACCESS_COOKIE, { path: "/" });
    return reply.send({ success: true, message: "Logged out from all sessions" });
  });

  // ─── Me ───────────────────────────────────────────────────────────────────
  fastify.get("/me", {
    preHandler: [fastify.authenticate],
  }, async (req, reply) => {
    const user = await fastify.prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true, email: true, username: true, name: true,
        avatar: true, bio: true, verified: true,
        youtubeConnected: true, youtubeChannelId: true, youtubeHandle: true,
        createdAt: true,
      },
    });

    if (!user) return reply.status(404).send({ success: false, error: { code: "NOT_FOUND", message: "User not found" } });
    return reply.send({ success: true, user });
  });

  // ─── Google: start login (profile + YouTube in one flow) ─────────────────
  fastify.get("/google", async (req, reply) => {
    try {
      const url = getGoogleLoginUrl();
      return reply.redirect(url);
    } catch (err) {
      return reply.status(503).send({
        success: false,
        error: { code: "GOOGLE_OAUTH_NOT_CONFIGURED", message: (err as Error).message },
      });
    }
  });

  // ─── Google: OAuth callback ────────────────────────────────────────────────
  fastify.get("/google/callback", async (req, reply) => {
    const query = req.query as Record<string, string>;

    if (query.error) {
      return reply.redirect(`${env.FRONTEND_URL}/auth/login?error=${encodeURIComponent(query.error)}`);
    }
    if (!query.code) {
      return reply.redirect(`${env.FRONTEND_URL}/auth/login?error=missing_code`);
    }

    try {
      const { tokens, profile } = await exchangeGoogleLoginCode(query.code);
      const grantedScopes = (tokens.scope || "").split(/\s+/).filter(Boolean);
      const requiredScopes = [
        "https://www.googleapis.com/auth/youtube",
        "https://www.googleapis.com/auth/youtube.readonly",
      ];
      const hasRequiredScopes = requiredScopes.every((scope) => grantedScopes.includes(scope));

      if (!tokens.access_token || !hasRequiredScopes) {
        return reply.redirect(
          `${env.FRONTEND_URL}/auth/error?code=YOUTUBE_PERMISSIONS_REQUIRED`
        );
      }

      const user = await findOrCreateGoogleUser(fastify.prisma, profile, tokens);

      const accessToken = issueAccessToken(fastify, user);
      const refreshToken = await issueRefreshToken(fastify.prisma, user.id, {
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      // Set access and refresh token cookies (HttpOnly)
      reply.setCookie(ACCESS_COOKIE, accessToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: ACCESS_MAX_AGE_SEC,
      });

      reply.setCookie(REFRESH_COOKIE, refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: REFRESH_MAX_AGE_SEC,
      });

      // Redirect to frontend — frontend can now call /auth/me to get user
      return reply.redirect(`${env.FRONTEND_URL}/auth/callback`);
    } catch (err) {
      fastify.log.error(err, "Google OAuth callback error");
      return reply.redirect(`${env.FRONTEND_URL}/auth/login?error=google_failed`);
    }
  });

  // ─── Session management endpoints ─────────────────────────────────────────
  fastify.get("/sessions", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    const sessions = await getUserSessions(fastify.prisma, req.user!.id);
    return reply.send({ success: true, sessions });
  });

  fastify.delete("/session/:id", { preHandler: [fastify.authenticate] }, async (req: any, reply) => {
    const id = req.params.id as string;

    // Ensure session exists and belongs to user
    const session = await fastify.prisma.userSession.findUnique({ where: { id }, select: { id: true, userId: true, tokenHash: true } });
    if (!session || session.userId !== req.user!.id) {
      return reply.status(404).send({ success: false, error: { code: "NOT_FOUND", message: "Session not found" } });
    }

    // Determine if this session is the current client's session (compare cookie)
    let isCurrent = false;
    const rawToken = req.cookies?.[REFRESH_COOKIE];
    if (rawToken) {
      try {
        const bcrypt = await import("bcryptjs");
        if (await bcrypt.compare(rawToken, session.tokenHash)) isCurrent = true;
      } catch {}
    }

    await fastify.prisma.userSession.delete({ where: { id } });

    if (isCurrent) {
      reply.clearCookie(REFRESH_COOKIE, { path: "/" });
      reply.clearCookie(ACCESS_COOKIE, { path: "/" });
    }

    return reply.send({ success: true });
  });

  fastify.delete("/sessions", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    await deleteAllSessionsForUser(fastify.prisma, req.user!.id);
    reply.clearCookie(REFRESH_COOKIE, { path: "/" });
    reply.clearCookie(ACCESS_COOKIE, { path: "/" });
    return reply.send({ success: true });
  });

};

export default authRoutes;
