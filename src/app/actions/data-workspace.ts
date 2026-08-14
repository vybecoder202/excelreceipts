"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  archiveRecordSchema,
  createDataFieldSchema,
  createDataFormSchema,
  createDataInterfaceSchema,
  createDataTableSchema,
  createDataViewSchema,
  recordCommandSchema,
} from "@/features/data-workspace/workspace-input";
import { isDataFieldType, type DataFieldDefinition } from "@/features/data-workspace/types";
import { getApplicationAccess } from "@/lib/auth/access";
import type { Json } from "@/lib/supabase/database.types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type WorkspaceActionState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

async function authorizeWorkspace(projectId: string) {
  const access = await getApplicationAccess();
  if (access.mode !== "authenticated" || !access.project || access.project.id !== projectId) {
    return { authorized: false as const, message: "Your active project is no longer available. Refresh and try again." };
  }
  if (!['owner', 'editor'].includes(access.project.role)) {
    return { authorized: false as const, message: "Your project role cannot change workspace data." };
  }
  return { authorized: true as const, projectId: access.project.id };
}

function errorState(message: string, fieldErrors?: Record<string, string[] | undefined>): WorkspaceActionState {
  return { status: "error", message, fieldErrors };
}

function databaseError(code: string | undefined, fallback: string) {
  if (code === "42501") return errorState("Your project role does not permit this change.");
  if (code === "23505") return errorState("That name or relationship already exists in this workspace.");
  if (code === "23514" || code === "22023") return errorState("The record does not satisfy the table or relationship rules. Review the fields and try again.");
  return errorState(fallback);
}

function refreshBuilder() {
  revalidatePath("/data");
  revalidatePath("/forms");
  revalidatePath("/interfaces");
}

export async function installConstructionWorkspaceAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const idempotencyKey = String(formData.get("idempotencyKey") ?? "");
  const authorization = await authorizeWorkspace(projectId);
  if (!authorization.authorized || !z.string().uuid().safeParse(idempotencyKey).success) redirect("/data?error=starter");
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("install_construction_workspace", {
    p_project_id: authorization.projectId,
    p_idempotency_key: idempotencyKey,
  });
  if (error) redirect("/data?error=starter");
  refreshBuilder();
  redirect("/data?installed=construction");
}

export async function createDataTableAction(
  _previousState: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const parsed = createDataTableSchema.safeParse({
    projectId: formData.get("projectId"),
    idempotencyKey: formData.get("idempotencyKey"),
    name: formData.get("name"),
    description: formData.get("description"),
    color: formData.get("color"),
  });
  if (!parsed.success) return errorState("Review the table details and try again.", parsed.error.flatten().fieldErrors);
  const authorization = await authorizeWorkspace(parsed.data.projectId);
  if (!authorization.authorized) return errorState(authorization.message);
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("create_data_table", {
    p_project_id: authorization.projectId,
    p_name: parsed.data.name,
    p_description: parsed.data.description || undefined,
    p_color: parsed.data.color,
    p_idempotency_key: parsed.data.idempotencyKey,
  });
  if (error || !data) return databaseError(error?.code, "The table could not be created. No partial definition was saved.");
  refreshBuilder();
  redirect(`/data/${data}?created=table`);
}

