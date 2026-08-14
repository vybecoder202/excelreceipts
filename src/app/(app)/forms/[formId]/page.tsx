import { randomUUID } from "node:crypto";

import { ArrowLeft, Braces, CheckCircle2, Database } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { RecordEditor } from "@/components/data-workspace/record-editor";
import { materializeDataRecords } from "@/features/data-workspace/materialize";
import { getApplicationAccess } from "@/lib/auth/access";
import { getDataWorkspace } from "@/server/data-workspace";

export default async function FormPreviewPage({ params, searchParams }: { params: Promise<{ formId: string }>; searchParams: Promise<{ submitted?: string }> }) {
  const access = await getApplicationAccess();
  const project = access.mode === "authenticated" ? access.project : null;
  if (!project) notFound();
  const { formId } = await params;
  const { submitted } = await searchParams;
  const workspace = await getDataWorkspace(project.id);
  const form = workspace.forms.find((item) => item.id === formId);
  if (!form) notFound();
  const table = workspace.tables.find((item) => item.id === form.table_id);
  if (!table) notFound();
  const formFieldIds = workspace.formFields.filter((item) => item.form_id === form.id && !item.is_hidden).sort((left, right) => left.position - right.position).map((item) => item.field_id);
  const fields = workspace.fields.filter((field) => field.table_id === table.id);
  const allRecords = materializeDataRecords(workspace.fields, workspace.records, workspace.cells, workspace.links);

  return <div className="min-h-[calc(100dvh-7rem)] bg-violet-50/60 px-4 py-6 sm:px-6 lg:py-10"><div className="mx-auto max-w-2xl"><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><Link className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-bold text-violet-900 hover:bg-white" href="/forms"><ArrowLeft className="size-4" />All forms</Link><Link className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-bold text-slate-600 hover:bg-white" href={`/data/${table.id}`}><Database className="size-4" />Open {table.name}</Link></div>
    {submitted ? <div className="mb-4 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-900" role="status"><CheckCircle2 className="mt-0.5 size-5 shrink-0" /><div><p className="font-bold">Response saved</p><p className="mt-1 text-sm">A new record is now visible in {table.name}. You can submit another response below.</p></div></div> : null}
    <main className="overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-lg shadow-violet-900/5"><header className="border-t-8 border-violet-700 px-5 pb-5 pt-6 sm:px-8"><span className="grid size-11 place-items-center rounded-xl bg-violet-100 text-violet-800"><Braces className="size-5" /></span><h1 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-950">{form.name}</h1><p className="mt-2 text-sm leading-6 text-slate-600">{form.description || `Add a new record to ${table.name}.`}</p><p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Destination: {table.name}</p></header><div className="border-t border-slate-200 p-5 sm:p-8"><RecordEditor allRecords={allRecords} fields={fields} formId={form.id} idempotencyKey={randomUUID()} projectId={project.id} submitLabel={form.submit_label} tableId={table.id} visibleFieldIds={formFieldIds} /></div></main>
  </div></div>;
}
