"use client";

import {
  ArrowDown,
  ArrowUp,
  Check,
  Circle,
  Columns3,
  Copy,
  GripVertical,
  Link2,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type DragEvent,
  type MouseEvent,
} from "react";

import {
  archiveDataFieldMutation,
  archiveDataRecordMutation,
  duplicateDataRecordMutation,
  reorderDataFieldsMutation,
  saveDataRecordAction,
} from "@/app/actions/data-workspace";
import { linkedRecordLabels } from "@/features/data-workspace/materialize";
import {
  fieldOptions,
  type DataFieldDefinition,
  type MaterializedRecord,
  type MaterializedValue,
} from "@/features/data-workspace/types";
import { groupDataRecords } from "@/features/data-workspace/view-operations";
import { cn } from "@/lib/cn";
import { formatCurrency, formatProjectDate } from "@/lib/format";

const idleState = { status: "idle" as const };
const cellInputClass = "h-10 w-full min-w-36 rounded-md border border-transparent bg-transparent px-2 text-sm text-slate-950 outline-none placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-blue-700 focus:bg-white focus:ring-3 focus:ring-blue-700/15";
const mobileInputClass = "min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-950 outline-none focus:border-blue-700 focus:ring-3 focus:ring-blue-700/15";

function DisplayValue({ field, value, recordMap, currencyCode }: { field: DataFieldDefinition; value: MaterializedValue; recordMap: Map<string, MaterializedRecord>; currencyCode: string }) {
  if (value === null || value === "" || (Array.isArray(value) && value.length === 0)) return <span className="text-slate-300">—</span>;
  if (field.field_type === "checkbox") return value === true ? <span className="inline-flex items-center gap-1.5 font-semibold text-green-700"><Check className="size-4" aria-hidden="true" />Checked</span> : <span className="inline-flex items-center gap-1.5 text-slate-500"><Circle className="size-3" aria-hidden="true" />Not checked</span>;
  if (field.field_type === "currency" && typeof value === "string") return <span className="font-semibold tabular-nums">{formatCurrency(Number(value), currencyCode)}</span>;
  if (field.field_type === "date" && typeof value === "string") return formatProjectDate(value);
  if (field.field_type === "link") {
    const labels = linkedRecordLabels(value, recordMap);
    return <span className="flex flex-wrap gap-1">{labels.map((label, index) => <span className="inline-flex items-center gap-1 rounded-md bg-violet-100 px-2 py-1 text-xs font-bold text-violet-900" key={`${label}-${index}`}><Link2 className="size-3" aria-hidden="true" />{label}</span>)}</span>;
  }
  if (Array.isArray(value)) return <span className="flex flex-wrap gap-1">{value.map((item, index) => <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700" key={`${item}-${index}`}>{item}</span>)}</span>;
  return <span className={field.field_type === "number" || field.field_type === "formula" ? "tabular-nums" : ""}>{String(value)}</span>;
}

function compactValue(value: MaterializedValue | undefined) {
  if (Array.isArray(value)) return value.join(", ");
  return value === null || value === undefined ? "—" : String(value);
}

function hrefWithPanel(baseHref: string, panel: string, values: Record<string, string> = {}) {
  const [pathname = baseHref, currentQuery = ""] = baseHref.split("?");
  const params = new URLSearchParams(currentQuery);
  params.set("panel", panel);
  for (const [key, value] of Object.entries(values)) params.set(key, value);
  return `${pathname}?${params}`;
}

function CommandFields({ formId, projectId, tableId, idempotencyKey }: { formId?: string; projectId: string; tableId: string; idempotencyKey: string }) {
  return <>
    <input form={formId} name="projectId" type="hidden" value={projectId} />
    <input form={formId} name="tableId" type="hidden" value={tableId} />
    <input form={formId} name="recordId" type="hidden" value="" />
    <input form={formId} name="formId" type="hidden" value="" />
    <input form={formId} name="anchorRecordId" type="hidden" value="" />
    <input form={formId} name="placement" type="hidden" value="" />
    <input form={formId} name="idempotencyKey" type="hidden" value={idempotencyKey} />
  </>;
}

function InlineFieldInput({ field, formId, allRecords, mobile = false, invalid = false }: { field: DataFieldDefinition; formId?: string; allRecords: MaterializedRecord[]; mobile?: boolean; invalid?: boolean }) {
  const className = mobile ? mobileInputClass : cellInputClass;
  const inputName = `field_${field.id}`;
  if (["lookup", "formula"].includes(field.field_type)) return <span className="block px-2 text-xs font-semibold text-slate-400">Calculated after save</span>;
  if (field.field_type === "checkbox") return <label className={cn("flex min-h-10 cursor-pointer items-center gap-2 rounded-md px-2 text-sm font-semibold text-slate-600 hover:bg-white", mobile && "min-h-11 border border-slate-300")}><input className="size-4 accent-blue-700" form={formId} name={inputName} type="checkbox" value="true" />Checked</label>;
  if (field.field_type === "single_select") return <select aria-invalid={invalid} className={className} defaultValue="" form={formId} name={inputName} required={field.is_required}><option value="">No selection</option>{fieldOptions(field).map((option) => <option key={option} value={option}>{option}</option>)}</select>;
  if (field.field_type === "multi_select") return <select aria-invalid={invalid} className={cn(className, mobile && "min-h-28 py-2")} form={formId} multiple name={inputName} required={field.is_required} size={mobile ? Math.min(4, Math.max(2, fieldOptions(field).length)) : 1}>{fieldOptions(field).map((option) => <option key={option} value={option}>{option}</option>)}</select>;
  if (field.field_type === "link") {
    const options = allRecords.filter((record) => record.table_id === field.linked_table_id);
    return <select aria-invalid={invalid} className={cn(className, mobile && "min-h-28 py-2")} form={formId} multiple name={inputName} required={field.is_required} size={mobile ? Math.min(4, Math.max(2, options.length)) : 1}>{options.map((record) => <option key={record.id} value={record.id}>{record.label}</option>)}</select>;
  }
  const type = field.field_type === "date" ? "date" : field.field_type === "email" ? "email" : field.field_type === "url" ? "url" : field.field_type === "phone" ? "tel" : field.field_type === "number" || field.field_type === "currency" ? "number" : "text";
  return <input aria-invalid={invalid} className={className} form={formId} inputMode={["number", "currency"].includes(field.field_type) ? "decimal" : undefined} name={inputName} placeholder={field.is_primary ? "Add a record…" : ""} required={field.is_required} step={field.field_type === "currency" ? "0.01" : field.field_type === "number" ? "any" : undefined} type={type} />;
}

type MenuState =
  | { kind: "record"; record: MaterializedRecord; x: number; y: number }
  | { kind: "field"; field: DataFieldDefinition; x: number; y: number };

type MenuTarget =
  | { kind: "record"; record: MaterializedRecord }
  | { kind: "field"; field: DataFieldDefinition };

type ConfirmState =
  | { kind: "record"; record: MaterializedRecord }
  | { kind: "field"; field: DataFieldDefinition };

export function DataGrid({
  projectId,
  fields,
  records,
  allRecords,
  tableId,
  currencyCode,
  viewType,
  groupFieldId,
  baseHref,
  inlineIdempotencyKeys,
}: {
  projectId: string;
  fields: DataFieldDefinition[];
  records: MaterializedRecord[];
  allRecords: MaterializedRecord[];
  tableId: string;
  currencyCode: string;
  viewType: string;
  groupFieldId?: string;
  baseHref: string;
  inlineIdempotencyKeys: [string, string];
}) {
  const router = useRouter();
  const rawId = useId().replaceAll(":", "");
  const desktopFormId = `inline-desktop-${rawId}`;
  const menuRef = useRef<HTMLDivElement>(null);
  const [fieldOrder, setFieldOrder] = useState(() => fields.map((field) => field.id));
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [notice, setNotice] = useState<{ kind: "error" | "success"; message: string } | null>(null);
  const [draggingFieldId, setDraggingFieldId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [desktopState, desktopAction, desktopPending] = useActionState(saveDataRecordAction, idleState);
  const [mobileState, mobileAction, mobilePending] = useActionState(saveDataRecordAction, idleState);
  const recordMap = new Map(allRecords.map((record) => [record.id, record]));
  const groups = groupDataRecords(records, groupFieldId);
  const orderedFields = [
    ...fieldOrder.map((fieldId) => fields.find((field) => field.id === fieldId)).filter((field): field is DataFieldDefinition => Boolean(field)),
    ...fields.filter((field) => !fieldOrder.includes(field.id)),
  ];

  useEffect(() => {
    function close(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenu(null);
    }
    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenu(null);
        setConfirm(null);
      }
    }
    function closeOnViewportChange() { setMenu(null); }
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", keydown);
    window.addEventListener("resize", closeOnViewportChange);
    window.addEventListener("scroll", closeOnViewportChange, true);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("resize", closeOnViewportChange);
      window.removeEventListener("scroll", closeOnViewportChange, true);
    };
  }, []);

  function openMenu(event: MouseEvent, target: MenuTarget) {
    event.preventDefault();
    event.stopPropagation();
    setMenu({ ...target, x: Math.max(8, Math.min(event.clientX, window.innerWidth - 240)), y: Math.max(8, Math.min(event.clientY, window.innerHeight - 330)) } as MenuState);
  }

  function persistFieldOrder(nextFields: DataFieldDefinition[], previousFields: DataFieldDefinition[]) {
    setFieldOrder(nextFields.map((field) => field.id));
    setMenu(null);
    startTransition(async () => {
      const result = await reorderDataFieldsMutation({ projectId, tableId, fieldIds: nextFields.map((field) => field.id), idempotencyKey: crypto.randomUUID() });
      if (!result.ok) {
        setFieldOrder(previousFields.map((field) => field.id));
        setNotice({ kind: "error", message: result.message });
        return;
      }
      setNotice({ kind: "success", message: result.message });
      router.refresh();
    });
  }

  function moveField(fieldId: string, direction: -1 | 1) {
    const previous = [...orderedFields];
    const currentIndex = previous.findIndex((field) => field.id === fieldId);
    const targetIndex = currentIndex + direction;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= previous.length) return;
    const next = [...previous];
    const [moved] = next.splice(currentIndex, 1);
    if (!moved) return;
    next.splice(targetIndex, 0, moved);
    persistFieldOrder(next, previous);
  }

  function dropField(event: DragEvent, targetFieldId: string) {
    event.preventDefault();
    if (!draggingFieldId || draggingFieldId === targetFieldId) return;
    const previous = [...orderedFields];
    const sourceIndex = previous.findIndex((field) => field.id === draggingFieldId);
    const targetIndex = previous.findIndex((field) => field.id === targetFieldId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    const next = [...previous];
    const [moved] = next.splice(sourceIndex, 1);
    if (!moved) return;
    next.splice(targetIndex, 0, moved);
    setDraggingFieldId(null);
    persistFieldOrder(next, previous);
  }

  function duplicateRecord(record: MaterializedRecord) {
    setMenu(null);
    startTransition(async () => {
      const result = await duplicateDataRecordMutation({ projectId, tableId, recordId: record.id, idempotencyKey: crypto.randomUUID() });
      setNotice({ kind: result.ok ? "success" : "error", message: result.message });
      if (result.ok) router.refresh();
    });
  }

  function confirmDelete() {
    if (!confirm) return;
    const target = confirm;
    startTransition(async () => {
      const result = target.kind === "record"
        ? await archiveDataRecordMutation({ projectId, tableId, recordId: target.record.id, idempotencyKey: crypto.randomUUID() })
        : await archiveDataFieldMutation({ projectId, tableId, fieldId: target.field.id, idempotencyKey: crypto.randomUUID() });
      setNotice({ kind: result.ok ? "success" : "error", message: result.message });
      if (result.ok && target.kind === "field") setFieldOrder((current) => current.filter((fieldId) => fieldId !== target.field.id));
      setConfirm(null);
      if (result.ok) router.refresh();
    });
  }

  function RecordMenuButton({ record }: { record: MaterializedRecord }) {
    return <button aria-label={`More actions for ${record.label}`} className="grid size-11 place-items-center rounded-lg text-slate-400 opacity-70 hover:bg-white hover:text-slate-900 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-700/25 group-hover:opacity-100" onClick={(event) => openMenu(event, { kind: "record", record })} type="button"><MoreHorizontal className="size-4" /></button>;
  }

  if (viewType === "gallery") return <>
    {notice ? <GridNotice notice={notice} /> : null}
    <div className="grid gap-4 bg-slate-50 p-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{records.map((record) => <article className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm" key={record.id} onContextMenu={(event) => openMenu(event, { kind: "record", record })}><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Record {record.record_number}</p><h2 className="mt-1 font-extrabold text-slate-950">{record.label}</h2></div><RecordMenuButton record={record} /></div><dl className="mt-4 grid gap-3">{orderedFields.filter((field) => !field.is_primary).slice(0, 5).map((field) => <div key={field.id}><dt className="text-xs font-bold text-slate-500">{field.name}</dt><dd className="mt-1 text-sm text-slate-800"><DisplayValue currencyCode={currencyCode} field={field} recordMap={recordMap} value={record.values[field.id] ?? null} /></dd></div>)}</dl></article>)}</div>
    {!records.length ? <NonGridEmpty href={hrefWithPanel(baseHref, "record")} /> : null}
    <FloatingLayers baseHref={baseHref} confirm={confirm} confirmDelete={confirmDelete} menu={menu} menuRef={menuRef} moveField={moveField} pending={pending} setConfirm={setConfirm} setMenu={setMenu} duplicateRecord={duplicateRecord} />
  </>;

  if (viewType === "list") return <>
    {notice ? <GridNotice notice={notice} /> : null}
    <ul className="divide-y divide-slate-200 bg-white">{records.map((record) => <li className="group flex items-center gap-4 px-4 py-3" key={record.id} onContextMenu={(event) => openMenu(event, { kind: "record", record })}><span className="w-10 shrink-0 text-right text-xs font-semibold tabular-nums text-slate-400">{record.record_number}</span><div className="min-w-0 flex-1"><p className="truncate font-bold text-slate-900">{record.label}</p><p className="mt-1 truncate text-xs text-slate-500">{orderedFields.filter((field) => !field.is_primary).slice(0, 3).map((field) => `${field.name}: ${compactValue(record.values[field.id])}`).join(" · ")}</p></div><RecordMenuButton record={record} /></li>)}</ul>
    {!records.length ? <NonGridEmpty href={hrefWithPanel(baseHref, "record")} /> : null}
    <FloatingLayers baseHref={baseHref} confirm={confirm} confirmDelete={confirmDelete} menu={menu} menuRef={menuRef} moveField={moveField} pending={pending} setConfirm={setConfirm} setMenu={setMenu} duplicateRecord={duplicateRecord} />
  </>;

  return <>
    {notice ? <GridNotice notice={notice} /> : null}
    {desktopState.status === "error" ? <GridNotice notice={{ kind: "error", message: desktopState.message ?? "Review the inline row and try again." }} /> : null}
    <form action={desktopAction} className="hidden" id={desktopFormId}><CommandFields idempotencyKey={inlineIdempotencyKeys[0]} projectId={projectId} tableId={tableId} /></form>

    <div className="hidden min-h-[360px] overflow-auto bg-white md:block" role="region" aria-label="Records grid" tabIndex={0}>
      <table className="min-w-max border-collapse text-left text-sm">
        <thead className="sticky top-0 z-10 bg-slate-100">
          <tr>
            <th className="w-14 border-b border-r border-slate-300 px-2 py-1 text-right text-xs font-bold text-slate-500">#</th>
            {orderedFields.map((field) => <th className={cn("min-w-52 border-b border-r border-slate-300 p-0 font-bold text-slate-800", draggingFieldId === field.id && "bg-blue-100")} key={field.id} onContextMenu={(event) => openMenu(event, { kind: "field", field })} onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropField(event, field.id)}>
              <div className="group flex min-h-12 items-center gap-1 px-1">
                <button aria-label={`Drag ${field.name} column`} className="grid size-10 shrink-0 cursor-grab place-items-center rounded-md text-slate-400 hover:bg-white hover:text-slate-700 active:cursor-grabbing" draggable onDragEnd={() => setDraggingFieldId(null)} onDragStart={() => setDraggingFieldId(field.id)} type="button"><GripVertical className="size-4" /></button>
                <span className="min-w-0 flex-1 truncate">{field.name}{field.is_required ? <span className="ml-1 text-red-700">*</span> : null}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{field.field_type.replaceAll("_", " ")}</span>
                <button aria-label={`More actions for ${field.name}`} className="grid size-10 shrink-0 place-items-center rounded-md text-slate-400 opacity-60 hover:bg-white hover:text-slate-900 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-700/25 group-hover:opacity-100" onClick={(event) => openMenu(event, { kind: "field", field })} type="button"><MoreHorizontal className="size-4" /></button>
              </div>
            </th>)}
            <th className="w-14 border-b border-slate-300 p-0"><Link aria-label="Add field" className="grid size-12 place-items-center text-slate-500 hover:bg-white hover:text-blue-800 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-blue-700/25" href={hrefWithPanel(baseHref, "field")}><Plus className="size-4" /></Link></th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => <RowsGroup currencyCode={currencyCode} fields={orderedFields} group={group} grouped={Boolean(groupFieldId)} key={group.key} onContextMenu={openMenu} recordMap={recordMap} renderMenuButton={(record) => <RecordMenuButton record={record} />} />)}
          <tr className="bg-blue-50/35 focus-within:bg-blue-50">
            <td className="border-b border-r border-slate-200 p-1 text-center"><button aria-label="Add record" className="grid size-10 place-items-center rounded-md text-blue-700 hover:bg-white focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-700/25" disabled={desktopPending} form={desktopFormId} type="submit">{desktopPending ? <span className="size-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-700 motion-reduce:animate-none" /> : <Plus className="size-4" />}</button></td>
            {orderedFields.map((field) => <td className="border-b border-r border-slate-200 p-1 align-middle" key={field.id}><InlineFieldInput allRecords={allRecords} field={field} formId={desktopFormId} invalid={Boolean(desktopState.fieldErrors?.[field.id])} /></td>)}
            <td className="border-b border-slate-200 p-1"><button aria-label="Save inline record" className="grid size-10 place-items-center rounded-md text-blue-700 hover:bg-white disabled:cursor-wait disabled:opacity-50" disabled={desktopPending} form={desktopFormId} title="Save record" type="submit"><Save className="size-4" /></button></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div className="grid gap-3 bg-slate-50 p-3 md:hidden">
      <details className="rounded-xl border border-blue-200 bg-white shadow-sm" open={!records.length}>
        <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 font-bold text-blue-800 [&::-webkit-details-marker]:hidden"><Plus className="size-4" />Add record inline<span className="ml-auto text-xs font-semibold text-slate-500">{orderedFields.length} fields</span></summary>
        <form action={mobileAction} className="space-y-4 border-t border-blue-100 p-4" noValidate>
          <CommandFields idempotencyKey={inlineIdempotencyKeys[1]} projectId={projectId} tableId={tableId} />
          {mobileState.status === "error" ? <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900" role="alert">{mobileState.message}</p> : null}
          {orderedFields.map((field) => <div key={field.id}><label className="mb-1.5 block text-sm font-bold text-slate-800">{field.name}{field.is_required ? <span className="ml-1 text-red-700">*</span> : null}</label><InlineFieldInput allRecords={allRecords} field={field} invalid={Boolean(mobileState.fieldErrors?.[field.id])} mobile />{mobileState.fieldErrors?.[field.id]?.[0] ? <p className="mt-1 text-sm text-red-700">{mobileState.fieldErrors[field.id]?.[0]}</p> : null}</div>)}
          <button className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-bold text-white hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60" disabled={mobilePending} type="submit"><Save className="size-4" />{mobilePending ? "Saving…" : "Add record"}</button>
        </form>
      </details>
      {records.map((record) => <article className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm" key={record.id} onContextMenu={(event) => openMenu(event, { kind: "record", record })}><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold text-slate-400">#{record.record_number}</p><h2 className="mt-1 font-extrabold text-slate-950">{record.label}</h2></div><RecordMenuButton record={record} /></div><dl className="mt-4 grid gap-3">{orderedFields.filter((field) => !field.is_primary).map((field) => <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-3" key={field.id}><dt className="text-xs font-bold text-slate-500">{field.name}</dt><dd className="min-w-0 text-sm text-slate-800"><DisplayValue currencyCode={currencyCode} field={field} recordMap={recordMap} value={record.values[field.id] ?? null} /></dd></div>)}</dl></article>)}
    </div>

    <FloatingLayers baseHref={baseHref} confirm={confirm} confirmDelete={confirmDelete} menu={menu} menuRef={menuRef} moveField={moveField} pending={pending} setConfirm={setConfirm} setMenu={setMenu} duplicateRecord={duplicateRecord} />
  </>;
}

function RowsGroup({ group, grouped, fields, recordMap, currencyCode, onContextMenu, renderMenuButton }: { group: ReturnType<typeof groupDataRecords>[number]; grouped: boolean; fields: DataFieldDefinition[]; recordMap: Map<string, MaterializedRecord>; currencyCode: string; onContextMenu: (event: MouseEvent, target: MenuTarget) => void; renderMenuButton: (record: MaterializedRecord) => React.ReactNode }) {
  return <>
    {grouped ? <tr><th className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-extrabold text-slate-700" colSpan={fields.length + 2}><span className="mr-2 inline-block size-2 rounded-full bg-blue-600" />{group.label}<span className="ml-2 font-semibold text-slate-400">{group.records.length}</span></th></tr> : null}
    {group.records.map((record) => <tr className="group hover:bg-blue-50/50" key={record.id} onContextMenu={(event) => onContextMenu(event, { kind: "record", record })}><td className="border-b border-r border-slate-200 px-3 py-2 text-right text-xs font-semibold tabular-nums text-slate-400">{record.record_number}</td>{fields.map((field) => <td className="max-w-sm border-b border-r border-slate-200 px-3 py-2 align-top text-slate-800" key={field.id}><DisplayValue currencyCode={currencyCode} field={field} recordMap={recordMap} value={record.values[field.id] ?? null} /></td>)}<td className="border-b border-slate-200 p-0.5">{renderMenuButton(record)}</td></tr>)}
  </>;
}

function GridNotice({ notice }: { notice: { kind: "error" | "success"; message: string } }) {
  return <div className={cn("border-b px-4 py-2 text-sm font-semibold", notice.kind === "error" ? "border-red-200 bg-red-50 text-red-900" : "border-green-200 bg-green-50 text-green-900")} role={notice.kind === "error" ? "alert" : "status"}>{notice.message}</div>;
}

function NonGridEmpty({ href }: { href: string }) {
  return <div className="grid min-h-72 place-items-center bg-white p-8 text-center"><div><span className="mx-auto grid size-12 place-items-center rounded-xl bg-slate-100 text-slate-600"><Plus className="size-5" /></span><h2 className="mt-4 font-extrabold text-slate-900">No records in this view</h2><Link className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-blue-700 px-4 text-sm font-bold text-white hover:bg-blue-800" href={href}>Add the first record</Link></div></div>;
}

function FloatingLayers({ baseHref, menu, menuRef, setMenu, setConfirm, moveField, duplicateRecord, confirm, confirmDelete, pending }: { baseHref: string; menu: MenuState | null; menuRef: React.RefObject<HTMLDivElement | null>; setMenu: (menu: MenuState | null) => void; setConfirm: (confirm: ConfirmState | null) => void; moveField: (fieldId: string, direction: -1 | 1) => void; duplicateRecord: (record: MaterializedRecord) => void; confirm: ConfirmState | null; confirmDelete: () => void; pending: boolean }) {
  return <>
    {menu ? <div className="fixed z-60 w-60 rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl" ref={menuRef} role="menu" style={{ left: menu.x, top: menu.y }}>
      {menu.kind === "record" ? <>
        <Link className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100" href={hrefWithPanel(baseHref, "record", { record: menu.record.id })} onClick={() => setMenu(null)} role="menuitem"><Pencil className="size-4" />Edit record</Link>
        <Link className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100" href={hrefWithPanel(baseHref, "record", { anchor: menu.record.id, placement: "above" })} onClick={() => setMenu(null)} role="menuitem"><ArrowUp className="size-4" />Insert record above</Link>
        <Link className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100" href={hrefWithPanel(baseHref, "record", { anchor: menu.record.id, placement: "below" })} onClick={() => setMenu(null)} role="menuitem"><ArrowDown className="size-4" />Insert record below</Link>
        <button className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100" disabled={pending} onClick={() => duplicateRecord(menu.record)} role="menuitem" type="button"><Copy className="size-4" />Duplicate record</button>
        <Link className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100" href={hrefWithPanel(baseHref, "comment", { record: menu.record.id })} onClick={() => setMenu(null)} role="menuitem"><MessageSquare className="size-4" />Add comment</Link>
        <div className="my-1 border-t border-slate-200" />
        <button className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold text-red-700 hover:bg-red-50" onClick={() => { setConfirm({ kind: "record", record: menu.record }); setMenu(null); }} role="menuitem" type="button"><Trash2 className="size-4" />Delete record</button>
      </> : <>
        <button className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100" onClick={() => moveField(menu.field.id, -1)} role="menuitem" type="button"><ArrowUp className="size-4 -rotate-90" />Move left</button>
        <button className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100" onClick={() => moveField(menu.field.id, 1)} role="menuitem" type="button"><ArrowDown className="size-4 -rotate-90" />Move right</button>
        <Link className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100" href={hrefWithPanel(baseHref, "field")} onClick={() => setMenu(null)} role="menuitem"><Columns3 className="size-4" />Add field</Link>
        <div className="my-1 border-t border-slate-200" />
        <button className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold text-red-700 hover:bg-red-50 disabled:text-slate-400" disabled={menu.field.is_primary} onClick={() => { setConfirm({ kind: "field", field: menu.field }); setMenu(null); }} role="menuitem" type="button"><Trash2 className="size-4" />{menu.field.is_primary ? "Primary field cannot be deleted" : "Delete field"}</button>
      </>}
    </div> : null}

    {confirm ? <div className="fixed inset-0 z-70 grid place-items-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="grid-delete-title">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <span className="grid size-11 place-items-center rounded-xl bg-red-100 text-red-700"><Trash2 className="size-5" /></span>
        <h2 className="mt-4 text-lg font-extrabold text-slate-950" id="grid-delete-title">Delete {confirm.kind === "record" ? `“${confirm.record.label}”` : `field “${confirm.field.name}”`}?</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">It will disappear from active views. The audit history remains available, and linked or dependent data may need to be removed first.</p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50" disabled={pending} onClick={() => setConfirm(null)} type="button">Cancel</button><button className="min-h-11 rounded-lg bg-red-700 px-4 text-sm font-bold text-white hover:bg-red-800 disabled:cursor-wait disabled:opacity-60" disabled={pending} onClick={confirmDelete} type="button">{pending ? "Deleting…" : "Delete"}</button></div>
      </div>
    </div> : null}
  </>;
}
