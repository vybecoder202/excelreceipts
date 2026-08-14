import { dataFieldTypes, isDataFieldType, type DataFieldDefinition } from "@/features/data-workspace/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getDataWorkspace(projectId: string) {
  const supabase = await createServerSupabaseClient();
  const [tables, fields, records, cells, links, views, forms, formFields, interfaces, blocks] = await Promise.all([
    supabase.from("data_tables").select("id, name, description, color, position").eq("project_id", projectId).is("archived_at", null).order("position"),
    supabase.from("data_fields").select("id, project_id, table_id, name, field_type, position, is_primary, is_required, config, linked_table_id, lookup_link_field_id, lookup_target_field_id").eq("project_id", projectId).is("archived_at", null).order("position"),
    supabase.from("data_records").select("id, table_id, record_number, created_at, updated_at").eq("project_id", projectId).is("archived_at", null).order("record_number"),
    supabase.from("data_cells").select("record_id, field_id, text_value, number_value, boolean_value, date_value, option_value, json_value").eq("project_id", projectId),
    supabase.from("data_record_links").select("field_id, source_record_id, target_record_id, position").eq("project_id", projectId).order("position"),
    supabase.from("data_views").select("id, table_id, name, view_type, position, filters, sorts, hidden_field_ids").eq("project_id", projectId).is("archived_at", null).order("position"),
    supabase.from("data_forms").select("id, table_id, name, description, submit_label, status, created_at").eq("project_id", projectId).is("archived_at", null).order("created_at"),
    supabase.from("data_form_fields").select("form_id, field_id, position, is_required, is_hidden, help_text").order("position"),
    supabase.from("data_interfaces").select("id, name, description, created_at").eq("project_id", projectId).is("archived_at", null).order("created_at"),
    supabase.from("data_interface_blocks").select("id, interface_id, table_id, field_id, name, block_type, position, config").order("position"),
  ]);

  const firstError = [tables, fields, records, cells, links, views, forms, formFields, interfaces, blocks].find((result) => result.error)?.error;
  if (firstError) throw new Error(`Workspace data could not be loaded: ${firstError.message}`);

  const validFields: DataFieldDefinition[] = [];
  for (const field of fields.data ?? []) {
    if (!isDataFieldType(field.field_type)) continue;
    validFields.push({ ...field, field_type: field.field_type });
  }

  return {
    tables: tables.data ?? [],
    fields: validFields,
    records: records.data ?? [],
    cells: cells.data ?? [],
    links: links.data ?? [],
    views: views.data ?? [],
    forms: forms.data ?? [],
    formFields: formFields.data ?? [],
    interfaces: interfaces.data ?? [],
    blocks: blocks.data ?? [],
    supportedFieldTypes: dataFieldTypes,
  };
}
