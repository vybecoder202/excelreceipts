"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createPhaseInputSchema } from "@/features/phases/phase-input";
import { getApplicationAccess } from "@/lib/auth/access";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type CreatePhaseActionState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Partial<
    Record<
      "projectId" | "idempotencyKey" | "name" | "description" | "plannedStart" | "plannedEnd",
      string[]
    >
  >;
};

export async function createPhaseAction(
  _previousState: CreatePhaseActionState,
  formData: FormData,
): Promise<CreatePhaseActionState> {
  const access = await getApplicationAccess();
  if (access.mode !== "authenticated" || !access.project) {
    return {
      status: "error",
      message: "Your project access is no longer available. Refresh or sign in again.",
    };
  }

  if (!["owner", "editor"].includes(access.project.role)) {
    return {
      status: "error",
      message: "Your project role is read-only and cannot create phases.",
    };
  }

  const parsed = createPhaseInputSchema.safeParse({
    projectId: formData.get("projectId"),
    idempotencyKey: formData.get("idempotencyKey"),
    name: formData.get("name"),
    description: formData.get("description"),
    plannedStart: formData.get("plannedStart"),
    plannedEnd: formData.get("plannedEnd"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Review the highlighted phase details and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  if (parsed.data.projectId !== access.project.id) {
    return {
      status: "error",
      message: "The selected project does not match your active project.",
    };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("create_phase", {
    p_project_id: access.project.id,
    p_name: parsed.data.name,
    p_idempotency_key: parsed.data.idempotencyKey,
    p_description: parsed.data.description || undefined,
    p_planned_start: parsed.data.plannedStart || undefined,
    p_planned_end: parsed.data.plannedEnd || undefined,
  });

  if (error) {
    return {
      status: "error",
      message:
        error.code === "42501"
          ? "Your project role does not permit phase creation."
          : "The phase could not be created safely. No partial phase was saved; please retry.",
    };
  }

  revalidatePath("/site");
  redirect("/site?created=phase");
}
