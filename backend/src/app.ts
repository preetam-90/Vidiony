/**
 * Fastify application factory.
 * Registers all plugins, middleware, and routes.
 */

import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import jwt from "@fastify/jwt";
import cookie from "@fastify/cookie";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import rateLimit from "@fastify/rate-limit";
import websocket from "@fastify/websocket";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { env } from "./config/env.js";
import { toErrorResponse, AppError } from "./utils/errors.js";

// Plugins
import prismaPlugin from "./plugins/prisma.js";
import redisPlugin from "./plugins/redis.js";
import metricsPlugin from "./plugins/metrics.js";

// Modules
import authRoutes from "./modules/auth/auth.routes.js";
import youtubeModuleRoutes from "./modules/youtube/youtube.routes.js";
import videoRoutes from "./modules/videos/videos.routes.js";
import searchRoutes from "./modules/search/search.routes.js";
import channelRoutes from "./modules/channels/channels.routes.js";
import trendingRoutes from "./modules/trending/trending.routes.js";
import liveRoutes from "./modules/live/live.routes.js";
import userRoutes from "./modules/users/users.routes.js";
import proxyRoutes from "./routes/proxy.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function buildApp() {
  const app = Fastify({
    logger:
      env.NODE_ENV === "development"
        ? { transport: { target: "pino-pretty", options: { colorize: true } } }
        : true,
    trustProxy: true,
    bodyLimit: 10 * 1024 * 1024, // 10 MB
  });

  // ─── Infrastructure plugins ────────────────────────────────────────────────
  await app.register(redisPlugin);
  await app.register(prismaPlugin);
  await app.register(metricsPlugin);

  // ─── Security ─────────────────────────────────────────────────────────────
  await app.register(helmet, {
    crossOriginResourcePolicy: false, // allow media proxying
    contentSecurityPolicy: false,     // managed by frontend
  });

  await app.register(cors, {
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });

  // ─── Rate limiting (Redis store if available) ──────────────────────────────
  // NOTE: Disabled for streaming endpoints — HLS clients poll every 5s x 6 quality levels
  // Use route-level rate limit overrides instead of global disable for streaming routes
  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW_MS,
    // Allow streaming/proxy endpoints to bypass global limits
    allowList: (req) => req.url.startsWith('/proxy/') || req.url.startsWith('/live/'),
    skipOnError: true,
    keyGenerator: (req: any) => {
      const userId = (req as any).user?.id;
      return userId ? `user:${userId}` : req.ip;
    },
  });

  // ─── JWT ──────────────────────────────────────────────────────────────────
  await app.register(jwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: env.JWT_EXPIRES_IN },
  });

  await app.register(cookie);

  // ─── File uploads ─────────────────────────────────────────────────────────
  await app.register(multipart, {
    limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2 GB
  });

  // ─── Static files ─────────────────────────────────────────────────────────
  await app.register(fastifyStatic, {
    root: join(__dirname, "uploads"),
    prefix: "/uploads/",
  });

  // ─── WebSocket support ─────────────────────────────────────────────────────
  await app.register(websocket);

  // ─── Auth decorators ───────────────────────────────────────────────────────
  app.decorate("authenticate", async function (req: any, reply: any) {
    try {
      await req.jwtVerify();
    } catch {
      return reply.status(401).send({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Missing or invalid Authorization token" },
      });
    }
  });

  app.decorate("optionalAuthenticate", async function (req: any, _reply: any) {
    const token = req.headers?.authorization;
    if (!token) { req.user = null; return; }
    try {
      await req.jwtVerify();
    } catch {
      req.user = null;
    }
  });

  app.decorate("requireYouTube", async function (req: any, reply: any) {
    // First ensure JWT is valid
    try {
      await req.jwtVerify();
    } catch {
      return reply.status(401).send({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
    }

    // IMPORTANT: do not trust youtubeConnected from the JWT payload alone.
    // The user may have connected YouTube after the token was issued.
    const dbUser = await app.prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { youtubeConnected: true },
    });

    if (!dbUser?.youtubeConnected) {
      return reply.status(403).send({
        success: false,
        error: {
          code: "YOUTUBE_AUTH_REQUIRED",
          message: "A connected YouTube account is required. Connect via POST /auth/youtube/connect",
        },
      });
    }

    // Keep request.user in sync for downstream handlers
    req.user = {
      ...req.user,
      youtubeConnected: true,
    };
  });

  // ─── Global error handler ─────────────────────────────────────────────────
  app.setErrorHandler((err, req, reply) => {
    app.log.error({ err, url: req.url, method: req.method }, "Unhandled error");

    if (err instanceof AppError) {
      return reply.status(err.statusCode).send({
        success: false,
        error: { code: err.code, message: err.message, details: err.details },
      });
    }

    // @fastify/rate-limit
    if ((err as any).statusCode === 429) {
      return reply.status(429).send({
        success: false,
        error: { code: "RATE_LIMITED", message: "Too many requests. Please slow down." },
      });
    }

    const status = (err as any).statusCode ?? 500;
    const e = toErrorResponse(err);
    return reply.status(status).send({ success: false, error: e });
  });

  app.setNotFoundHandler((req, reply) => {
    reply.status(404).send({
      success: false,
      error: { code: "NOT_FOUND", message: `Route ${req.method} ${req.url} not found` },
    });
  });

  // ─── Health check ─────────────────────────────────────────────────────────
  app.get("/health", async (req, reply) => {
    const checks: Record<string, string> = {};

    // Database
    try {
      await app.prisma.$queryRaw`SELECT 1`;
      checks.database = "ok";
    } catch {
      checks.database = "error";
    }

    // Redis
    try {
      if (app.redis) {
        await app.redis.ping();
        checks.redis = "ok";
      } else {
        checks.redis = "disabled";
      }
    } catch {
      checks.redis = "error";
    }

    // YouTube API (quick connectivity test)
    try {
      const { getInnertube } = await import("./innertube.js");
      await getInnertube();
      checks.youtube_api = "ok";
    } catch {
      checks.youtube_api = "error";
    }

    const allOk = Object.values(checks).every((v) => v === "ok" || v === "disabled");
    const status = allOk ? "healthy" : "degraded";

    return reply.status(allOk ? 200 : 503).send({
      status,
      checks,
      timestamp: new Date().toISOString(),
      version: "2.0.0",
    });
  });

  // ─── Prometheus metrics ────────────────────────────────────────────────────
  app.get("/metrics", async (req, reply) => {
    reply.header("Content-Type", app.metrics.contentType);
    return reply.send(await app.metrics.metrics());
  });

  // ─── Route registration ────────────────────────────────────────────────────
  app.register(authRoutes,         { prefix: "/auth" });
  app.register(youtubeModuleRoutes, { prefix: "/api/yt" });
  app.register(videoRoutes,        { prefix: "/videos" });
  app.register(searchRoutes,       { prefix: "/search" });
  app.register(channelRoutes,      { prefix: "/channels" });
  app.register(trendingRoutes,     { prefix: "/trending" });
  app.register(liveRoutes,         { prefix: "/live" });
  app.register(userRoutes,         { prefix: "/user" });
  app.register(proxyRoutes,        { prefix: "/proxy" });

  return app;
}
