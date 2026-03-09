/**
 * Application entry point.
 * Loads environment, builds the Fastify app, and starts the HTTP server.
 */

import "dotenv/config";
import { env } from "./config/env.js";
import { buildApp } from "./app.js";

const app = await buildApp();

const start = async () => {
  try {
    const address = await app.listen({
      port: env.PORT,
      host: "0.0.0.0",
    });

    app.log.info(`🎬 Vidion backend listening at ${address}`);
    app.log.info(`   Health: ${address}/health`);
    app.log.info(`   Metrics: ${address}/metrics`);
    app.log.info(`   YouTube API: ${address}/api/yt`);
    app.log.info(`   ENV: ${env.NODE_ENV}`);
  } catch (err) {
    app.log.error(err, "Failed to start server");
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async (signal: string) => {
  app.log.info(`${signal} received, shutting down gracefully...`);
  await app.close();
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("uncaughtException", (err) => {
  app.log.error(err, "Uncaught exception");
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  app.log.error({ reason }, "Unhandled promise rejection");
  process.exit(1);
});

await start();
