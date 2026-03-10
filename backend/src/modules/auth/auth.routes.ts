/**
 * Auth routes — /auth/*
 *
 * Dual authentication system:
 *   1. Vidion JWT accounts (register / login / refresh / logout)
 *   2. YouTube OAuth2 connection (connect / callback / disconnect)
 */

import type { FastifyPluginAsync } from "fastify";
import { env } from "../../config/env.js";
import { toErrorResponse } from "../../utils/errors.js";
import { encryptJson } from "../../utils/crypto.js";
import {
  RegisterBodySchema,
  LoginBodySchema,
} from "./auth.schemas.js";
import {
  registerUser,
  loginUser,
  issueAccessToken,
  issueRefreshToken,
  refreshAccessToken,
  logoutUser,
  getYouTubeAuthUrl,
  exchangeYouTubeCode,
  getYouTubeChannelInfo,
  getUserYouTubeTokens,
  getGoogleLoginUrl,
  exchangeGoogleLoginCode,
  findOrCreateGoogleUser,
} from "./auth.service.js";

const REFRESH_COOKIE = "vidion_refresh";
const ACCESS_COOKIE = "access_token";
const ACCESS_MAX_AGE_SEC = 15 * 60; // 15 minutes
const REFRESH_MAX_AGE_SEC = 30 * 86_400; // 30 days

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // ─── Register ─────────────────────────────────────────────────────────────
  fastify.post(
    "/register",
    {
      // signup rate limit: 3 requests per minute per IP
      config: { rateLimit: { max: 3, timeWindow: 60_000 } },
    },
    async (req, reply) => {
      const parsed = RegisterBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.flatten() },
        });
      }

      try {
        const user = await registerUser(fastify.prisma, parsed.data);
        const accessToken = issueAccessToken(fastify, { ...user, youtubeConnected: false });
        const refreshToken = await issueRefreshToken(fastify.prisma, user.id, {
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
        });

        // Set access token cookie (HttpOnly)
        reply.setCookie(ACCESS_COOKIE, accessToken, {
          httpOnly: true,
          secure: env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: ACCESS_MAX_AGE_SEC,
        });

        // Set refresh token cookie (HttpOnly)
        reply.setCookie(REFRESH_COOKIE, refreshToken, {
          httpOnly: true,
          secure: env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: REFRESH_MAX_AGE_SEC,
        });

        return reply.status(201).send({ success: true, user });
      } catch (err) {
        const e = toErrorResponse(err);
        return reply.status(err instanceof Error && "statusCode" in err ? (err as any).statusCode : 400)
          .send({ success: false, error: e });
      }
    }
  );

  // ─── Login ────────────────────────────────────────────────────────────────
  fastify.post(
    "/login",
    {
      // login rate limit: 5 requests per minute per IP
      config: { rateLimit: { max: 5, timeWindow: 60_000 } },
    },
    async (req, reply) => {
      const parsed = LoginBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.flatten() },
        });
      }

      try {
        const user = await loginUser(fastify.prisma, parsed.data);
        const accessToken = issueAccessToken(fastify, user);
        const refreshToken = await issueRefreshToken(fastify.prisma, user.id, {
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
        });

        // Set access token cookie (HttpOnly)
        reply.setCookie(ACCESS_COOKIE, accessToken, {
          httpOnly: true,
          secure: env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: ACCESS_MAX_AGE_SEC,
        });

        // Set refresh token cookie (HttpOnly)
        reply.setCookie(REFRESH_COOKIE, refreshToken, {
          httpOnly: true,
          secure: env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: REFRESH_MAX_AGE_SEC,
        });

        return reply.send({ success: true, user });
      } catch (err) {
        const e = toErrorResponse(err);
        const status = err instanceof Error && "statusCode" in err ? (err as any).statusCode : 401;
        return reply.status(status).send({ success: false, error: e });
      }
    }
  );

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

    reply.clearCookie(REFRESH_COOKIE, { path: "/" });
    reply.clearCookie(ACCESS_COOKIE, { path: "/" });
    return reply.send({ success: true, message: "Logged out" });
  });

  // Logout from all sessions
  fastify.post("/logout-all", {
    preHandler: [fastify.authenticate],
  }, async (req, reply) => {
    await logoutUser(fastify.prisma, req.user!.id);
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

  // ─── YouTube: start OAuth flow ────────────────────────────────────────────
  fastify.post("/youtube/connect", {
    preHandler: [fastify.authenticate],
  }, async (req, reply) => {
    try {
      const state = Buffer.from(req.user!.id).toString("base64url");
      const authUrl = getYouTubeAuthUrl(state);
      return reply.send({ success: true, authUrl });
    } catch (err) {
      return reply.status(503).send({
        success: false,
        error: { code: "YOUTUBE_OAUTH_NOT_CONFIGURED", message: (err as Error).message },
      });
    }
  });

  // ─── YouTube: OAuth callback ──────────────────────────────────────────────
  fastify.get("/youtube/callback", async (req, reply) => {
    const query = req.query as Record<string, string>;

    if (query.error) {
      return reply.redirect(`${env.FRONTEND_URL}/settings?yt_error=${encodeURIComponent(query.error)}`);
    }

    if (!query.code) {
      return reply.status(400).send({ success: false, error: { code: "MISSING_CODE", message: "No code in callback" } });
    }

    // Decode userId from state
    let userId: string;
    try {
      userId = Buffer.from(query.state || "", "base64url").toString("utf8");
      if (!userId) throw new Error("empty state");
    } catch {
      return reply.status(400).send({ success: false, error: { code: "INVALID_STATE", message: "Invalid OAuth state" } });
    }

    try {
      const tokens = await exchangeYouTubeCode(query.code);
      const channel = await getYouTubeChannelInfo(tokens.access_token);

      await fastify.prisma.user.update({
        where: { id: userId },
        data: {
          youtubeTokens: encryptJson(tokens),
          youtubeConnected: true,
          youtubeChannelId: channel.channelId,
          youtubeHandle: channel.handle,
        },
      });

      return reply.redirect(`${env.FRONTEND_URL}/settings?yt_connected=1`);
    } catch (err) {
      fastify.log.error(err, "YouTube OAuth callback error");
      return reply.redirect(`${env.FRONTEND_URL}/settings?yt_error=exchange_failed`);
    }
  });

  // ─── YouTube: disconnect ──────────────────────────────────────────────────
  fastify.post("/youtube/disconnect", {
    preHandler: [fastify.authenticate],
  }, async (req, reply) => {
    await fastify.prisma.user.update({
      where: { id: req.user!.id },
      data: {
        youtubeTokens: null,
        youtubeConnected: false,
        youtubeChannelId: null,
        youtubeHandle: null,
      },
    });

    return reply.send({ success: true, message: "YouTube account disconnected" });
  });

  // ─── YouTube: get auth status ─────────────────────────────────────────────
  fastify.get("/youtube/status", {
    preHandler: [fastify.authenticate],
  }, async (req, reply) => {
    const user = await fastify.prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { youtubeConnected: true, youtubeChannelId: true, youtubeHandle: true },
    });

    if (!user) return reply.status(404).send({ success: false, error: { code: "NOT_FOUND", message: "User not found" } });

    if (!user.youtubeConnected) {
      const authUrl = env.YOUTUBE_CLIENT_ID
        ? getYouTubeAuthUrl(Buffer.from(req.user!.id).toString("base64url"))
        : null;
      return reply.send({ success: true, connected: false, authUrl });
    }

    // Check token validity
    const tokens = await getUserYouTubeTokens(fastify.prisma, req.user!.id);
    return reply.send({
      success: true,
      connected: true,
      channelId: user.youtubeChannelId,
      handle: user.youtubeHandle,
      tokenValid: tokens !== null,
    });
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
    // Clear cookies for current client
    reply.clearCookie(REFRESH_COOKIE, { path: "/" });
    reply.clearCookie(ACCESS_COOKIE, { path: "/" });
    return reply.send({ success: true });
  });
};

export default authRoutes;
