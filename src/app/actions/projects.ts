"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createProjectInputSchema } from "@/features/projects/project-input";
import { getApplicationAccess } from "@/lib/auth/access";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type CreateProjectActionState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Partial<Record<"idempotencyKey" | "name" | "description", string[]>>;
};

export async function createProjectAction(
  _previousState: CreateProjectActionState,
  formData: FormData,
): Promise<CreateProjectActionState> {
  const access = await getApplicationAccess();
  if (access.mode !== "authenticated") {
    return {
      status: "error",
      message: "Your sign-in has expired. Sign in again, then retry.",
    };
  }

  if (!access.canCreateProject || access.project) {
    return {
      status: "error",
      message: "This account is not permitted to create another project.",
    };
  }

  const parsed = createProjectInputSchema.safeParse({
    idempotencyKey: formData.get("idempotencyKey"),
    name: formData.get("name"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Review the highlighted fields and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("create_project", {
    p_name: parsed.data.name,
    p_description: parsed.data.description || undefined,
    p_idempotency_key: parsed.data.idempotencyKey,
  });

  if (error) {
    const permissionDenied = error.code === "42501";
    const ownerProjectExists = error.code === "23505";
    return {
      status: "error",
      message: permissionDenied
        ? "Project creation is not authorized for this account. Check the private owner configuration."
        : ownerProjectExists
          ? "This owner already has an active project. Refresh the page to open it."
          : "The project could not be created safely. No partial project was saved; please retry.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/?created=1");
}
