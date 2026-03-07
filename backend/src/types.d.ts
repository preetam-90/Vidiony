import "fastify";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    // Redis client injected by plugins/redis.ts (ioredis)
    redis?: any;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      id: string;
      email: string;
      username: string;
    };
    user: {
      id: string;
      email: string;
      username: string;
    };
  }
}
