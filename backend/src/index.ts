import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import { authRoutes } from "./routes/auth.js";
import { videoRoutes } from "./routes/videos.js";
import { userRoutes } from "./routes/users.js";
import { connectDB } from "./utils/db.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({
  logger: true,
});

// Register plugins
await fastify.register(cors, {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
});

await fastify.register(jwt, {
  secret: process.env.JWT_SECRET || "your-secret-key",
  sign: {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },
});

await fastify.register(multipart, {
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || "2147483648"), // 2GB default
  },
});

await fastify.register(fastifyStatic, {
  root: path.join(__dirname, "uploads"),
  prefix: "/uploads/",
});

// Decorate fastify with authenticate function
fastify.decorate("authenticate", async function (request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ message: "Unauthorized" });
  }
});

// Health check route
fastify.get("/health", async () => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

import youtubeModuleRoutes from "./modules/youtube/youtube.routes.js";
import proxyRoutes from "./routes/proxy.js";
import redisPlugin from "./plugins/redis.js";

// Register plugins & routes
await fastify.register(redisPlugin);

// App routes
fastify.register(authRoutes,          { prefix: "/api/auth" });
fastify.register(videoRoutes,         { prefix: "/api/videos" });
fastify.register(userRoutes,          { prefix: "/api/users" });

// YouTube / InnerTube routes
fastify.register(youtubeModuleRoutes, { prefix: "/api/yt" });

// Byte-streaming CORS proxy — used by the frontend <video> element
fastify.register(proxyRoutes,         { prefix: "/proxy" });

// Start server
const start = async () => {
  try {
    // Connect to database (TEMPORARILY DISABLED FOR YOUTUBE API)
    // await connectDB();

    const port = parseInt(process.env.PORT || "4000", 10);
    await fastify.listen({ port, host: "0.0.0.0" });
    console.log(`Server running on http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

