import { z } from "zod";

export const createProjectInputSchema = z.object({
  idempotencyKey: z.string().uuid("Refresh the page and try again."),
  name: z
    .string()
    .trim()
    .min(2, "Enter a project name with at least 2 characters.")
    .max(160, "Keep the project name to 160 characters or fewer."),
  description: z
    .string()
    .trim()
    .max(4000, "Keep the description to 4,000 characters or fewer."),
});

export type CreateProjectInput = z.infer<typeof createProjectInputSchema>;
