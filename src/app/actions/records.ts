"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createBudgetItemInputSchema,
  createDailyLogInputSchema,
  createExpenseInputSchema,
  createMaterialInputSchema,
  createStockLocationInputSchema,
  createSupplierInputSchema,
  createTaskInputSchema,
  createWorkerInputSchema,
  recordAttendanceInputSchema,
  updateTaskProgressInputSchema,
} from "@/features/records/record-input";
import { getApplicationAccess } from "@/lib/auth/access";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type RecordActionState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

type AuthorizationResult =
  | { authorized: true; projectId: string }
  | { authorized: false; state: RecordActionState };

async function authorizeProject(projectId: string): Promise<AuthorizationResult> {
  const access = await getApplicationAccess();
  if (access.mode !== "authenticated" || !access.project) {
    return {
      authorized: false,
      state: {
        status: "error",
        message: "Your project access is no longer available. Refresh or sign in again.",
      },
    };
  }
  if (!["owner", "editor"].includes(access.project.role)) {
    return {
      authorized: false,
      state: {
        status: "error",
        message: "Your project role is read-only and cannot add records.",
      },
    };
  }
  if (access.project.id !== projectId) {
    return {
      authorized: false,
      state: {
        status: "error",
        message: "The selected project does not match your active project.",
      },
    };
  }
  return { authorized: true, projectId: access.project.id };
}

function invalidInput(
  fieldErrors: Record<string, string[] | undefined>,
): RecordActionState {
  return {
    status: "error",
    message: "Review the highlighted details and try again.",
    fieldErrors,
  };
}

function commandError(
  code: string | undefined,
  fallback: string,
  duplicateMessage?: string,
): RecordActionState {
  if (code === "42501") {
    return { status: "error", message: "Your project role does not permit this change." };
  }
  if (code === "23505" && duplicateMessage) {
    return { status: "error", message: duplicateMessage };
  }
  return { status: "error", message: fallback };
}

function refreshWorkspace(path: string) {
  revalidatePath(path);
  revalidatePath("/");
}

