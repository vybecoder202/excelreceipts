import { randomUUID } from "node:crypto";

import { ArrowRight, Braces, Plus, Table2 } from "lucide-react";
import Link from "next/link";

import { FormDefinitionForm } from "@/components/data-workspace/builder-forms";
import { ProjectRequiredState } from "@/components/workspaces/workspace-states";
import { getApplicationAccess } from "@/lib/auth/access";
import { getDataWorkspace } from "@/server/data-workspace";

export default async function FormsPage({ searchParams }: { searchParams: Promise<{ panel?: string }> }) {
  const access = await getApplicationAccess();
  const project = access.mode === "authenticated" ? access.project : null;
  if (!project) return <ProjectRequiredState authenticated={access.mode === "authenticated"} description="Create a project before building forms." icon={Braces} title="Forms" />;
  const workspace = await getDataWorkspace(project.id);
  const { panel } = await searchParams;
  const tableNames = new Map(workspace.tables.map((table) => [table.id, table.name]));

  return <div className="min-h-[calc(100dvh-7rem)] bg-slate-50 px-4 py-7 sm:px-6 lg:px-10"><div className="mx-auto max-w-6xl"><header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-800">Data collection</p><h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-950">Forms</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Create focused entry screens for any table. Each submission becomes a normal record and follows the table’s required fields and linked-record rules.</p></div>{workspace.tables.length ? <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-violet-700 px-4 text-sm font-bold text-white hover:bg-violet-800 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-violet-700/25" href="/forms?panel=create"><Plus className="size-4" />Create form</Link> : null}</header>
    {!workspace.tables.length ? <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><Table2 className="mx-auto size-8 text-slate-400" /><h2 className="mt-3 text-lg font-extrabold text-slate-900">Build a table first</h2><p className="mt-1 text-sm text-slate-600">Forms need a destination table for their submissions.</p><Link className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-bold text-white" href="/data">Open Data<ArrowRight className="size-4" /></Link></div> : null}
    {workspace.forms.length ? <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{workspace.forms.map((form) => <Link className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-[border-color,box-shadow] hover:border-violet-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-violet-700/25" href={`/forms/${form.id}`} key={form.id}><div className="flex items-start justify-between gap-3"><span className="grid size-11 place-items-center rounded-xl bg-violet-100 text-violet-800"><Braces className="size-5" /></span><span className="rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-800">{form.status}</span></div><h2 className="mt-5 text-lg font-extrabold text-slate-950 group-hover:text-violet-800">{form.name}</h2><p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Writes to {tableNames.get(form.table_id) ?? "Table"}</p><p className="mt-3 line-clamp-2 min-h-12 text-sm leading-6 text-slate-600">{form.description || "No form instructions yet."}</p><span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-violet-800">Open form<ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span></Link>)}</div> : workspace.tables.length ? <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><Braces className="mx-auto size-9 text-slate-400" /><h2 className="mt-4 text-lg font-extrabold text-slate-900">No forms yet</h2><p className="mt-1 text-sm text-slate-600">Create a form from one of your tables.</p></div> : null}</div>
    {panel === "create" ? <Panel closeHref="/forms" title="Create form"><FormDefinitionForm idempotencyKey={randomUUID()} projectId={project.id} tables={workspace.tables} /></Panel> : null}
  </div>;
}

function Panel({ closeHref, title, children }: { closeHref: string; title: string; children: React.ReactNode }) { return <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="form-panel-title"><Link aria-label="Close panel" className="absolute inset-0 bg-slate-950/45" href={closeHref} /><aside className="absolute inset-y-0 right-0 w-full max-w-md overflow-y-auto bg-white shadow-2xl"><header className="flex min-h-16 items-center justify-between border-b border-slate-200 px-5"><h2 className="font-extrabold" id="form-panel-title">{title}</h2><Link className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-bold text-slate-600 hover:bg-slate-100" href={closeHref}>Close</Link></header><div className="p-5 sm:p-6">{children}</div></aside></div>; }