export async function createDataFieldAction(
  _previousState: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const parsed = createDataFieldSchema.safeParse({
    projectId: formData.get("projectId"),
    tableId: formData.get("tableId"),
    idempotencyKey: formData.get("idempotencyKey"),
    name: formData.get("name"),
    fieldType: formData.get("fieldType"),
    isRequired: formData.get("isRequired") === "true",
    options: formData.get("options"),
    linkedTableId: formData.get("linkedTableId"),
    lookupLinkFieldId: formData.get("lookupLinkFieldId"),
    lookupTargetFieldId: formData.get("lookupTargetFieldId"),
    formulaOperator: formData.get("formulaOperator"),
    formulaSourceFieldIds: formData.getAll("formulaSourceFieldIds").map(String),
  });
  if (!parsed.success) return errorState("Review the field definition and try again.", parsed.error.flatten().fieldErrors);
  const authorization = await authorizeWorkspace(parsed.data.projectId);
  if (!authorization.authorized) return errorState(authorization.message);

  const options = [...new Set(parsed.data.options.split(",").map((value) => value.trim()).filter(Boolean))];
  if (["single_select", "multi_select"].includes(parsed.data.fieldType) && options.length === 0) {
    return errorState("Add at least one comma-separated option.", { options: ["Select fields need one or more options."] });
  }
  if (parsed.data.fieldType === "link" && !z.string().uuid().safeParse(parsed.data.linkedTableId).success) {
    return errorState("Choose the table this field should link to.", { linkedTableId: ["Choose a linked table."] });
  }
  if (parsed.data.fieldType === "lookup" && (!z.string().uuid().safeParse(parsed.data.lookupLinkFieldId).success || !z.string().uuid().safeParse(parsed.data.lookupTargetFieldId).success)) {
    return errorState("Choose both the linked-record field and the target field to look up.");
  }
  if (parsed.data.fieldType === "formula" && (!parsed.data.formulaOperator || parsed.data.formulaSourceFieldIds.length === 0)) {
    return errorState("Choose a formula operation and at least one source field.");
  }

  const config: Record<string, Json | undefined> = {};
  if (options.length) config.options = options;
  if (parsed.data.fieldType === "formula") {
    config.operator = parsed.data.formulaOperator;
    config.sourceFieldIds = parsed.data.formulaSourceFieldIds;
  }
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("create_data_field", {
    p_project_id: authorization.projectId,
    p_table_id: parsed.data.tableId,
    p_name: parsed.data.name,
    p_field_type: parsed.data.fieldType,
    p_is_required: parsed.data.isRequired,
    p_config: config,
    p_linked_table_id: parsed.data.fieldType === "link" ? parsed.data.linkedTableId : undefined,
    p_lookup_link_field_id: parsed.data.fieldType === "lookup" ? parsed.data.lookupLinkFieldId : undefined,
    p_lookup_target_field_id: parsed.data.fieldType === "lookup" ? parsed.data.lookupTargetFieldId : undefined,
    p_idempotency_key: parsed.data.idempotencyKey,
  });
  if (error) return databaseError(error.code, "The field could not be created. No partial definition was saved.");
  refreshBuilder();
  redirect(`/data/${parsed.data.tableId}?created=field`);
}

