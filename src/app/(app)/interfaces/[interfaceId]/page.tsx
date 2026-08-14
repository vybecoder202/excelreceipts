import { ArrowLeft, Database, Hash, LayoutDashboard, List, Sigma } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { materializeDataRecords } from "@/features/data-workspace/materialize";
import type { Json } from "@/lib/supabase/database.types";
import { getApplicationAccess } from "@/lib/auth/access";
import { formatCurrency } from "@/lib/format";
import { formatMinorUnits, parseMinorUnits } from "@/lib/money";
import { getDataWorkspace } from "@/server/data-workspace";

function configValue(config: Json, key: string) { return config && !Array.isArray(config) && typeof config === "object" && typeof config[key] === "string" ? config[key] : undefined; }

export default async function InterfacePage({ params }: { params: Promise<{ interfaceId: string }> }) {
  const access = await getApplicationAccess();
  const project = access.mode === "authenticated" ? access.project : null;
  if (!project) notFound();
  const { interfaceId } = await params;
  const workspace = await getDataWorkspace(project.id);
  const selectedInterface = workspace.interfaces.find((item) => item.id === interfaceId);
  if (!selectedInterface) notFound();
  const blocks = workspace.blocks.filter((block) => block.interface_id === selectedInterface.id).sort((left, right) => left.position - right.position);
  const records = materializeDataRecords(workspace.fields, workspace.records, workspace.cells, workspace.links);
  const tableNames = new Map(workspace.tables.map((table) => [table.id, table.name]));
  const fields = new Map(workspace.fields.map((field) => [field.id, field]));

  return <div className="min-h-[calc(100dvh-7rem)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-10"><div className="mx-auto max-w-7xl"><Link className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-bold text-cyan-900 hover:bg-white" href="/interfaces"><ArrowLeft className="size-4" />All interfaces</Link><header className="mt-3 flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><span className="grid size-12 shrink-0 place-items-center rounded-xl bg-cyan-100 text-cyan-800"><LayoutDashboard className="size-6" /></span><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-800">Live interface</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">{selectedInterface.name}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{selectedInterface.description}</p></div></header>
    <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Interface metrics">{blocks.filter((block) => block.block_type !== "record_list").map((block) => {
      const tableRecords = records.filter((record) => record.table_id === block.table_id);
      let value = String(tableRecords.length);
      let detail = tableNames.get(block.table_id ?? "") ?? "Table";
      if (block.block_type === "number_summary" && block.field_id) {
        const field = fields.get(block.field_id);
        const values = tableRecords.map((record) => record.values[block.field_id ?? ""]).filter((item): item is string => typeof item === "string" && /^-?\d+(?:\.\d+)?$/.test(item));
        const operation = configValue(block.config, "operation");
        if (field?.field_type === "currency") {
          const total = values.reduce((sum, item) => sum + parseMinorUnits(item), 0n);
          value = formatCurrency(Number(formatMinorUnits(total)), project.currencyCode);
        } else {
          const numbers = values.map(Number);
          const result = operation === "average" && numbers.length ? numbers.reduce((sum, item) => sum + item, 0) / numbers.length : numbers.reduce((sum, item) => sum + item, 0);
          value = `${new Intl.NumberFormat("en-ZM", { maximumFractionDigits: 2 }).format(result)}${configValue(block.config, "suffix") ?? ""}`;
        }
        detail = `${operation ?? "summary"} of ${field?.name ?? "field"}`;
      }
      const Icon = block.block_type === "record_count" ? Hash : Sigma;
      return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={block.id}><div className="flex items-start justify-between"><div><p className="text-sm font-bold text-slate-600">{block.name}</p><p className="mt-2 text-2xl font-extrabold tabular-nums text-slate-950">{value}</p></div><span className="grid size-10 place-items-center rounded-xl bg-cyan-50 text-cyan-800"><Icon className="size-5" /></span></div><p className="mt-3 text-xs font-semibold text-slate-400">{detail}</p></article>;
    })}</section>
    <section className="mt-5 grid gap-5 xl:grid-cols-2">{blocks.filter((block) => block.block_type === "record_list").map((block) => { const tableRecords = records.filter((record) => record.table_id === block.table_id).slice(-6).reverse(); return <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" key={block.id}><header className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><h2 className="font-extrabold text-slate-950">{block.name}</h2><p className="mt-1 text-xs font-semibold text-slate-500">{tableNames.get(block.table_id ?? "")}</p></div>{block.table_id ? <Link aria-label={`Open ${tableNames.get(block.table_id)}`} className="grid size-11 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-cyan-800" href={`/data/${block.table_id}`}><Database className="size-5" /></Link> : null}</header>{tableRecords.length ? <ul className="divide-y divide-slate-100">{tableRecords.map((record) => <li className="flex items-center gap-3 px-5 py-3" key={record.id}><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500"><List className="size-4" /></span><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900">{record.label}</p><p className="mt-0.5 text-xs text-slate-400">Record #{record.record_number}</p></div></li>)}</ul> : <p className="p-8 text-center text-sm text-slate-500">No records yet. Add them in Data or Forms.</p>}</article>; })}</section>
  </div></div>;
}