export async function createSupplierAction(
  _previousState: RecordActionState,
  formData: FormData,
): Promise<RecordActionState> {
  const authorization = await authorizeProject(String(formData.get("projectId") ?? ""));
  if (!authorization.authorized) return authorization.state;
  const parsed = createSupplierInputSchema.safeParse({
    projectId: formData.get("projectId"),
    idempotencyKey: formData.get("idempotencyKey"),
    name: formData.get("name"),
    contactName: formData.get("contactName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
  });
  if (!parsed.success) return invalidInput(parsed.error.flatten().fieldErrors);

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("create_supplier", {
    p_project_id: authorization.projectId,
    p_name: parsed.data.name,
    p_idempotency_key: parsed.data.idempotencyKey,
    p_contact_name: parsed.data.contactName || undefined,
    p_phone: parsed.data.phone || undefined,
    p_email: parsed.data.email || undefined,
  });
  if (error) {
    return commandError(
      error.code,
      "The supplier could not be created safely. No partial record was saved.",
      "A supplier with this name already exists in the project.",
    );
  }
  refreshWorkspace("/procurement");
  redirect("/procurement?created=supplier");
}

export async function createBudgetItemAction(
  _previousState: RecordActionState,
  formData: FormData,
): Promise<RecordActionState> {
  const authorization = await authorizeProject(String(formData.get("projectId") ?? ""));
  if (!authorization.authorized) return authorization.state;
  const parsed = createBudgetItemInputSchema.safeParse({
    projectId: formData.get("projectId"),
    idempotencyKey: formData.get("idempotencyKey"),
    categoryName: formData.get("categoryName"),
    description: formData.get("description"),
    originalAmount: formData.get("originalAmount"),
    forecastAmount: formData.get("forecastAmount"),
    phaseId: formData.get("phaseId"),
  });
  if (!parsed.success) return invalidInput(parsed.error.flatten().fieldErrors);

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("create_budget_item", {
    p_project_id: authorization.projectId,
    p_category_name: parsed.data.categoryName,
    p_description: parsed.data.description,
    p_original_amount: parsed.data.originalAmount,
    p_forecast_amount: parsed.data.forecastAmount,
    p_idempotency_key: parsed.data.idempotencyKey,
    p_phase_id: parsed.data.phaseId,
  });
  if (error) {
    return commandError(error.code, "The budget item could not be saved safely. Please retry.");
  }
  refreshWorkspace("/finances");
  redirect("/finances?created=budget");
}

export async function createExpenseAction(
  _previousState: RecordActionState,
  formData: FormData,
): Promise<RecordActionState> {
  const authorization = await authorizeProject(String(formData.get("projectId") ?? ""));
  if (!authorization.authorized) return authorization.state;
  const parsed = createExpenseInputSchema.safeParse({
    projectId: formData.get("projectId"),
    idempotencyKey: formData.get("idempotencyKey"),
    categoryId: formData.get("categoryId"),
    expenseDate: formData.get("expenseDate"),
    description: formData.get("description"),
    amount: formData.get("amount"),
    phaseId: formData.get("phaseId"),
    supplierId: formData.get("supplierId"),
  });
  if (!parsed.success) return invalidInput(parsed.error.flatten().fieldErrors);

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("create_expense", {
    p_project_id: authorization.projectId,
    p_category_id: parsed.data.categoryId,
    p_expense_date: parsed.data.expenseDate,
    p_description: parsed.data.description,
    p_amount: parsed.data.amount,
    p_idempotency_key: parsed.data.idempotencyKey,
    p_phase_id: parsed.data.phaseId,
    p_supplier_id: parsed.data.supplierId,
  });
  if (error) {
    return commandError(error.code, "The expense could not be posted safely. No partial expense was saved.");
  }
  refreshWorkspace("/finances");
  redirect("/finances?created=expense");
}

export async function createStockLocationAction(
  _previousState: RecordActionState,
  formData: FormData,
): Promise<RecordActionState> {
  const authorization = await authorizeProject(String(formData.get("projectId") ?? ""));
  if (!authorization.authorized) return authorization.state;
  const parsed = createStockLocationInputSchema.safeParse({
    projectId: formData.get("projectId"),
    idempotencyKey: formData.get("idempotencyKey"),
    name: formData.get("name"),
    description: formData.get("description"),
  });
  if (!parsed.success) return invalidInput(parsed.error.flatten().fieldErrors);

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("create_stock_location", {
    p_project_id: authorization.projectId,
    p_name: parsed.data.name,
    p_idempotency_key: parsed.data.idempotencyKey,
    p_description: parsed.data.description || undefined,
  });
  if (error) {
    return commandError(
      error.code,
      "The stock location could not be saved safely.",
      "A stock location with this name already exists.",
    );
  }
  refreshWorkspace("/inventory");
  redirect("/inventory?created=location");
}

export async function createMaterialAction(
  _previousState: RecordActionState,
  formData: FormData,
): Promise<RecordActionState> {
  const authorization = await authorizeProject(String(formData.get("projectId") ?? ""));
  if (!authorization.authorized) return authorization.state;
  const parsed = createMaterialInputSchema.safeParse({
    projectId: formData.get("projectId"),
    idempotencyKey: formData.get("idempotencyKey"),
    name: formData.get("name"),
    category: formData.get("category"),
    unitCode: formData.get("unitCode"),
    reorderLevel: formData.get("reorderLevel"),
  });
  if (!parsed.success) return invalidInput(parsed.error.flatten().fieldErrors);

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("create_material", {
    p_project_id: authorization.projectId,
    p_name: parsed.data.name,
    p_unit_code: parsed.data.unitCode,
    p_reorder_level: parsed.data.reorderLevel,
    p_idempotency_key: parsed.data.idempotencyKey,
    p_category: parsed.data.category || undefined,
  });
  if (error) {
    return commandError(
      error.code,
      "The material could not be saved safely.",
      "A material with this name already exists.",
    );
  }
  refreshWorkspace("/inventory");
  redirect("/inventory?created=material");
}

export async function createWorkerAction(
  _previousState: RecordActionState,
  formData: FormData,
): Promise<RecordActionState> {
  const authorization = await authorizeProject(String(formData.get("projectId") ?? ""));
  if (!authorization.authorized) return authorization.state;
  const parsed = createWorkerInputSchema.safeParse({
    projectId: formData.get("projectId"),
    idempotencyKey: formData.get("idempotencyKey"),
    fullName: formData.get("fullName"),
    trade: formData.get("trade"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) return invalidInput(parsed.error.flatten().fieldErrors);

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("create_worker", {
    p_project_id: authorization.projectId,
    p_full_name: parsed.data.fullName,
    p_idempotency_key: parsed.data.idempotencyKey,
    p_trade: parsed.data.trade || undefined,
    p_phone: parsed.data.phone || undefined,
  });
  if (error) {
    return commandError(error.code, "The worker could not be saved safely.");
  }
  refreshWorkspace("/workforce");
  redirect("/workforce?created=worker");
}

export async function recordAttendanceAction(
  _previousState: RecordActionState,
  formData: FormData,
): Promise<RecordActionState> {
  const authorization = await authorizeProject(String(formData.get("projectId") ?? ""));
  if (!authorization.authorized) return authorization.state;
  const parsed = recordAttendanceInputSchema.safeParse({
    projectId: formData.get("projectId"),
    idempotencyKey: formData.get("idempotencyKey"),
    workerId: formData.get("workerId"),
    attendanceDate: formData.get("attendanceDate"),
    attendanceStatus: formData.get("attendanceStatus"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) return invalidInput(parsed.error.flatten().fieldErrors);

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("record_attendance", {
    p_project_id: authorization.projectId,
    p_worker_id: parsed.data.workerId,
    p_attendance_date: parsed.data.attendanceDate,
    p_attendance_status: parsed.data.attendanceStatus,
    p_idempotency_key: parsed.data.idempotencyKey,
    p_notes: parsed.data.notes || undefined,
  });
  if (error) {
    return commandError(
      error.code,
      "Attendance could not be recorded safely.",
      "Attendance for this worker and date already exists.",
    );
  }
  refreshWorkspace("/workforce");
  redirect("/workforce?created=attendance");
}

export async function createDailyLogAction(
  _previousState: RecordActionState,
  formData: FormData,
): Promise<RecordActionState> {
  const authorization = await authorizeProject(String(formData.get("projectId") ?? ""));
  if (!authorization.authorized) return authorization.state;
  const parsed = createDailyLogInputSchema.safeParse({
    projectId: formData.get("projectId"),
    idempotencyKey: formData.get("idempotencyKey"),
    logDate: formData.get("logDate"),
    workCompleted: formData.get("workCompleted"),
    workersPresent: formData.get("workersPresent"),
    weatherNotes: formData.get("weatherNotes"),
    delaysOrIssues: formData.get("delaysOrIssues"),
  });
  if (!parsed.success) return invalidInput(parsed.error.flatten().fieldErrors);

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("create_daily_site_log", {
    p_project_id: authorization.projectId,
    p_log_date: parsed.data.logDate,
    p_work_completed: parsed.data.workCompleted,
    p_workers_present: parsed.data.workersPresent,
    p_idempotency_key: parsed.data.idempotencyKey,
    p_weather_notes: parsed.data.weatherNotes || undefined,
    p_delays_or_issues: parsed.data.delaysOrIssues || undefined,
  });
  if (error) {
    return commandError(
      error.code,
      "The daily log could not be saved safely.",
      "A daily log already exists for this date.",
    );
  }
  refreshWorkspace("/site");
  redirect("/site?created=daily-log");
}

export async function createTaskAction(
  _previousState: RecordActionState,
  formData: FormData,
): Promise<RecordActionState> {
  const authorization = await authorizeProject(String(formData.get("projectId") ?? ""));
  if (!authorization.authorized) return authorization.state;
  const parsed = createTaskInputSchema.safeParse({
    projectId: formData.get("projectId"),
    idempotencyKey: formData.get("idempotencyKey"),
    title: formData.get("title"),
    description: formData.get("description"),
    phaseId: formData.get("phaseId"),
    plannedStart: formData.get("plannedStart"),
    plannedEnd: formData.get("plannedEnd"),
    priority: formData.get("priority"),
    progressWeight: formData.get("progressWeight"),
  });
  if (!parsed.success) return invalidInput(parsed.error.flatten().fieldErrors);

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("create_task", {
    p_project_id: authorization.projectId,
    p_title: parsed.data.title,
    p_idempotency_key: parsed.data.idempotencyKey,
    p_phase_id: parsed.data.phaseId,
    p_description: parsed.data.description || undefined,
    p_planned_start: parsed.data.plannedStart || undefined,
    p_planned_end: parsed.data.plannedEnd || undefined,
    p_priority: parsed.data.priority,
    p_progress_weight: parsed.data.progressWeight,
  });
  if (error) {
    return commandError(error.code, "The task could not be created safely. No partial task was saved.");
  }
  refreshWorkspace("/site");
  redirect("/site?created=task");
}

export async function updateTaskProgressAction(
  _previousState: RecordActionState,
  formData: FormData,
): Promise<RecordActionState> {
  const authorization = await authorizeProject(String(formData.get("projectId") ?? ""));
  if (!authorization.authorized) return authorization.state;
  const parsed = updateTaskProgressInputSchema.safeParse({
    projectId: formData.get("projectId"),
    idempotencyKey: formData.get("idempotencyKey"),
    taskId: formData.get("taskId"),
    percentComplete: formData.get("percentComplete"),
    status: formData.get("status"),
    summary: formData.get("summary"),
    updateDate: formData.get("updateDate"),
  });
  if (!parsed.success) return invalidInput(parsed.error.flatten().fieldErrors);

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("update_task_progress", {
    p_project_id: authorization.projectId,
    p_task_id: parsed.data.taskId,
    p_percent_complete: parsed.data.percentComplete,
    p_status: parsed.data.status,
    p_summary: parsed.data.summary,
    p_update_date: parsed.data.updateDate,
    p_idempotency_key: parsed.data.idempotencyKey,
  });
  if (error) {
    return commandError(
      error.code,
      error.code === "22023"
        ? "This status or percentage cannot follow the task's current state. Refresh and try again."
        : "The task progress update could not be saved safely.",
    );
  }
  refreshWorkspace("/site");
  redirect("/site?created=progress");
}
