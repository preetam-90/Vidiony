import { z } from "zod";

export const RegisterBodySchema = z.object({
  email: z.string().email("Invalid email address"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username may only contain letters, numbers, _ and -"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long"),
  name: z.string().max(100).optional(),
});

export const LoginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export const RefreshBodySchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

export const YouTubeCallbackQuerySchema = z.object({
  code: z.string().min(1, "code is required"),
  state: z.string().optional(),
});

export type RegisterBody = z.infer<typeof RegisterBodySchema>;
export type LoginBody = z.infer<typeof LoginBodySchema>;
