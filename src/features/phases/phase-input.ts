import { z } from "zod";

function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

const optionalDate = z.string().refine(
  (value) => value === "" || isIsoDate(value),
  "Enter a valid date.",
);

export const createPhaseInputSchema = z
  .object({
    projectId: z.string().uuid("Refresh the page and try again."),
    idempotencyKey: z.string().uuid("Refresh the page and try again."),
    name: z
      .string()
      .trim()
      .min(2, "Enter a phase name with at least 2 characters.")
      .max(160, "Keep the phase name to 160 characters or fewer."),
    description: z
      .string()
      .trim()
      .max(4000, "Keep the description to 4,000 characters or fewer."),
    plannedStart: optionalDate,
    plannedEnd: optionalDate,
  })
  .superRefine((value, context) => {
    if (value.plannedStart && value.plannedEnd && value.plannedEnd < value.plannedStart) {
      context.addIssue({
        code: "custom",
        path: ["plannedEnd"],
        message: "Planned end cannot be before planned start.",
      });
    }
  });

export type CreatePhaseInput = z.infer<typeof createPhaseInputSchema>;