function validateScalarField(field: DataFieldDefinition, raw: string): string | undefined {
  if (raw.length > (field.field_type === "long_text" ? 20000 : 2000)) return "This value is too long.";
  if (field.field_type === "email" && !z.string().email().safeParse(raw).success) return "Enter a valid email address.";
  if (field.field_type === "url" && !z.string().url().safeParse(raw).success) return "Enter a complete web address.";
  if (field.field_type === "date" && !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return "Choose a valid date.";
  if (field.field_type === "currency" && !/^-?\d+(?:\.\d{1,2})?$/.test(raw)) return "Use a number with no more than two decimal places.";
  if (field.field_type === "number" && !/^-?\d+(?:\.\d{1,6})?$/.test(raw)) return "Use a number with no more than six decimal places.";
  return undefined;
}

export async function saveDataRecordAction(
  _previousState: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const parsed = recordCommandSchema.safeParse({
    projectId: formData.get("projectId"),
    tableId: formData.get("tableId"),
    recordId: formData.get("recordId") ?? "",
    formId: formData.get("formId") ?? "",
    idempotencyKey: formData.get("idempotencyKey"),
  });
  if (!parsed.success) return errorState("This record panel is out of date. Refresh and try again.");
  const authorization = await authorizeWorkspace(parsed.data.projectId);
  if (!authorization.authorized) return errorState(authorization.message);
  const supabase = await createServerSupabaseClient();
  const { data: fieldRows, error: fieldError } = await supabase
    .from("data_fields")
    .select("id, project_id, table_id, name, field_type, position, is_primary, is_required, config, linked_table_id, lookup_link_field_id, lookup_target_field_id")
    .eq("project_id", authorization.projectId)
    .eq("table_id", parsed.data.tableId)
    .is("archived_at", null)
    .order("position");
  if (fieldError || !fieldRows) return errorState("The table definition could not be loaded. Refresh and try again.");

  const fields: DataFieldDefinition[] = [];
  for (const field of fieldRows) {
    if (!isDataFieldType(field.field_type)) continue;
    fields.push({ ...field, field_type: field.field_type });
  }
  const values: Record<string, Json | undefined> = {};
  const links: Record<string, Json | undefined> = {};
  const fieldErrors: Record<string, string[]> = {};
  for (const field of fields) {
    if (["lookup", "formula"].includes(field.field_type)) continue;
    const inputName = `field_${field.id}`;
    if (field.field_type === "link") {
      const selected = formData.getAll(inputName).map(String).filter(Boolean);
      if (selected.some((value) => !z.string().uuid().safeParse(value).success)) fieldErrors[field.id] = ["Choose valid linked records."];
      if (field.is_required && selected.length === 0) fieldErrors[field.id] = ["This field is required."];
      links[field.id] = selected;
      continue;
    }
    if (field.field_type === "multi_select") {
      const selected = formData.getAll(inputName).map(String).filter(Boolean);
      if (field.is_required && selected.length === 0) fieldErrors[field.id] = ["This field is required."];
      values[field.id] = selected;
      continue;
    }
    if (field.field_type === "checkbox") {
      values[field.id] = formData.get(inputName) === "true";
      continue;
    }
    const raw = String(formData.get(inputName) ?? "").trim();
    if (!raw) {
      if (field.is_required) fieldErrors[field.id] = ["This field is required."];
      continue;
    }
    const validationError = validateScalarField(field, raw);
    if (validationError) fieldErrors[field.id] = [validationError];
    values[field.id] = raw;
  }
  if (Object.keys(fieldErrors).length) return errorState("Review the highlighted fields and try again.", fieldErrors);

  const { error } = await supabase.rpc("save_data_record", {
    p_project_id: authorization.projectId,
    p_table_id: parsed.data.tableId,
    p_values: values,
    p_links: links,
    p_idempotency_key: parsed.data.idempotencyKey,
    p_record_id: parsed.data.recordId || undefined,
  });
  if (error) return databaseError(error.code, "The record could not be saved. No partial values were kept.");
  refreshBuilder();
  if (parsed.data.formId) redirect(`/forms/${parsed.data.formId}?submitted=1`);
  redirect(`/data/${parsed.data.tableId}?saved=${parsed.data.recordId ? "updated" : "created"}`);
}

export async function archiveDataRecordAction(formData: FormData) {
  const parsed = archiveRecordSchema.safeParse({
    projectId: formData.get("projectId"),
    tableId: formData.get("tableId"),
    recordId: formData.get("recordId"),
    idempotencyKey: formData.get("idempotencyKey"),
  });
  if (!parsed.success) redirect("/data?error=archive");
  const authorization = await authorizeWorkspace(parsed.data.projectId);
  if (!authorization.authorized) redirect(`/data/${parsed.data.tableId}?error=archive`);
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("archive_data_record", {
    p_project_id: authorization.projectId,
    p_record_id: parsed.data.recordId,
    p_idempotency_key: parsed.data.idempotencyKey,
  });
  refreshBuilder();
  redirect(`/data/${parsed.data.tableId}?${error ? "error" : "archived"}=record`);
}

export async function createDataViewAction(_state: WorkspaceActionState, formData: FormData): Promise<WorkspaceActionState> {
  const parsed = createDataViewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return errorState("Review the view details and try again.", parsed.error.flatten().fieldErrors);
  const authorization = await authorizeWorkspace(parsed.data.projectId);
  if (!authorization.authorized) return errorState(authorization.message);
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("create_data_view", {
    p_project_id: authorization.projectId, p_table_id: parsed.data.tableId,
    p_name: parsed.data.name, p_view_type: parsed.data.viewType, p_idempotency_key: parsed.data.idempotencyKey,
  });
  if (error) return databaseError(error.code, "The view could not be created.");
  refreshBuilder();
  redirect(`/data/${parsed.data.tableId}?created=view`);
}

export async function createDataFormAction(_state: WorkspaceActionState, formData: FormData): Promise<WorkspaceActionState> {
  const parsed = createDataFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return errorState("Review the form details and try again.", parsed.error.flatten().fieldErrors);
  const authorization = await authorizeWorkspace(parsed.data.projectId);
  if (!authorization.authorized) return errorState(authorization.message);
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("create_data_form", {
    p_project_id: authorization.projectId, p_table_id: parsed.data.tableId, p_name: parsed.data.name,
    p_description: parsed.data.description || undefined, p_submit_label: parsed.data.submitLabel,
    p_idempotency_key: parsed.data.idempotencyKey,
  });
  if (error || !data) return databaseError(error?.code, "The form could not be created.");
  refreshBuilder();
  redirect(`/forms/${data}?created=1`);
}

export async function createDataInterfaceAction(_state: WorkspaceActionState, formData: FormData): Promise<WorkspaceActionState> {
  const parsed = createDataInterfaceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return errorState("Review the interface details and try again.", parsed.error.flatten().fieldErrors);
  const authorization = await authorizeWorkspace(parsed.data.projectId);
  if (!authorization.authorized) return errorState(authorization.message);
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("create_data_interface", {
    p_project_id: authorization.projectId, p_table_id: parsed.data.tableId, p_name: parsed.data.name,
    p_description: parsed.data.description || undefined, p_idempotency_key: parsed.data.idempotencyKey,
  });
  if (error || !data) return databaseError(error?.code, "The interface could not be created.");
  refreshBuilder();
  redirect(`/interfaces/${data}?created=1`);
}
