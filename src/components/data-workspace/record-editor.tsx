"use client";

import { Check, Link2, Save } from "lucide-react";
import { useActionState } from "react";

import { saveDataRecordAction } from "@/app/actions/data-workspace";
import { fieldOptions, type DataFieldDefinition, type MaterializedRecord, type MaterializedValue } from "@/features/data-workspace/types";

const inputClass = "min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-700 focus:ring-3 focus:ring-blue-700/15 disabled:cursor-not-allowed disabled:bg-slate-100";
const workspaceIdleState = { status: "idle" as const };

function valueAsText(value: MaterializedValue) {
  return typeof value === "string" ? value : "";
}

export function RecordEditor({
  projectId,
  tableId,
  fields,
  allRecords,
  record,
  idempotencyKey,
  formId = "",
  submitLabel = "Save record",
  visibleFieldIds,
  anchorRecordId = "",
  placement = "",
}: {
  projectId: string;
  tableId: string;
  fields: DataFieldDefinition[];
  allRecords: MaterializedRecord[];
  record?: MaterializedRecord;
  idempotencyKey: string;
  formId?: string;
  submitLabel?: string;
  visibleFieldIds?: string[];
  anchorRecordId?: string;
  placement?: "above" | "below" | "";
}) {
  const [state, action, pending] = useActionState(saveDataRecordAction, workspaceIdleState);
  const recordsByTable = new Map<string, MaterializedRecord[]>();
  for (const optionRecord of allRecords) {
    const group = recordsByTable.get(optionRecord.table_id) ?? [];
    group.push(optionRecord);
    recordsByTable.set(optionRecord.table_id, group);
  }
  const visibleSet = visibleFieldIds ? new Set(visibleFieldIds) : null;
  const editableFields = fields.filter((field) => field.table_id === tableId && (visibleSet?.has(field.id) ?? true));

  return <form action={action} className="space-y-5" noValidate>
    <input name="projectId" type="hidden" value={projectId} />
    <input name="tableId" type="hidden" value={tableId} />
    <input name="recordId" type="hidden" value={record?.id ?? ""} />
    <input name="formId" type="hidden" value={formId} />
    <input name="anchorRecordId" type="hidden" value={anchorRecordId} />
    <input name="placement" type="hidden" value={placement} />
    <input name="idempotencyKey" type="hidden" value={idempotencyKey} />
    {state.status === "error" ? <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-900" role="alert">{state.message}</p> : null}
    {editableFields.map((field) => {
      const value = record?.values[field.id] ?? null;
      const error = state.fieldErrors?.[field.id]?.[0];
      if (["lookup", "formula"].includes(field.field_type)) {
        return <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3" key={field.id}><div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-lg bg-violet-100 text-violet-800"><Link2 className="size-4" aria-hidden="true" /></span><div><p className="text-sm font-bold text-slate-800">{field.name}</p><p className="text-xs text-slate-500">Calculated automatically after save</p></div></div>{value ? <p className="mt-2 text-sm text-slate-700">{Array.isArray(value) ? value.join(", ") : String(value)}</p> : null}</div>;
      }
      return <div key={field.id}>
        <label className="mb-1.5 block text-sm font-bold text-slate-800" htmlFor={`record-${field.id}`}>{field.name}{field.is_required ? <span className="ml-1 text-red-700" aria-hidden="true">*</span> : null}<span className="sr-only">{field.is_required ? " required" : ""}</span></label>
        {field.field_type === "long_text" ? <textarea aria-invalid={Boolean(error)} className={`${inputClass} min-h-28 py-3`} defaultValue={valueAsText(value)} id={`record-${field.id}`} name={`field_${field.id}`} required={field.is_required} /> : null}
        {["text", "email", "phone", "url", "number", "currency", "date"].includes(field.field_type) ? <input aria-invalid={Boolean(error)} className={inputClass} defaultValue={valueAsText(value)} id={`record-${field.id}`} inputMode={["number", "currency"].includes(field.field_type) ? "decimal" : undefined} name={`field_${field.id}`} required={field.is_required} type={field.field_type === "date" ? "date" : field.field_type === "email" ? "email" : field.field_type === "url" ? "url" : field.field_type === "phone" ? "tel" : field.field_type === "number" || field.field_type === "currency" ? "number" : "text"} step={field.field_type === "currency" ? "0.01" : field.field_type === "number" ? "any" : undefined} /> : null}
        {field.field_type === "checkbox" ? <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-800" htmlFor={`record-${field.id}`}><input className="size-4 accent-blue-700" defaultChecked={value === true} id={`record-${field.id}`} name={`field_${field.id}`} type="checkbox" value="true" /><span className="grid size-6 place-items-center rounded-md bg-green-50 text-green-700"><Check className="size-4" aria-hidden="true" /></span>Checked</label> : null}
        {field.field_type === "single_select" ? <select aria-invalid={Boolean(error)} className={inputClass} defaultValue={valueAsText(value)} id={`record-${field.id}`} name={`field_${field.id}`} required={field.is_required}><option value="">No selection</option>{fieldOptions(field).map((option) => <option key={option} value={option}>{option}</option>)}</select> : null}
        {field.field_type === "multi_select" ? <fieldset className="grid gap-2 rounded-lg border border-slate-200 p-3"><legend className="sr-only">{field.name} options</legend>{fieldOptions(field).map((option) => <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" key={option}><input className="size-4 accent-blue-700" defaultChecked={Array.isArray(value) && value.includes(option)} name={`field_${field.id}`} type="checkbox" value={option} />{option}</label>)}</fieldset> : null}
        {field.field_type === "link" ? <fieldset className="grid max-h-64 gap-2 overflow-y-auto rounded-lg border border-violet-200 bg-violet-50/40 p-3"><legend className="px-1 text-xs font-bold uppercase tracking-[0.12em] text-violet-800">Linked records</legend>{(recordsByTable.get(field.linked_table_id ?? "") ?? []).length ? (recordsByTable.get(field.linked_table_id ?? "") ?? []).filter((option) => option.id !== record?.id).map((option) => <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-violet-100 bg-white px-3 text-sm font-semibold text-slate-800" key={option.id}><input className="size-4 accent-violet-700" defaultChecked={Array.isArray(value) && value.includes(option.id)} name={`field_${field.id}`} type="checkbox" value={option.id} />{option.label}</label>) : <p className="text-sm leading-6 text-violet-900">The linked table has no records yet. Save this record, add records there, then return to create the relationship.</p>}</fieldset> : null}
        {error ? <p className="mt-1 text-sm text-red-700">{error}</p> : null}
      </div>;
    })}
    <button className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-700/25 disabled:cursor-wait disabled:opacity-60" disabled={pending} type="submit"><Save className="size-4" aria-hidden="true" />{pending ? "Saving…" : submitLabel}</button>
  </form>;
}
