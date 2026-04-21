import { z } from "zod";

export const RefreshBodySchema = z.object({
  refreshToken: z.string().min(1).optional(),
});
