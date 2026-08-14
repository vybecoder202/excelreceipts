import { randomUUID } from "node:crypto";

import { ArrowRight, BanknoteArrowDown, CircleAlert, CircleDollarSign, Landmark, ReceiptText, WalletCards } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { BudgetItemForm, ExpenseForm } from "@/components/records/finance-forms";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { ProjectRequiredState, WorkspaceSuccess } from "@/components/workspaces/workspace-states";
import { getApplicationAccess } from "@/lib/auth/access";
import { dateInputValue, formatCurrency, formatProjectDate } from "@/lib/format";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Finances" };

export default async function FinancesPage({ searchParams }: { searchParams: Promise<{ created?: string }> }) {
  const access = await getApplicationAccess();
  const project = access.mode === "authenticated" ? access.project : null;
  const { created } = await searchParams;
  if (!project) {
    return <ProjectRequiredState authenticated={access.mode === "authenticated"} description="Create or connect a project before entering budgets and direct expenses." icon={WalletCards} title="Finances" />;
  }

  const supabase = await createServerSupabaseClient();
  const [summaryResult, categoryResult, budgetResult, expenseResult, supplierResult, phaseResult] = await Promise.all([
    supabase.from("project_financial_summary").select("*").eq("project_id", project.id).maybeSingle(),
    supabase.from("budget_categories").select("id, name").eq("project_id", project.id).is("archived_at", null).order("name"),
    supabase.from("budget_lines").select("id, reference, category_id, phase_id, description, approved_amount, forecast_amount").eq("project_id", project.id).is("archived_at", null).order("created_at", { ascending: false }),
    supabase.from("expenses").select("id, reference, expense_date, description, amount, payment_status, supplier_id").eq("project_id", project.id).order("expense_date", { ascending: false }).limit(12),
    supabase.from("suppliers").select("id, name").eq("project_id", project.id).is("archived_at", null).order("name"),
    supabase.from("phases").select("id, name").eq("project_id", project.id).is("archived_at", null).order("sort_order"),
  ]);

  const dataError = [summaryResult, categoryResult, budgetResult, expenseResult, supplierResult, phaseResult].some((result) => result.error);
  const summary = summaryResult.data;
  const categories = categoryResult.data ?? [];
  const budgetLines = budgetResult.data ?? [];
  const expenses = expenseResult.data ?? [];
  const suppliers = supplierResult.data ?? [];
  const phases = phaseResult.data ?? [];
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
  const supplierNames = new Map(suppliers.map((supplier) => [supplier.id, supplier.name]));
  const canManage = ["owner", "editor"].includes(project.role);
  const today = dateInputValue(project.timezone);

  return (
    <div className="space-y-6 lg:space-y-8">
      {created ? <WorkspaceSuccess>{created === "expense" ? "Expense posted. Actual cost and remaining budget have been recalculated." : "Budget item added. The approved and forecast totals are now live."}</WorkspaceSuccess> : null}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2"><StatusPill tone="success">Live project data</StatusPill><span className="text-sm font-medium text-slate-500">{project.currencyCode} · {project.reference}</span></div>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Finances</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">Start with a budget, then post direct project expenses. Commitments and payments stay separate until their controlled workflows are added.</p>
        </div>
        <Link className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-700/25 sm:self-auto" href="/procurement">Manage suppliers<ArrowRight className="size-4" aria-hidden="true" /></Link>
      </header>

      {dataError ? <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900" role="alert"><CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" /><span>Some financial data could not be loaded. Refresh before entering another record.</span></div> : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Financial position">
        <FinancialMetric detail="Current approved budget" icon={Landmark} label="Approved budget" value={formatCurrency(summary?.approved_budget, project.currencyCode)} />
        <FinancialMetric detail="Purchase commitments not implemented yet" icon={WalletCards} label="Committed cost" muted={!summary?.committed_cost} value={formatCurrency(summary?.committed_cost, project.currencyCode)} />
        <FinancialMetric detail="Posted direct expenses" icon={CircleDollarSign} label="Actual cost" value={formatCurrency(summary?.actual_cost, project.currencyCode)} />
        <FinancialMetric detail="Cash payments not implemented yet" icon={BanknoteArrowDown} label="Payments made" muted={!summary?.payments_made} value={formatCurrency(summary?.payments_made, project.currencyCode)} />
      </section>

      <Card className="grid gap-5 p-5 sm:grid-cols-3 sm:p-6">
        <PositionLine label="Remaining budget" value={formatCurrency(summary?.remaining_budget, project.currencyCode)} />
        <PositionLine label="Forecast final cost" value={formatCurrency(summary?.forecast_final_cost, project.currencyCode)} />
        <PositionLine label="Unpaid posted expenses" value={String(summary?.unpaid_expense_count ?? 0)} />
      </Card>

      {canManage ? (
        <section className="grid items-start gap-4 xl:grid-cols-2" aria-label="Financial data entry">
          <Card className="overflow-hidden">
            <details open={budgetLines.length === 0}>
              <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-extrabold text-slate-950 marker:hidden focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-blue-700/25 sm:px-6"><span><span className="block text-xs font-bold uppercase tracking-[0.16em] text-blue-800">Plan</span>Add budget item</span><span className="text-sm font-semibold text-slate-500">{budgetLines.length} recorded</span></summary>
              <div className="border-t border-slate-100 p-5 sm:p-6"><BudgetItemForm idempotencyKey={randomUUID()} phases={phases} projectId={project.id} /></div>
            </details>
          </Card>
          <Card className="overflow-hidden" id="new-expense">
            <details open={budgetLines.length > 0 && expenses.length === 0}>
              <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-extrabold text-slate-950 marker:hidden focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-blue-700/25 sm:px-6"><span><span className="block text-xs font-bold uppercase tracking-[0.16em] text-blue-800">Actual cost</span>Post direct expense</span><span className="text-sm font-semibold text-slate-500">{expenses.length} recent</span></summary>
              <div className="border-t border-slate-100 p-5 sm:p-6">
                {categories.length > 0 ? <ExpenseForm categories={categories} defaultDate={today} idempotencyKey={randomUUID()} phases={phases} projectId={project.id} suppliers={suppliers} /> : <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">Add at least one budget item first so this expense has a reporting category.</p>}
              </div>
            </details>
          </Card>
        </section>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="overflow-hidden">
          <ListHeader count={budgetLines.length} label="Budget items" />
          {budgetLines.length ? <ul className="divide-y divide-slate-100">{budgetLines.map((line) => <li className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6" key={line.id}><div><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold uppercase tracking-[0.12em] text-blue-800">{line.reference}</span><StatusPill>{categoryNames.get(line.category_id) ?? "Category"}</StatusPill></div><p className="mt-2 font-bold text-slate-950">{line.description}</p><p className="mt-1 text-xs text-slate-500">Forecast {formatCurrency(line.forecast_amount, project.currencyCode)}</p></div><p className="shrink-0 font-extrabold tabular-nums text-slate-950">{formatCurrency(line.approved_amount, project.currencyCode)}</p></li>)}</ul> : <EmptyList icon={Landmark} text="No budget items yet. Open Add budget item to create the first one." />}
        </Card>
        <Card className="overflow-hidden">
          <ListHeader count={expenses.length} label="Recent expenses" />
          {expenses.length ? <ul className="divide-y divide-slate-100">{expenses.map((expense) => <li className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6" key={expense.id}><div><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold uppercase tracking-[0.12em] text-blue-800">{expense.reference}</span><StatusPill tone="warning">{expense.payment_status}</StatusPill></div><p className="mt-2 font-bold text-slate-950">{expense.description}</p><p className="mt-1 text-xs text-slate-500">{formatProjectDate(expense.expense_date)}{expense.supplier_id ? ` · ${supplierNames.get(expense.supplier_id) ?? "Supplier"}` : ""}</p></div><p className="shrink-0 font-extrabold tabular-nums text-slate-950">{formatCurrency(expense.amount, project.currencyCode)}</p></li>)}</ul> : <EmptyList icon={ReceiptText} text="No direct expenses have been posted." />}
        </Card>
      </div>
    </div>
  );
}

function FinancialMetric({ label, value, detail, icon: Icon, muted = false }: { label: string; value: string; detail: string; icon: typeof Landmark; muted?: boolean }) {
  return <Card className="p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-slate-600">{label}</p><p className={`mt-2 text-xl font-extrabold tabular-nums tracking-tight sm:text-2xl ${muted ? "text-slate-500" : "text-slate-950"}`}>{value}</p></div><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-800"><Icon className="size-5" aria-hidden="true" /></span></div><p className="mt-3 text-xs font-medium leading-5 text-slate-500">{detail}</p></Card>;
}

function PositionLine({ label, value }: { label: string; value: string }) { return <div><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-1 text-lg font-extrabold tabular-nums text-slate-950">{value}</p></div>; }
function ListHeader({ label, count }: { label: string; count: number }) { return <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6"><h2 className="font-extrabold text-slate-950">{label}</h2><StatusPill>{count} total</StatusPill></div>; }
function EmptyList({ icon: Icon, text }: { icon: typeof Landmark; text: string }) { return <div className="grid min-h-48 place-items-center px-5 py-8 text-center"><div><span className="mx-auto grid size-12 place-items-center rounded-xl bg-slate-100 text-slate-600"><Icon className="size-6" aria-hidden="true" /></span><p className="mt-3 max-w-sm text-sm leading-6 text-slate-500">{text}</p></div></div>; }
