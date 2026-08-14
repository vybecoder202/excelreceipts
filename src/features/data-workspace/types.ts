import type { Json } from "@/lib/supabase/database.types";

export const dataFieldTypes = [
  "text",
  "long_text",
  "number",
  "currency",
  "date",
  "checkbox",
  "single_select",
  "multi_select",
  "email",
  "phone",
  "url",
  "link",
  "lookup",
  "formula",
] as const;

export type DataFieldType = (typeof dataFieldTypes)[number];

const dataFieldTypeSet = new Set<string>(dataFieldTypes);

export function isDataFieldType(value: string): value is DataFieldType {
  return dataFieldTypeSet.has(value);
}

export type DataTableDefinition = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  position: number;
};

export type DataFieldDefinition = {
  id: string;
  project_id: string;
  table_id: string;
  name: string;
  field_type: DataFieldType;
  position: number;
  is_primary: boolean;
  is_required: boolean;
  config: Json;
  linked_table_id: string | null;
  lookup_link_field_id: string | null;
  lookup_target_field_id: string | null;
};

export type DataRecordDefinition = {
  id: string;
  table_id: string;
  record_number: number;
  position: number;
  created_at: string;
  updated_at: string;
};

export type DataRecordComment = {
  id: string;
  table_id: string;
  record_id: string;
  body: string;
  created_at: string;
};

export type DataCellDefinition = {
  record_id: string;
  field_id: string;
  text_value: string | null;
  number_value: number | null;
  boolean_value: boolean | null;
  date_value: string | null;
  option_value: string | null;
  json_value: Json | null;
};

export type DataRecordLinkDefinition = {
  field_id: string;
  source_record_id: string;
  target_record_id: string;
  position: number;
};

export type MaterializedValue = string | boolean | string[] | null;

export type MaterializedRecord = DataRecordDefinition & {
  label: string;
  values: Record<string, MaterializedValue>;
};

export function fieldOptions(field: DataFieldDefinition): string[] {
  if (!field.config || Array.isArray(field.config) || typeof field.config !== "object") return [];
  const options = field.config.options;
  return Array.isArray(options) ? options.filter((option): option is string => typeof option === "string") : [];
}

export function fieldConfigString(field: DataFieldDefinition, key: string) {
  if (!field.config || Array.isArray(field.config) || typeof field.config !== "object") return undefined;
  const value = field.config[key];
  return typeof value === "string" ? value : undefined;
}

export function fieldConfigStrings(field: DataFieldDefinition, key: string) {
  if (!field.config || Array.isArray(field.config) || typeof field.config !== "object") return [];
  const value = field.config[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}
