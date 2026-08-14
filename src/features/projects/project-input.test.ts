import { describe, expect, it } from "vitest";

import { createProjectInputSchema } from "./project-input";

const idempotencyKey = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

describe("create project input", () => {
  it("trims valid owner input", () => {
    expect(
      createProjectInputSchema.parse({
        idempotencyKey,
        name: "  Kamoya Family House  ",
        description: "  Residential build in Lusaka  ",
      }),
    ).toEqual({
      idempotencyKey,
      name: "Kamoya Family House",
      description: "Residential build in Lusaka",
    });
  });

  it("rejects empty names and invalid retry keys", () => {
    const result = createProjectInputSchema.safeParse({
      idempotencyKey: "not-a-uuid",
      name: " ",
      description: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.name).toBeDefined();
      expect(result.error.flatten().fieldErrors.idempotencyKey).toBeDefined();
    }
  });
});
