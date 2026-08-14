"use client";

import { Braces, Columns3, LayoutDashboard, ListFilter, Plus, Table2 } from "lucide-react";
import { useActionState, useState } from "react";

import {
  createDataFieldAction,
  createDataFormAction,
  createDataInterfaceAction,
  createDataTableAction,
  createDataViewAction,
} from "@/app/actions/data-workspace";
import { type DataFieldDefinition, type DataFieldType } from "@/features/data-workspace/types";

const inputClass = "min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-700 focus:ring-3 focus:ring-blue-700/15 disabled:cursor-not-allowed disabled:bg-slate-100";
const labelClass = "mb-1.5 block text-sm font-bold text-slate-800";
const workspaceIdleState = { status: "idle" as const };

function ActionFeedback({ state }: { state: { status: string; message?: string } }) {
  return state.status === "error" ? <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900" role="alert">{state.message}</p> : null;
}

function ErrorText({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-sm text-red-700">{message}</p> : null;
}

function SubmitButton({ pending, label, icon: Icon }: { pending: boolean; label: string; icon: typeof Plus }) {
  return <button className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-700/25 disabled:cursor-wait disabled:opacity-60" disabled={pending} type="submit"><Icon className="size-4" aria-hidden="true" />{pending ? "Saving…" : label}</button>;
}

function CommandFields({ projectId, idempotencyKey }: { projectId: string; idempotencyKey: string }) {
  return <><input name="projectId" type="hidden" value={projectId} /><input name="idempotencyKey" type="hidden" value={idempotencyKey} /></>;
}

export function TableDefinitionForm({ projectId, idempotencyKey }: { projectId: string; idempotencyKey: string }) {
  const [state, action, pending] = useActionState(createDataTableAction, workspaceIdleState);
  return <form action={action} className="space-y-5" noValidate>
    <CommandFields idempotencyKey={idempotencyKey} projectId={projectId} />
    <ActionFeedback state={state} />
    <div><label className={labelClass} htmlFor="table-name">Table name</label><input className={inputClass} id="table-name" maxLength={120} name="name" placeholder="Tasks" required /><ErrorText message={state.fieldErrors?.name?.[0]} /></div>
    <div><label className={labelClass} htmlFor="table-description">Description</label><textarea className={`${inputClass} min-h-24 py-3`} id="table-description" maxLength={500} name="description" placeholder="What this table stores and how it will be used." /></div>
    <div><label className={labelClass} htmlFor="table-color">Table color</label><select className={inputClass} defaultValue="blue" id="table-color" name="color">{["blue", "cyan", "green", "amber", "orange", "violet", "rose", "slate"].map((color) => <option key={color} value={color}>{color.charAt(0).toUpperCase() + color.slice(1)}</option>)}</select></div>
    <p className="rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600">Every new table starts with a required primary <strong>Name</strong> field and a Grid view.</p>
    <SubmitButton icon={Table2} label="Create table" pending={pending} />
  </form>;
}

const fieldTypeGroups: { label: string; options: { value: DataFieldType; label: string }[] }[] = [
  { label: "Text", options: [{ value: "text", label: "Single line text" }, { value: "long_text", label: "Long text" }, { value: "email", label: "Email" }, { value: "phone", label: "Phone" }, { value: "url", label: "Web address" }] },
  { label: "Numbers", options: [{ value: "number", label: "Number" }, { value: "currency", label: "Currency" }] },
  { label: "Choices", options: [{ value: "checkbox", label: "Checkbox" }, { value: "single_select", label: "Single select" }, { value: "multi_select", label: "Multiple select" }, { value: "date", label: "Date" }] },
  { label: "Relationships", options: [{ value: "link", label: "Link to records" }, { value: "lookup", label: "Lookup through a link" }, { value: "formula", label: "Formula" }] },
];

export function FieldDefinitionForm({ projectId, tableId, idempotencyKey, tables, fields }: { projectId: string; tableId: string; idempotencyKey: string; tables: { id: string; name: string }[]; fields: DataFieldDefinition[] }) {
  const [state, action, pending] = useActionState(createDataFieldAction, workspaceIdleState);
  const [fieldType, setFieldType] = useState<DataFieldType>("text");
  const [lookupLinkId, setLookupLinkId] = useState("");
  const linkFields = fields.filter((field) => field.table_id === tableId && field.field_type === "link");
  const selectedLink = fields.find((field) => field.id === lookupLinkId);
  const lookupTargets = fields.filter((field) => field.table_id === selectedLink?.linked_table_id && !["lookup", "formula"].includes(field.field_type));
  const formulaSources = fields.filter((field) => field.table_id === tableId && !["lookup", "formula"].includes(field.field_type));

  return <form action={action} className="space-y-5" noValidate>
    <CommandFields idempotencyKey={idempotencyKey} projectId={projectId} /><input name="tableId" type="hidden" value={tableId} />
    <ActionFeedback state={state} />
    <div><label className={labelClass} htmlFor="field-name">Field name</label><input className={inputClass} id="field-name" maxLength={120} name="name" placeholder="Status" required /><ErrorText message={state.fieldErrors?.name?.[0]} /></div>
    <div><label className={labelClass} htmlFor="field-type">Field type</label><select className={inputClass} id="field-type" name="fieldType" onChange={(event) => setFieldType(event.target.value as DataFieldType)} value={fieldType}>{fieldTypeGroups.map((group) => <optgroup key={group.label} label={group.label}>{group.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</optgroup>)}</select></div>

    {["single_select", "multi_select"].includes(fieldType) ? <div><label className={labelClass} htmlFor="field-options">Options</label><textarea className={`${inputClass} min-h-24 py-3`} id="field-options" name="options" placeholder="Not started, In progress, Complete" /><p className="mt-1 text-xs leading-5 text-slate-500">Separate options with commas. You can add more later.</p><ErrorText message={state.fieldErrors?.options?.[0]} /></div> : null}

    {fieldType === "link" ? <div><label className={labelClass} htmlFor="linked-table">Table to link</label><select className={inputClass} defaultValue="" id="linked-table" name="linkedTableId" required><option disabled value="">Choose a table</option>{tables.map((table) => <option key={table.id} value={table.id}>{table.name}{table.id === tableId ? " (this table)" : ""}</option>)}</select><p className="mt-1 text-xs leading-5 text-slate-500">A record can link to one or many records in the selected table.</p></div> : null}

    {fieldType === "lookup" ? <div className="space-y-4 rounded-xl border border-violet-200 bg-violet-50/60 p-4"><div><label className={labelClass} htmlFor="lookup-link">Follow linked-record field</label><select className={inputClass} id="lookup-link" name="lookupLinkFieldId" onChange={(event) => setLookupLinkId(event.target.value)} value={lookupLinkId}><option value="">Choose a link field</option>{linkFields.map((field) => <option key={field.id} value={field.id}>{field.name}</option>)}</select></div><div><label className={labelClass} htmlFor="lookup-target">Return field</label><select className={inputClass} defaultValue="" disabled={!lookupLinkId} id="lookup-target" name="lookupTargetFieldId"><option value="">Choose a target field</option>{lookupTargets.map((field) => <option key={field.id} value={field.id}>{field.name}</option>)}</select></div>{linkFields.length === 0 ? <p className="text-sm text-violet-900">Create a linked-record field in this table before adding a lookup.</p> : null}</div> : null}

    {fieldType === "formula" ? <div className="space-y-4 rounded-xl border border-cyan-200 bg-cyan-50/60 p-4"><div><label className={labelClass} htmlFor="formula-operator">Operation</label><select className={inputClass} defaultValue="sum" id="formula-operator" name="formulaOperator"><option value="sum">Add values</option><option value="difference">Subtract values</option><option value="multiply">Multiply values</option><option value="percent">First value as % of second</option><option value="concatenate">Join text</option><option value="count">Count filled or linked values</option></select></div><fieldset><legend className={labelClass}>Source fields</legend><div className="grid gap-2">{formulaSources.map((field) => <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-cyan-200 bg-white px-3 text-sm font-semibold text-slate-800" key={field.id}><input className="size-4 accent-blue-700" name="formulaSourceFieldIds" type="checkbox" value={field.id} />{field.name}<span className="ml-auto text-xs font-medium text-slate-500">{field.field_type.replaceAll("_", " ")}</span></label>)}</div></fieldset></div> : null}

    {!['lookup', 'formula'].includes(fieldType) ? <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-800"><input className="size-4 accent-blue-700" name="isRequired" type="checkbox" value="true" />Require a value when records are saved</label> : null}
    <SubmitButton icon={Columns3} label="Create field" pending={pending} />
  </form>;
}

export function ViewDefinitionForm({ projectId, tableId, idempotencyKey }: { projectId: string; tableId: string; idempotencyKey: string }) {
  const [state, action, pending] = useActionState(createDataViewAction, workspaceIdleState);
  return <form action={action} className="space-y-5" noValidate><CommandFields idempotencyKey={idempotencyKey} projectId={projectId} /><input name="tableId" type="hidden" value={tableId} /><ActionFeedback state={state} /><div><label className={labelClass} htmlFor="view-name">View name</label><input className={inputClass} id="view-name" name="name" placeholder="Open tasks" required /></div><div><label className={labelClass} htmlFor="view-type">Layout</label><select className={inputClass} defaultValue="grid" id="view-type" name="viewType"><option value="grid">Grid</option><option value="list">List</option><option value="gallery">Gallery</option></select></div><SubmitButton icon={ListFilter} label="Create view" pending={pending} /></form>;
}

export function FormDefinitionForm({ projectId, idempotencyKey, tables }: { projectId: string; idempotencyKey: string; tables: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(createDataFormAction, workspaceIdleState);
  return <form action={action} className="space-y-5" noValidate><CommandFields idempotencyKey={idempotencyKey} projectId={projectId} /><ActionFeedback state={state} /><div><label className={labelClass} htmlFor="form-name">Form name</label><input className={inputClass} id="form-name" name="name" placeholder="Daily site log" required /></div><div><label className={labelClass} htmlFor="form-table">Destination table</label><select className={inputClass} defaultValue="" id="form-table" name="tableId" required><option disabled value="">Choose a table</option>{tables.map((table) => <option key={table.id} value={table.id}>{table.name}</option>)}</select></div><div><label className={labelClass} htmlFor="form-description">Instructions</label><textarea className={`${inputClass} min-h-24 py-3`} id="form-description" name="description" placeholder="Explain what should be entered." /></div><div><label className={labelClass} htmlFor="submit-label">Submit button label</label><input className={inputClass} defaultValue="Submit" id="submit-label" name="submitLabel" /></div><SubmitButton icon={Braces} label="Create form" pending={pending} /></form>;
}

export function InterfaceDefinitionForm({ projectId, idempotencyKey, tables }: { projectId: string; idempotencyKey: string; tables: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(createDataInterfaceAction, workspaceIdleState);
  return <form action={action} className="space-y-5" noValidate><CommandFields idempotencyKey={idempotencyKey} projectId={projectId} /><ActionFeedback state={state} /><div><label className={labelClass} htmlFor="interface-name">Interface name</label><input className={inputClass} id="interface-name" name="name" placeholder="Site overview" required /></div><div><label className={labelClass} htmlFor="interface-table">Primary table</label><select className={inputClass} defaultValue="" id="interface-table" name="tableId" required><option disabled value="">Choose a table</option>{tables.map((table) => <option key={table.id} value={table.id}>{table.name}</option>)}</select><p className="mt-1 text-xs leading-5 text-slate-500">The first interface contains a live record count and recent-record list. More block controls will be added next.</p></div><div><label className={labelClass} htmlFor="interface-description">Purpose</label><textarea className={`${inputClass} min-h-24 py-3`} id="interface-description" name="description" placeholder="Who uses this screen and what should it answer?" /></div><SubmitButton icon={LayoutDashboard} label="Create interface" pending={pending} /></form>;
}
