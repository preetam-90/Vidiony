/**
 * Fastify + JWT type augmentation — adds custom decorators to FastifyInstance,
 * FastifyRequest and FastifyReply so TypeScript knows about them.
 */

import type { PrismaClient } from "@prisma/client";
import type Redis from "ioredis";
import type { Registry } from "prom-client";

export interface JWTPayload {
  id: string;
  email: string;
  username: string;
  youtubeConnected: boolean;
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: JWTPayload;
    user: JWTPayload;
  }
}

declare module "fastify" {
  interface FastifyInstance {
    /** Prisma ORM client — registered by src/plugins/prisma.ts */
    prisma: PrismaClient;
    /** ioredis client — registered by src/plugins/redis.ts */
    redis: Redis | null;
    /** Prometheus registry — registered by src/plugins/metrics.ts */
    metrics: Registry;
    /**
     * Prehandler that verifies the JWT in the Authorization header and
     * populates `request.user`.  Throws 401 on failure.
     */
    authenticate: (request: import("fastify").FastifyRequest, reply: import("fastify").FastifyReply) => Promise<void>;
    /**
     * Prehandler that tries to verify the JWT but does NOT throw if missing.
     * `request.user` will be null if the token is absent/invalid.
     */
    optionalAuthenticate: (request: import("fastify").FastifyRequest, reply: import("fastify").FastifyReply) => Promise<void>;
    /**
     * Prehandler that requires a connected YouTube account.
     * Throws 403 if the user is not authenticated or has no YouTube connection.
     */
    requireYouTube: (request: import("fastify").FastifyRequest, reply: import("fastify").FastifyReply) => Promise<void>;
  }

  interface FastifyRequest {
    /** Populated by the `authenticate` / `optionalAuthenticate` prehandlers */
    user: JWTPayload | null;
  }
}
