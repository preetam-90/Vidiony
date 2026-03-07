import { FastifyPluginAsync } from "fastify";
import Redis from "ioredis";

export const redis: Redis | null = process.env.REDIS_HOST
  ? new Redis({
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT || 6379),
      password: process.env.REDIS_PASSWORD || undefined,
      lazyConnect: false,
    })
  : null;

const redisPlugin: FastifyPluginAsync = async (fastify) => {
  if (!redis) {
    fastify.log.info("Redis disabled (REDIS_HOST not set)");
    return;
  }

  fastify.decorate("redis", redis);

  redis.on("connect", () => fastify.log.info("Redis client connecting..."));
  redis.on("ready", () => fastify.log.info("Redis client ready"));
  redis.on("error", (err) => fastify.log.error(err, "Redis error"));
};

export default redisPlugin;
