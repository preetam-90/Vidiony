import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcryptjs";
import { prisma } from "../utils/db.js";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30),
  password: z.string().min(8),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

interface RegisterBody {
  email: string;
  username: string;
  password: string;
  name?: string;
}

interface LoginBody {
  email: string;
  password: string;
}

export async function authRoutes(fastify: FastifyInstance) {
  // Register
  fastify.post<{ Body: RegisterBody }>(
    "/register",
    async (request: FastifyRequest<{ Body: RegisterBody }>, reply: FastifyReply) => {
      try {
        const body = registerSchema.parse(request.body);

        // Check if user exists
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [{ email: body.email }, { username: body.username }],
          },
        });

        if (existingUser) {
          return reply.status(400).send({
            message: "User with this email or username already exists",
          });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(body.password, 12);

        // Create user
        const user = await prisma.user.create({
          data: {
            email: body.email,
            username: body.username,
            password: hashedPassword,
            name: body.name,
          },
          select: {
            id: true,
            email: true,
            username: true,
            name: true,
            avatar: true,
            verified: true,
            createdAt: true,
          },
        });

        // Generate token
        const token = fastify.jwt.sign({
          id: user.id,
          email: user.email,
          username: user.username,
        });

        return reply.status(201).send({
          user,
          token,
        });
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

  // Login
  fastify.post<{ Body: LoginBody }>(
    "/login",
    async (request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
      try {
        const body = loginSchema.parse(request.body);

        // Find user
        const user = await prisma.user.findUnique({
          where: { email: body.email },
        });

        if (!user) {
          return reply.status(401).send({
            message: "Invalid email or password",
          });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(body.password, user.password);

        if (!isValidPassword) {
          return reply.status(401).send({
            message: "Invalid email or password",
          });
        }

        // Generate token
        const token = fastify.jwt.sign({
          id: user.id,
          email: user.email,
          username: user.username,
        });

        return reply.send({
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            name: user.name,
            avatar: user.avatar,
            verified: user.verified,
          },
          token,
        });
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

  // Get current user
  fastify.get(
    "/me",
    {
      preHandler: [fastify.authenticate],
    },
    async (request: any, reply: FastifyReply) => {
      const user = await prisma.user.findUnique({
        where: { id: request.user.id },
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

      if (!user) {
        return reply.status(404).send({ message: "User not found" });
      }

      return reply.send({ user });
    }
  );
}
