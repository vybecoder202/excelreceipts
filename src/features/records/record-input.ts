import { z } from "zod";

function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

const projectCommandFields = {
  projectId: z.string().uuid("Refresh the page and try again."),
  idempotencyKey: z.string().uuid("Refresh the page and try again."),
};

const requiredDate = z.string().refine(isIsoDate, "Enter a valid date.");
const optionalUuid = z
  .union([z.literal(""), z.string().uuid("Choose a valid option.")])
  .transform((value) => value || undefined);
const requiredMoney = z
  .string()
  .trim()
  .regex(/^\d{1,16}(?:\.\d{1,2})?$/, "Enter a positive amount with up to 2 decimal places.")
  .transform(Number)
  .refine((value) => value > 0, "Amount must be greater than zero.");
const nonnegativeMoney = z
  .string()
  .trim()
  .regex(/^\d{1,16}(?:\.\d{1,2})?$/, "Enter zero or a positive amount with up to 2 decimal places.")
  .transform(Number);
const nonnegativeQuantity = z
  .string()
  .trim()
  .regex(/^\d{1,14}(?:\.\d{1,4})?$/, "Enter zero or a positive quantity with up to 4 decimal places.")
  .transform(Number);

export const createSupplierInputSchema = z.object({
  ...projectCommandFields,
  name: z.string().trim().min(2, "Enter a supplier name.").max(200),
  contactName: z.string().trim().max(200),
  phone: z.string().trim().max(80),
  email: z.union([z.literal(""), z.email("Enter a valid email address.")]),
});

export const createBudgetItemInputSchema = z.object({
  ...projectCommandFields,
  categoryName: z.string().trim().min(2, "Enter a budget category.").max(120),
  description: z.string().trim().min(2, "Enter a budget item description.").max(240),
  originalAmount: nonnegativeMoney,
  forecastAmount: nonnegativeMoney,
  phaseId: optionalUuid,
});

export const createExpenseInputSchema = z.object({
  ...projectCommandFields,
  categoryId: z.string().uuid("Choose a budget category."),
  expenseDate: requiredDate,
  description: z.string().trim().min(2, "Enter what the expense was for.").max(500),
  amount: requiredMoney,
  phaseId: optionalUuid,
  supplierId: optionalUuid,
});

export const createStockLocationInputSchema = z.object({
  ...projectCommandFields,
  name: z.string().trim().min(2, "Enter a stock location name.").max(160),
  description: z.string().trim().max(1000),
});

export const createMaterialInputSchema = z.object({
  ...projectCommandFields,
  name: z.string().trim().min(2, "Enter a material name.").max(200),
  category: z.string().trim().max(120),
  unitCode: z.string().trim().min(1, "Choose a unit of measure.").max(24),
  reorderLevel: nonnegativeQuantity,
});

export const createWorkerInputSchema = z.object({
  ...projectCommandFields,
  fullName: z.string().trim().min(2, "Enter the worker's full name.").max(200),
  trade: z.string().trim().max(120),
  phone: z.string().trim().max(80),
});

export const recordAttendanceInputSchema = z.object({
  ...projectCommandFields,
  workerId: z.string().uuid("Choose a worker."),
  attendanceDate: requiredDate,
  attendanceStatus: z.enum(["present", "half_day", "absent"], "Choose an attendance status."),
  notes: z.string().trim().max(1000),
});

export const createDailyLogInputSchema = z.object({
  ...projectCommandFields,
  logDate: requiredDate,
  workCompleted: z.string().trim().min(3, "Describe the work completed.").max(8000),
  workersPresent: z
    .string()
    .trim()
    .regex(/^\d{1,6}$/, "Enter zero or a whole number.")
    .transform(Number),
  weatherNotes: z.string().trim().max(2000),
  delaysOrIssues: z.string().trim().max(4000),
});

export const createTaskInputSchema = z
  .object({
    ...projectCommandFields,
    title: z.string().trim().min(2, "Enter a task title.").max(240),
    description: z.string().trim().max(8000),
    phaseId: optionalUuid,
    plannedStart: z.union([z.literal(""), requiredDate]),
    plannedEnd: z.union([z.literal(""), requiredDate]),
    priority: z.enum(["low", "normal", "high", "critical"]),
    progressWeight: z
      .string()
      .trim()
      .regex(/^\d{1,6}(?:\.\d{1,4})?$/, "Enter a weight greater than zero.")
      .transform(Number)
      .refine((value) => value > 0, "Weight must be greater than zero."),
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

export const updateTaskProgressInputSchema = z
  .object({
    ...projectCommandFields,
    taskId: z.string().uuid("Refresh the page and try again."),
    percentComplete: z
      .string()
      .trim()
      .regex(/^\d{1,3}(?:\.\d{1,2})?$/, "Enter a percentage from 0 to 100.")
      .transform(Number)
      .refine((value) => value >= 0 && value <= 100, "Percentage must be from 0 to 100."),
    status: z.enum(["not_started", "in_progress", "blocked", "completed", "cancelled"]),
    summary: z.string().trim().min(3, "Describe the progress made.").max(8000),
    updateDate: requiredDate,
  })
  .superRefine((value, context) => {
    if (value.status === "completed" && value.percentComplete !== 100) {
      context.addIssue({
        code: "custom",
        path: ["percentComplete"],
        message: "Completed tasks must be exactly 100%.",
      });
    }
    if (value.status === "not_started" && value.percentComplete !== 0) {
      context.addIssue({
        code: "custom",
        path: ["percentComplete"],
        message: "Not-started tasks must remain at 0%.",
      });
    }
  });
