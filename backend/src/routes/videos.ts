import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../utils/db.js";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

const videoSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE", "UNLISTED"]).optional(),
});

interface VideoParams {
  id: string;
}

interface VideoQuery {
  page?: string;
  limit?: string;
  category?: string;
  search?: string;
  sort?: string;
}

export async function videoRoutes(fastify: FastifyInstance) {
  // Get all videos (public)
  fastify.get<{ Querystring: VideoQuery }>(
    "/",
    async (request: FastifyRequest<{ Querystring: VideoQuery }>, reply: FastifyReply) => {
      const page = parseInt(request.query.page || "1");
      const limit = parseInt(request.query.limit || "12");
      const skip = (page - 1) * limit;

      const where = {
        visibility: "PUBLIC" as const,
        ...(request.query.category && { category: request.query.category }),
        ...(request.query.search && {
          OR: [
            { title: { contains: request.query.search, mode: "insensitive" as const } },
            { description: { contains: request.query.search, mode: "insensitive" as const } },
          ],
        }),
      };

      const [videos, total] = await Promise.all([
        prisma.video.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            createdAt: (request.query.sort as any) || "desc",
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                avatar: true,
                verified: true,
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
        prisma.video.count({ where }),
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

  // Get single video
  fastify.get<{ Params: VideoParams }>(
    "/:id",
    async (request: FastifyRequest<{ Params: VideoParams }>, reply: FastifyReply) => {
      const video = await prisma.video.findUnique({
        where: { id: request.params.id },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
              verified: true,
              _count: {
                select: {
                  subscribers: true,
                },
              },
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      });

      if (!video) {
        return reply.status(404).send({ message: "Video not found" });
      }

      // Increment view count
      await prisma.video.update({
        where: { id: request.params.id },
        data: { views: { increment: 1 } },
      });

      return reply.send({ video });
    }
  );

  // Upload video (protected)
  fastify.post(
    "/",
    {
      preHandler: [fastify.authenticate],
    },
    async (request: any, reply: FastifyReply) => {
      try {
        const parts = request.parts();
        let file: any = null;
        let thumbnail: any = null;
        let metadata: any = {};

        for await (const part of parts) {
          if (part.file) {
            const buffer = await part.toBuffer();
            const ext = path.extname(part.filename);
            const filename = `${uuidv4()}${ext}`;
            const uploadDir = path.join(process.cwd(), "uploads");

            await mkdir(uploadDir, { recursive: true });
            const filepath = path.join(uploadDir, filename);
            await writeFile(filepath, buffer);

            if (part.fieldname === "video") {
              file = {
                filename,
                path: `/uploads/${filename}`,
                originalName: part.filename,
              };
            } else if (part.fieldname === "thumbnail") {
              thumbnail = `/uploads/${filename}`;
            }
          } else {
            metadata[part.fieldname] = part.value;
          }
        }

        if (!file) {
          return reply.status(400).send({ message: "Video file is required" });
        }

        const parsed = videoSchema.parse({
          title: metadata.title,
          description: metadata.description,
          category: metadata.category,
          tags: metadata.tags ? JSON.parse(metadata.tags) : [],
          visibility: metadata.visibility || "PUBLIC",
        });

        const video = await prisma.video.create({
          data: {
            title: parsed.title,
            description: parsed.description,
            category: parsed.category,
            tags: parsed.tags || [],
            visibility: parsed.visibility || "PUBLIC",
            videoUrl: file.path,
            thumbnail: thumbnail,
            userId: request.user.id,
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                avatar: true,
              },
            },
          },
        });

        return reply.status(201).send({ video });
      } catch (error: any) {
        if (error.name === "ZodError") {
          return reply.status(400).send({
            message: "Validation error",
            errors: error.errors,
          });
        }
        throw error;
      }
    }
  );

  // Update video (protected)
  fastify.put<{ Params: VideoParams }>(
    "/:id",
    {
      preHandler: [fastify.authenticate],
    },
    async (request: any, reply: FastifyReply) => {
      const video = await prisma.video.findUnique({
        where: { id: request.params.id },
      });

      if (!video) {
        return reply.status(404).send({ message: "Video not found" });
      }

      if (video.userId !== request.user.id) {
        return reply.status(403).send({ message: "Not authorized" });
      }

      const parsed = videoSchema.parse(request.body);

      const updated = await prisma.video.update({
        where: { id: request.params.id },
        data: parsed,
      });

      return reply.send({ video: updated });
    }
  );

  // Delete video (protected)
  fastify.delete<{ Params: VideoParams }>(
    "/:id",
    {
      preHandler: [fastify.authenticate],
    },
    async (request: any, reply: FastifyReply) => {
      const video = await prisma.video.findUnique({
        where: { id: request.params.id },
      });

      if (!video) {
        return reply.status(404).send({ message: "Video not found" });
      }

      if (video.userId !== request.user.id) {
        return reply.status(403).send({ message: "Not authorized" });
      }

      await prisma.video.delete({
        where: { id: request.params.id },
      });

      return reply.send({ message: "Video deleted successfully" });
    }
  );

  // Like/Dislike video
  fastify.post<{ Params: VideoParams }>(
    "/:id/like",
    {
      preHandler: [fastify.authenticate],
    },
    async (request: any, reply: FastifyReply) => {
      const { type } = request.body as { type: "LIKE" | "DISLIKE" };

      const existingLike = await prisma.like.findUnique({
        where: {
          userId_videoId: {
            userId: request.user.id,
            videoId: request.params.id,
          },
        },
      });

      if (existingLike) {
        if (existingLike.type === type) {
          // Remove like
          await prisma.like.delete({
            where: { id: existingLike.id },
          });
          return reply.send({ message: "Like removed", type: null });
        } else {
          // Update like
          await prisma.like.update({
            where: { id: existingLike.id },
            data: { type },
          });
          return reply.send({ message: "Like updated", type });
        }
      }

      // Create like
      await prisma.like.create({
        data: {
          userId: request.user.id,
          videoId: request.params.id,
          type,
        },
      });

      return reply.send({ message: "Liked", type });
    }
  );

  // Get video comments
  fastify.get<{ Params: VideoParams }>(
    "/:id/comments",
    async (request: FastifyRequest<{ Params: VideoParams }>, reply: FastifyReply) => {
      const comments = await prisma.comment.findMany({
        where: {
          videoId: request.params.id,
          parentId: null,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
            },
          },
          replies: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  avatar: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return reply.send({ comments });
    }
  );

  // Add comment
  fastify.post<{ Params: VideoParams }>(
    "/:id/comments",
    {
      preHandler: [fastify.authenticate],
    },
    async (request: any, reply: FastifyReply) => {
      const { content, parentId } = request.body as { content: string; parentId?: string };

      const comment = await prisma.comment.create({
        data: {
          content,
          userId: request.user.id,
          videoId: request.params.id,
          parentId,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
            },
          },
        },
      });

      return reply.status(201).send({ comment });
    }
  );
}
