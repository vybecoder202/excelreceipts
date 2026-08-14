import { describe, expect, it } from "vitest";

import {
  createBudgetItemInputSchema,
  createExpenseInputSchema,
  createTaskInputSchema,
  updateTaskProgressInputSchema,
} from "./record-input";

const command = {
  projectId: "11111111-1111-4111-8111-111111111111",
  idempotencyKey: "22222222-2222-4222-8222-222222222222",
};

describe("core record input", () => {
  it("accepts exact two-decimal financial input", () => {
    expect(
      createBudgetItemInputSchema.parse({
        ...command,
        categoryName: "Substructure",
        description: "Foundation works",
        originalAmount: "50000.25",
        forecastAmount: "52000.00",
        phaseId: "",
      }),
    ).toMatchObject({ originalAmount: 50000.25, forecastAmount: 52000 });
  });

  it("rejects expense amounts with hidden extra precision", () => {
    expect(
      createExpenseInputSchema.safeParse({
        ...command,
        categoryId: "33333333-3333-4333-8333-333333333333",
        expenseDate: "2026-08-14",
        description: "Cement",
        amount: "10.999",
        phaseId: "",
        supplierId: "",
      }).success,
    ).toBe(false);
  });

  it("rejects task end dates before their start", () => {
    const result = createTaskInputSchema.safeParse({
      ...command,
      title: "Excavate",
      description: "",
      phaseId: "",
      plannedStart: "2026-08-20",
      plannedEnd: "2026-08-19",
      priority: "normal",
      progressWeight: "1",
    });
    expect(result.success).toBe(false);
  });

  it("requires completed tasks to be exactly 100 percent", () => {
    expect(
      updateTaskProgressInputSchema.safeParse({
        ...command,
        taskId: "33333333-3333-4333-8333-333333333333",
        percentComplete: "90",
        status: "completed",
        summary: "Nearly done",
        updateDate: "2026-08-14",
      }).success,
    ).toBe(false);
  });
});
