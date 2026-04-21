import type { FastifyInstance } from "fastify";
import FastifySwagger from "@fastify/swagger";
import FastifySwaggerUi from "@fastify/swagger-ui";

export async function swaggerPlugin(fastify: FastifyInstance) {
  await fastify.register(FastifySwagger, {
    openapi: {
      info: {
        title: "Vidiony API",
        version: "1.0.0",
      },
      servers: [
        {
          url: "http://localhost:4000",
          description: "Local development server",
        },
      ],
    },
  });

  await fastify.register(FastifySwaggerUi, {
    routePrefix: "/docs",
    staticCSP: true,
  });
}
