import { randomUUID } from "node:crypto";

import { Archive, ChevronDown, Columns3, Filter, Plus, Search, Table2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { archiveDataRecordAction } from "@/app/actions/data-workspace";
import { FieldDefinitionForm, TableDefinitionForm, ViewDefinitionForm } from "@/components/data-workspace/builder-forms";
import { DataGrid } from "@/components/data-workspace/data-grid";
import { RecordEditor } from "@/components/data-workspace/record-editor";
import { materializeDataRecords } from "@/features/data-workspace/materialize";
import { getApplicationAccess } from "@/lib/auth/access";
import { cn } from "@/lib/cn";
import { getDataWorkspace } from "@/server/data-workspace";

const colorClasses: Record<string, string> = { blue: "bg-blue-600", cyan: "bg-cyan-600", green: "bg-green-600", amber: "bg-amber-600", orange: "bg-orange-600", violet: "bg-violet-600", rose: "bg-rose-600", slate: "bg-slate-600" };

export default async function DataTablePage({ params, searchParams }: { params: Promise<{ tableId: string }>; searchParams: Promise<{ panel?: string; record?: string; view?: string; q?: string; created?: string; saved?: string; archived?: string; error?: string }> }) {
  const access = await getApplicationAccess();
  const project = access.mode === "authenticated" ? access.project : null;
  if (!project) notFound();
  const { tableId } = await params;
  const query = await searchParams;
  const workspace = await getDataWorkspace(project.id);
  const table = workspace.tables.find((item) => item.id === tableId);
  if (!table) notFound();
  const fields = workspace.fields.filter((field) => field.table_id === tableId);
  const allRecords = materializeDataRecords(workspace.fields, workspace.records, workspace.cells, workspace.links);
  const tableRecords = allRecords.filter((record) => record.table_id === tableId);
  const search = query.q?.trim().toLocaleLowerCase() ?? "";
  const records = search ? tableRecords.filter((record) => Object.values(record.values).some((value) => (Array.isArray(value) ? value.join(" ") : String(value ?? "")).toLocaleLowerCase().includes(search))) : tableRecords;
  const views = workspace.views.filter((view) => view.table_id === tableId);
  const activeView = views.find((view) => view.id === query.view) ?? views[0];
  const editRecord = allRecords.find((record) => record.id === query.record && record.table_id === tableId);
  const closeHref = `/data/${tableId}${activeView ? `?view=${activeView.id}` : ""}`;
  const success = query.created === "field" ? "Field added to this table." : query.created === "view" ? "View created." : query.saved === "updated" ? "Record updated." : query.saved === "created" ? "Record added." : query.archived ? "Record archived." : undefined;

  return <div className="flex min-h-[calc(100dvh-7rem)] flex-col bg-white lg:flex-row">
    <aside className="border-b border-slate-200 bg-slate-50 lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r" aria-label="Tables"><div className="hidden items-center justify-between px-4 py-4 lg:flex"><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Tables</p><Link aria-label="Create table" className="grid size-10 place-items-center rounded-lg text-slate-500 hover:bg-white hover:text-blue-800 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-700/25" href={`/data/${tableId}?panel=table`}><Plus className="size-4" /></Link></div><nav className="flex gap-1 overflow-x-auto px-3 py-2 lg:block lg:space-y-1 lg:overflow-visible lg:py-0">{workspace.tables.map((item) => <Link aria-current={item.id === tableId ? "page" : undefined} className={cn("flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-bold transition-colors lg:w-full", item.id === tableId ? "bg-white text-slate-950 shadow-sm ring-1 ring-slate-200" : "text-slate-600 hover:bg-white hover:text-slate-950")} href={`/data/${item.id}`} key={item.id}><span className={cn("size-2.5 rounded-sm", colorClasses[item.color] ?? "bg-blue-600")} aria-hidden="true" />{item.name}</Link>)}</nav><div className="hidden border-t border-slate-200 p-3 lg:block"><Link className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-bold text-slate-600 hover:bg-white hover:text-blue-800" href={`/data/${tableId}?panel=table`}><Plus className="size-4" />Add table</Link></div></aside>

    <section className="min-w-0 flex-1">
      {success ? <div className="border-b border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-900" role="status">{success}</div> : null}
      {query.error ? <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-900" role="alert">That action could not be completed. Refresh and try again.</div> : null}
      <header className="border-b border-slate-200 bg-white px-4 py-3 sm:px-5"><div className="flex flex-wrap items-center gap-3"><span className={cn("size-3 rounded-sm", colorClasses[table.color] ?? "bg-blue-600")} aria-hidden="true" /><div className="min-w-0"><h1 className="truncate text-lg font-extrabold text-slate-950">{table.name}</h1><p className="text-xs text-slate-500">{tableRecords.length} record{tableRecords.length === 1 ? "" : "s"} · {fields.length} fields</p></div><div className="ml-auto flex flex-wrap gap-2"><Link className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-700/25" href={`/data/${tableId}?panel=field`}><Columns3 className="size-4" aria-hidden="true" />Add field</Link><Link className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-bold text-white hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-700/25" href={`/data/${tableId}?panel=record`}><Plus className="size-4" aria-hidden="true" />New record</Link></div></div></header>

      <div className="flex flex-col border-b border-slate-200 bg-slate-50/70 sm:flex-row sm:items-center"><nav className="flex min-h-12 gap-1 overflow-x-auto px-3 py-1" aria-label="Views">{views.map((view) => <Link aria-current={view.id === activeView?.id ? "page" : undefined} className={cn("inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-bold", view.id === activeView?.id ? "bg-white text-blue-800 shadow-sm ring-1 ring-slate-200" : "text-slate-600 hover:bg-white")} href={`/data/${tableId}?view=${view.id}`} key={view.id}><Table2 className="size-4" aria-hidden="true" />{view.name}</Link>)}<Link aria-label="Create view" className="grid size-10 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-white hover:text-blue-800" href={`/data/${tableId}?panel=view`}><Plus className="size-4" /></Link></nav><form className="flex gap-2 border-t border-slate-200 p-2 sm:ml-auto sm:border-l sm:border-t-0" role="search"><input name="view" type="hidden" value={activeView?.id ?? ""} /><label className="relative min-w-0 flex-1 sm:w-60"><span className="sr-only">Search this table</span><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" /><input className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-base outline-none focus:border-blue-700 focus:ring-3 focus:ring-blue-700/15" defaultValue={query.q} name="q" placeholder="Find in view" type="search" /></label><button className="grid size-10 place-items-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-100" title="Apply search" type="submit"><Filter className="size-4" /><span className="sr-only">Apply search</span></button></form></div>

      <DataGrid allRecords={allRecords} currencyCode={project.currencyCode} fields={fields} records={records} tableId={tableId} viewType={activeView?.view_type ?? "grid"} />
    </section>

    {query.panel ? <SidePanel closeHref={closeHref} title={query.panel === "table" ? "Create table" : query.panel === "field" ? "Create field" : query.panel === "view" ? "Create view" : editRecord ? `Edit ${editRecord.label}` : `New ${table.name} record`}>
      {query.panel === "table" ? <TableDefinitionForm idempotencyKey={randomUUID()} projectId={project.id} /> : null}
      {query.panel === "field" ? <FieldDefinitionForm fields={workspace.fields} idempotencyKey={randomUUID()} projectId={project.id} tableId={tableId} tables={workspace.tables} /> : null}
      {query.panel === "view" ? <ViewDefinitionForm idempotencyKey={randomUUID()} projectId={project.id} tableId={tableId} /> : null}
      {query.panel === "record" ? <><RecordEditor allRecords={allRecords} fields={fields} idempotencyKey={randomUUID()} projectId={project.id} record={editRecord} tableId={tableId} />{editRecord ? <details className="mt-8 rounded-xl border border-red-200 bg-red-50"><summary className="flex min-h-11 cursor-pointer items-center gap-2 px-4 text-sm font-bold text-red-800"><Archive className="size-4" />Archive record<ChevronDown className="ml-auto size-4" /></summary><div className="border-t border-red-200 p-4"><p className="text-sm leading-6 text-red-900">This removes the record from active views without silently deleting its audit history.</p><form action={archiveDataRecordAction} className="mt-3"><input name="projectId" type="hidden" value={project.id} /><input name="tableId" type="hidden" value={tableId} /><input name="recordId" type="hidden" value={editRecord.id} /><input name="idempotencyKey" type="hidden" value={randomUUID()} /><button className="min-h-11 w-full rounded-lg bg-red-700 px-4 text-sm font-bold text-white hover:bg-red-800" type="submit">Confirm archive</button></form></div></details> : null}</> : null}
    </SidePanel> : null}
  </div>;
}

function SidePanel({ title, closeHref, children }: { title: string; closeHref: string; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="workspace-panel-heading"><Link aria-label="Close panel" className="absolute inset-0 bg-slate-950/45" href={closeHref} /><aside className="absolute inset-y-0 right-0 w-full max-w-lg overflow-y-auto bg-white shadow-2xl"><header className="sticky top-0 z-10 flex min-h-16 items-center justify-between border-b border-slate-200 bg-white/96 px-5 backdrop-blur"><h2 className="font-extrabold text-slate-950" id="workspace-panel-heading">{title}</h2><Link className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-bold text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-700/25" href={closeHref}>Close</Link></header><div className="p-5 sm:p-6">{children}</div></aside></div>;
}
