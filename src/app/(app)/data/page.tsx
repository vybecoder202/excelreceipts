import { randomUUID } from "node:crypto";

import { ArrowRight, Blocks, Plus, Table2, WandSparkles } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { installConstructionWorkspaceAction } from "@/app/actions/data-workspace";
import { TableDefinitionForm } from "@/components/data-workspace/builder-forms";
import { ProjectRequiredState } from "@/components/workspaces/workspace-states";
import { getApplicationAccess } from "@/lib/auth/access";
import { getDataWorkspace } from "@/server/data-workspace";

export default async function DataHomePage({ searchParams }: { searchParams: Promise<{ panel?: string; error?: string }> }) {
  const access = await getApplicationAccess();
  const project = access.mode === "authenticated" ? access.project : null;
  if (!project) return <ProjectRequiredState authenticated={access.mode === "authenticated"} description="Create a project first. It will become the base that owns your configurable tables, forms, and interfaces." icon={Blocks} title="Data" />;
  const workspace = await getDataWorkspace(project.id);
  const firstTable = workspace.tables[0];
  if (firstTable) redirect(`/data/${firstTable.id}`);
  const { panel, error } = await searchParams;

  return <div className="min-h-[calc(100dvh-7rem)] bg-slate-50 px-4 py-8 sm:px-6 lg:px-10">
    <div className="mx-auto max-w-5xl">
      <div className="flex items-start gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-xl bg-blue-700 text-white shadow-sm"><Blocks className="size-6" aria-hidden="true" /></span><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-800">Workspace builder</p><h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-950">Start with a solution or a blank table</h1><p className="mt-2 max-w-3xl text-base leading-7 text-slate-600">Data is the source of truth. Interfaces and Forms will read and write the same records, including linked-record relationships.</p></div></div>
      {error ? <p className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900" role="alert">The starter could not be installed. The workspace may no longer be empty; refresh and create a blank table instead.</p> : null}
      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <article className="relative overflow-hidden rounded-2xl border border-blue-200 bg-white p-6 shadow-sm"><span className="absolute right-0 top-0 h-32 w-32 -translate-y-10 translate-x-10 rounded-full bg-blue-100" aria-hidden="true" /><span className="relative grid size-11 place-items-center rounded-xl bg-blue-100 text-blue-800"><WandSparkles className="size-5" /></span><h2 className="relative mt-5 text-xl font-extrabold text-slate-950">Construction starter</h2><p className="relative mt-2 min-h-20 text-sm leading-6 text-slate-600">Install connected tables for phases, tasks, suppliers, expenses, materials, workers, attendance, and daily site logs. Nothing is locked—you can add your own fields and relationships.</p><form action={installConstructionWorkspaceAction} className="relative mt-5"><input name="projectId" type="hidden" value={project.id} /><input name="idempotencyKey" type="hidden" value={randomUUID()} /><button className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-bold text-white hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-700/25" type="submit">Install construction starter<ArrowRight className="size-4" aria-hidden="true" /></button></form></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><span className="grid size-11 place-items-center rounded-xl bg-slate-100 text-slate-700"><Table2 className="size-5" /></span><h2 className="mt-5 text-xl font-extrabold text-slate-950">Blank table</h2><p className="mt-2 min-h-20 text-sm leading-6 text-slate-600">Start with one primary text field, then add numbers, dates, choices, formulas, lookups, and links to other tables as your system takes shape.</p><Link className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-700/25" href="/data?panel=table"><Plus className="size-4" aria-hidden="true" />Create blank table</Link></article>
      </div>
    </div>
    {panel === "table" ? <EmptyWorkspacePanel closeHref="/data" title="Create a blank table"><TableDefinitionForm idempotencyKey={randomUUID()} projectId={project.id} /></EmptyWorkspacePanel> : null}
  </div>;
}

function EmptyWorkspacePanel({ title, closeHref, children }: { title: string; closeHref: string; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="workspace-panel-title"><Link aria-label="Close panel" className="absolute inset-0 bg-slate-950/45" href={closeHref} /><aside className="absolute inset-y-0 right-0 w-full max-w-md overflow-y-auto bg-white shadow-2xl"><div className="flex min-h-16 items-center justify-between border-b border-slate-200 px-5"><h2 className="font-extrabold text-slate-950" id="workspace-panel-title">{title}</h2><Link className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-bold text-slate-600 hover:bg-slate-100" href={closeHref}>Close</Link></div><div className="p-5 sm:p-6">{children}</div></aside></div>;
}
