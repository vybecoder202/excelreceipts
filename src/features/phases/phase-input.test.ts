import { describe, expect, it } from "vitest";

import { createPhaseInputSchema } from "./phase-input";

const projectId = "11111111-1111-4111-8111-111111111111";
const idempotencyKey = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

describe("create phase input", () => {
  it("accepts and trims a valid construction phase", () => {
    expect(
      createPhaseInputSchema.parse({
        projectId,
        idempotencyKey,
        name: "  Substructure  ",
        description: "  Foundations and ground works  ",
        plannedStart: "2026-08-17",
        plannedEnd: "2026-09-18",
      }),
    ).toEqual({
      projectId,
      idempotencyKey,
      name: "Substructure",
      description: "Foundations and ground works",
      plannedStart: "2026-08-17",
      plannedEnd: "2026-09-18",
    });
  });

  it("rejects an end date before the start date", () => {
    const result = createPhaseInputSchema.safeParse({
      projectId,
      idempotencyKey,
      name: "Substructure",
      description: "",
      plannedStart: "2026-09-18",
      plannedEnd: "2026-08-17",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.plannedEnd).toContain(
        "Planned end cannot be before planned start.",
      );
    }
  });
});
