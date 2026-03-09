/**
 * Prisma plugin — makes `fastify.prisma` available everywhere.
 * Gracefully degrades if the database is unreachable (non-blocking startup).
 */

import fp from "fastify-plugin";
import { PrismaClient } from "@prisma/client";
import type { FastifyPluginAsync } from "fastify";

const prismaPlugin: FastifyPluginAsync = fp(async (fastify) => {
  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

  try {
    await prisma.$connect();
    fastify.log.info("Prisma connected to database");
  } catch (err) {
    fastify.log.warn({ err }, "Prisma: database unavailable — some features will not work");
  }

  fastify.decorate("prisma", prisma);

  fastify.addHook("onClose", async () => {
    await prisma.$disconnect();
  });
}, {
  name: "prisma-plugin",
});

export default prismaPlugin;
