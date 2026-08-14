import { randomUUID } from "node:crypto";

import { Boxes, CircleAlert, MapPinned, PackageOpen, Scale, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

import { MaterialForm, StockLocationForm } from "@/components/records/inventory-forms";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { ProjectRequiredState, WorkspaceSuccess } from "@/components/workspaces/workspace-states";
import { getApplicationAccess } from "@/lib/auth/access";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Inventory" };

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ created?: string }> }) {
  const access = await getApplicationAccess();
  const project = access.mode === "authenticated" ? access.project : null;
  const { created } = await searchParams;
  if (!project) return <ProjectRequiredState authenticated={access.mode === "authenticated"} description="Create a project before setting up material catalogue items and physical stock locations." icon={Boxes} title="Inventory" />;

  const supabase = await createServerSupabaseClient();
  const [materialResult, locationResult, unitResult] = await Promise.all([
    supabase.from("materials").select("id, reference, name, category, unit_code, reorder_level").eq("project_id", project.id).is("archived_at", null).order("name"),
    supabase.from("stock_locations").select("id, reference, name, description").eq("project_id", project.id).is("archived_at", null).order("name"),
    supabase.from("units_of_measure").select("code, name").eq("is_active", true).order("name"),
  ]);
  const materials = materialResult.data ?? [];
  const locations = locationResult.data ?? [];
  const units = unitResult.data ?? [];
  const unitNames = new Map(units.map((unit) => [unit.code, unit.name]));
  const dataError = Boolean(materialResult.error || locationResult.error || unitResult.error);
  const canManage = ["owner", "editor"].includes(project.role);

  return (
    <div className="space-y-6 lg:space-y-8">
      {created ? <WorkspaceSuccess>{created === "material" ? "Material added to the catalogue. Its stock remains unposted." : "Stock location created and ready for the future movement ledger."}</WorkspaceSuccess> : null}
      <header><div className="flex flex-wrap items-center gap-2"><StatusPill tone="success">Catalogue setup live</StatusPill><span className="text-sm font-medium text-slate-500">{project.reference}</span></div><h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Inventory</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">Define what you will track and where it is stored. Quantities will come only from confirmed receipts, issues, transfers, returns, damage, and adjustments.</p></header>
      {dataError ? <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900" role="alert"><CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />Inventory setup data could not be loaded. Refresh before adding records.</div> : null}

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Inventory setup status">
        <InventoryMetric icon={PackageOpen} label="Materials" value={String(materials.length)} />
        <InventoryMetric icon={MapPinned} label="Stock locations" value={String(locations.length)} />
        <InventoryMetric icon={ShieldCheck} label="Posted movements" value="0" muted />
      </section>
      <Card className="flex items-start gap-3 border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950"><Scale className="mt-0.5 size-5 shrink-0" aria-hidden="true" /><div><p className="font-bold">Stock protection is active</p><p>There is deliberately no editable current-quantity field. Until goods receipts are implemented, the app shows catalogue records without inventing stock.</p></div></Card>

      {canManage ? <section className="grid items-start gap-4 xl:grid-cols-2" aria-label="Inventory setup forms">
        <Card className="overflow-hidden"><details open={materials.length === 0}><summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-extrabold text-slate-950 marker:hidden focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-blue-700/25 sm:px-6"><span><span className="block text-xs font-bold uppercase tracking-[0.16em] text-blue-800">Catalogue</span>Add material</span><span className="text-sm font-semibold text-slate-500">{materials.length} recorded</span></summary><div className="border-t border-slate-100 p-5 sm:p-6"><MaterialForm idempotencyKey={randomUUID()} projectId={project.id} units={units} /></div></details></Card>
        <Card className="overflow-hidden"><details open={locations.length === 0}><summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-extrabold text-slate-950 marker:hidden focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-blue-700/25 sm:px-6"><span><span className="block text-xs font-bold uppercase tracking-[0.16em] text-blue-800">Storage</span>Add stock location</span><span className="text-sm font-semibold text-slate-500">{locations.length} recorded</span></summary><div className="border-t border-slate-100 p-5 sm:p-6"><StockLocationForm idempotencyKey={randomUUID()} projectId={project.id} /></div></details></Card>
      </section> : null}

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="overflow-hidden"><ListHeader count={materials.length} label="Material catalogue" />{materials.length ? <ul className="divide-y divide-slate-100">{materials.map((material) => <li className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6" key={material.id}><div><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold uppercase tracking-[0.12em] text-blue-800">{material.reference}</span>{material.category ? <StatusPill>{material.category}</StatusPill> : null}</div><h3 className="mt-2 font-extrabold text-slate-950">{material.name}</h3><p className="mt-1 text-sm text-slate-500">{unitNames.get(material.unit_code) ?? material.unit_code} · reorder planning level {material.reorder_level}</p></div><div className="shrink-0 sm:text-right"><p className="text-sm font-bold text-slate-600">Stock not posted</p><p className="mt-1 text-xs text-slate-500">Awaiting goods receipts</p></div></li>)}</ul> : <EmptyInventory icon={PackageOpen} text="No materials have been added." />}</Card>
        <Card className="overflow-hidden"><ListHeader count={locations.length} label="Stock locations" />{locations.length ? <ul className="divide-y divide-slate-100">{locations.map((location) => <li className="px-5 py-4 sm:px-6" key={location.id}><span className="text-xs font-bold uppercase tracking-[0.12em] text-blue-800">{location.reference}</span><h3 className="mt-2 font-extrabold text-slate-950">{location.name}</h3>{location.description ? <p className="mt-1 text-sm leading-6 text-slate-500">{location.description}</p> : null}</li>)}</ul> : <EmptyInventory icon={MapPinned} text="No physical stock locations have been added." />}</Card>
      </div>
    </div>
  );
}

function InventoryMetric({ icon: Icon, label, value, muted = false }: { icon: typeof Boxes; label: string; value: string; muted?: boolean }) { return <Card className="flex items-center gap-4 p-4 sm:p-5"><span className={`grid size-11 place-items-center rounded-xl ${muted ? "bg-slate-100 text-slate-600" : "bg-blue-50 text-blue-800"}`}><Icon className="size-5" aria-hidden="true" /></span><div><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-1 text-xl font-extrabold tabular-nums text-slate-950">{value}</p></div></Card>; }
function ListHeader({ label, count }: { label: string; count: number }) { return <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6"><h2 className="font-extrabold text-slate-950">{label}</h2><StatusPill>{count} total</StatusPill></div>; }
function EmptyInventory({ icon: Icon, text }: { icon: typeof Boxes; text: string }) { return <div className="grid min-h-48 place-items-center p-6 text-center"><div><span className="mx-auto grid size-12 place-items-center rounded-xl bg-slate-100 text-slate-600"><Icon className="size-6" aria-hidden="true" /></span><p className="mt-3 text-sm text-slate-500">{text}</p></div></div>; }
