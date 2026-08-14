import { randomUUID } from "node:crypto";

import { Building2, CircleAlert, PackageCheck, Phone, ShoppingCart, Truck } from "lucide-react";
import type { Metadata } from "next";

import { SupplierForm } from "@/components/records/supplier-form";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { ProjectRequiredState, WorkspaceSuccess } from "@/components/workspaces/workspace-states";
import { getApplicationAccess } from "@/lib/auth/access";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Procurement" };

export default async function ProcurementPage({ searchParams }: { searchParams: Promise<{ created?: string }> }) {
  const access = await getApplicationAccess();
  const project = access.mode === "authenticated" ? access.project : null;
  const { created } = await searchParams;
  if (!project) return <ProjectRequiredState authenticated={access.mode === "authenticated"} description="Create a project before building the supplier directory and later purchase workflows." icon={PackageCheck} title="Procurement" />;

  const supabase = await createServerSupabaseClient();
  const [{ data: suppliers, error }, { data: expenseLinks }] = await Promise.all([
    supabase.from("suppliers").select("id, reference, name, contact_name, phone, email, status").eq("project_id", project.id).is("archived_at", null).order("name"),
    supabase.from("expenses").select("supplier_id").eq("project_id", project.id).eq("status", "posted"),
  ]);
  const rows = suppliers ?? [];
  const linkedExpenseCounts = new Map<string, number>();
  for (const expense of expenseLinks ?? []) {
    if (expense.supplier_id) linkedExpenseCounts.set(expense.supplier_id, (linkedExpenseCounts.get(expense.supplier_id) ?? 0) + 1);
  }
  const canManage = ["owner", "editor"].includes(project.role);

  return (
    <div className="space-y-6 lg:space-y-8">
      {created ? <WorkspaceSuccess>Supplier created with a project reference and audit event.</WorkspaceSuccess> : null}
      <header><div className="flex flex-wrap items-center gap-2"><StatusPill tone="success">Supplier directory live</StatusPill><span className="text-sm font-medium text-slate-500">{project.reference}</span></div><h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Procurement</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">Create the supplier directory now. Quotations, purchase orders, partial deliveries, and goods receipts will build on these authorized records.</p></header>
      {error ? <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900" role="alert"><CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />Supplier records could not be loaded. Refresh before adding another.</div> : null}

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Procurement readiness">
        <StageCard icon={Building2} label="Suppliers" status={`${rows.length} recorded`} ready />
        <StageCard icon={ShoppingCart} label="Purchase orders" status="Next implementation" />
        <StageCard icon={Truck} label="Goods receipts" status="Follows purchase orders" />
      </section>

      <div className="grid items-start gap-4 xl:grid-cols-[0.72fr_1.28fr]">
        {canManage ? <Card className="overflow-hidden" id="new-supplier"><div className="border-b border-slate-100 px-5 py-4 sm:px-6"><p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-800">Directory</p><h2 className="mt-1 text-lg font-extrabold text-slate-950">Add supplier</h2><p className="mt-1 text-sm leading-6 text-slate-500">Contact fields are optional and can be completed from a quotation later.</p></div><div className="p-5 sm:p-6"><SupplierForm idempotencyKey={randomUUID()} projectId={project.id} /></div></Card> : null}
        <Card className="overflow-hidden"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6"><div><h2 className="font-extrabold text-slate-950">Suppliers</h2><p className="mt-1 text-sm text-slate-500">Project-scoped directory</p></div><StatusPill>{rows.length} total</StatusPill></div>
          {rows.length ? <ul className="divide-y divide-slate-100">{rows.map((supplier) => <li className="px-5 py-4 sm:px-6" key={supplier.id}><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold uppercase tracking-[0.12em] text-blue-800">{supplier.reference}</span><StatusPill tone="success">{supplier.status}</StatusPill></div><h3 className="mt-2 font-extrabold text-slate-950">{supplier.name}</h3><p className="mt-1 text-sm text-slate-500">{supplier.contact_name || "No contact named"}</p>{supplier.phone || supplier.email ? <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">{supplier.phone ? <span className="inline-flex items-center gap-1"><Phone className="size-3.5" aria-hidden="true" />{supplier.phone}</span> : null}{supplier.email ? <span>{supplier.email}</span> : null}</p> : null}</div><div className="shrink-0 text-sm sm:text-right"><p className="font-bold tabular-nums text-slate-800">{linkedExpenseCounts.get(supplier.id) ?? 0} linked expenses</p><p className="mt-1 text-xs text-slate-500">POs not available yet</p></div></div></li>)}</ul> : <div className="grid min-h-72 place-items-center p-6 text-center"><div><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-600"><Building2 className="size-7" aria-hidden="true" /></span><h3 className="mt-4 font-extrabold text-slate-900">No suppliers yet</h3><p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">Add the first supplier to make it available on expense and future purchasing forms.</p></div></div>}
        </Card>
      </div>
    </div>
  );
}

function StageCard({ icon: Icon, label, status, ready = false }: { icon: typeof Building2; label: string; status: string; ready?: boolean }) {
  return <Card className="flex items-center gap-4 p-4 sm:p-5"><span className={`grid size-11 shrink-0 place-items-center rounded-xl ${ready ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}><Icon className="size-5" aria-hidden="true" /></span><div><p className="font-extrabold text-slate-950">{label}</p><p className="mt-1 text-xs font-semibold text-slate-500">{status}</p></div></Card>;
}
