import { z } from "zod";

import { dataFieldTypes } from "@/features/data-workspace/types";

const uuid = z.string().uuid("The selected item is invalid.");
const idempotencyKey = z.string().uuid("Refresh this panel and try again.");
const name = z.string().trim().min(1, "Enter a name.").max(120, "Use 120 characters or fewer.");

export const createDataTableSchema = z.object({
  projectId: uuid,
  idempotencyKey,
  name,
  description: z.string().trim().max(500).optional().default(""),
  color: z.enum(["blue", "cyan", "green", "amber", "orange", "violet", "rose", "slate"]),
});

export const createDataFieldSchema = z.object({
  projectId: uuid,
  tableId: uuid,
  idempotencyKey,
  name,
  fieldType: z.enum(dataFieldTypes),
  isRequired: z.boolean(),
  options: z.string().max(1000).optional().default(""),
  linkedTableId: z.string().optional().default(""),
  lookupLinkFieldId: z.string().optional().default(""),
  lookupTargetFieldId: z.string().optional().default(""),
  formulaOperator: z.string().optional().default(""),
  formulaSourceFieldIds: z.array(z.string()).default([]),
});

export const createDataViewSchema = z.object({
  projectId: uuid,
  tableId: uuid,
  idempotencyKey,
  name,
  viewType: z.enum(["grid", "list", "gallery"]),
});

export const createDataFormSchema = z.object({
  projectId: uuid,
  tableId: uuid,
  idempotencyKey,
  name,
  description: z.string().trim().max(1000).optional().default(""),
  submitLabel: z.string().trim().min(1).max(80),
});

export const createDataInterfaceSchema = z.object({
  projectId: uuid,
  tableId: uuid,
  idempotencyKey,
  name,
  description: z.string().trim().max(1000).optional().default(""),
});

export const recordCommandSchema = z.object({
  projectId: uuid,
  tableId: uuid,
  recordId: z.union([uuid, z.literal("")]).default(""),
  formId: z.union([uuid, z.literal("")]).default(""),
  anchorRecordId: z.union([uuid, z.literal("")]).default(""),
  placement: z.union([z.enum(["above", "below"]), z.literal("")]).default(""),
  idempotencyKey,
});

export const archiveRecordSchema = z.object({
  projectId: uuid,
  tableId: uuid,
  recordId: uuid,
  idempotencyKey,
});

export const gridRecordMutationSchema = z.object({
  projectId: uuid,
  tableId: uuid,
  recordId: uuid,
  idempotencyKey,
});

export const gridFieldMutationSchema = z.object({
  projectId: uuid,
  tableId: uuid,
  fieldId: uuid,
  idempotencyKey,
});

export const gridTableMutationSchema = z.object({
  projectId: uuid,
  tableId: uuid,
  idempotencyKey,
});

export const reorderFieldsSchema = z.object({
  projectId: uuid,
  tableId: uuid,
  fieldIds: z.array(uuid).min(1),
  idempotencyKey,
});

export const createRecordCommentSchema = z.object({
  projectId: uuid,
  tableId: uuid,
  recordId: uuid,
  body: z.string().trim().min(1, "Write a comment first.").max(4000, "Use 4,000 characters or fewer."),
  idempotencyKey,
});
