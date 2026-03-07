import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../utils/db.js";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().optional(),
  bio: z.string().optional(),
});

interface UserParams {
  id: string;
}

export async function userRoutes(fastify: FastifyInstance) {
  // Get user profile
  fastify.get<{ Params: UserParams }>(
    "/:id",
    async (request: FastifyRequest<{ Params: UserParams }>, reply: FastifyReply) => {
      const user = await prisma.user.findUnique({
        where: { id: request.params.id },
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
          bio: true,
          verified: true,
          createdAt: true,
          _count: {
            select: {
              subscribers: true,
              subscriptions: true,
              videos: true,
            },
          },
        },
      });

      if (!user) {
        return reply.status(404).send({ message: "User not found" });
      }

      return reply.send({ user });
    }
  );

  // Get user videos
  fastify.get<{ Params: UserParams }>(
    "/:id/videos",
    async (request: FastifyRequest<{ Params: UserParams }>, reply: FastifyReply) => {
      const page = parseInt((request.query as any).page || "1");
      const limit = parseInt((request.query as any).limit || "12");
      const skip = (page - 1) * limit;

      const [videos, total] = await Promise.all([
        prisma.video.findMany({
          where: {
            userId: request.params.id,
            visibility: "PUBLIC",
          },
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                avatar: true,
              },
            },
            _count: {
              select: {
                likes: true,
                comments: true,
              },
            },
          },
        }),
        prisma.video.count({
          where: {
            userId: request.params.id,
            visibility: "PUBLIC",
          },
        }),
      ]);

      return reply.send({
        videos,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }
  );

  // Update current user profile
  fastify.put(
    "/me",
    {
      preHandler: [fastify.authenticate],
    },
    async (request: any, reply: FastifyReply) => {
      const parsed = updateProfileSchema.parse(request.body);

      const user = await prisma.user.update({
        where: { id: request.user.id },
        data: parsed,
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          avatar: true,
          bio: true,
          verified: true,
          createdAt: true,
        },
      });

      return reply.send({ user });
    }
  );

  // Update avatar
  fastify.post(
    "/me/avatar",
    {
      preHandler: [fastify.authenticate],
    },
    async (request: any, reply: FastifyReply) => {
      const parts = request.parts();
      
      for await (const part of parts) {
        if (part.file) {
          const buffer = await part.toBuffer();
          const ext = path.extname(part.filename);
          const filename = `${uuidv4()}${ext}`;
          const uploadDir = path.join(process.cwd(), "uploads", "avatars");

          await mkdir(uploadDir, { recursive: true });
          const filepath = path.join(uploadDir, filename);
          await writeFile(filepath, buffer);

          const avatarUrl = `/uploads/avatars/${filename}`;

          const user = await prisma.user.update({
            where: { id: request.user.id },
            data: { avatar: avatarUrl },
          });

          return reply.send({ avatar: user.avatar });
        }
      }

      return reply.status(400).send({ message: "No file uploaded" });
    }
  );

  // Subscribe to user
  fastify.post<{ Params: UserParams }>(
    "/:id/subscribe",
    {
      preHandler: [fastify.authenticate],
    },
    async (request: any, reply: FastifyReply) => {
      const userIdToSubscribe = request.params.id;

      if (userIdToSubscribe === request.user.id) {
        return reply.status(400).send({ message: "Cannot subscribe to yourself" });
      }

      const existingSubscription = await prisma.subscription.findUnique({
        where: {
          subscriberId_subscribedToId: {
            subscriberId: request.user.id,
            subscribedToId: userIdToSubscribe,
          },
        },
      });

      if (existingSubscription) {
        await prisma.subscription.delete({
          where: { id: existingSubscription.id },
        });
        return reply.send({ subscribed: false });
      }

      await prisma.subscription.create({
        data: {
          subscriberId: request.user.id,
          subscribedToId: userIdToSubscribe,
        },
      });

      return reply.send({ subscribed: true });
    }
  );

  // Get current user subscriptions
  fastify.get(
    "/me/subscriptions",
    {
      preHandler: [fastify.authenticate],
    },
    async (request: any, reply: FastifyReply) => {
      const subscriptions = await prisma.subscription.findMany({
        where: { subscriberId: request.user.id },
        include: {
          subscribedTo: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
              verified: true,
              _count: {
                select: {
                  videos: true,
                },
              },
            },
          },
        },
      });

      return reply.send({
        subscriptions: subscriptions.map((s: any) => s.subscribedTo),
      });
    }
  );
}
