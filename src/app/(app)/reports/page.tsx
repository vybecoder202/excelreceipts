import { ClipboardList, FileSpreadsheet, Landmark, ReceiptText, TrendingUp, UsersRound } from "lucide-react";
import type { Metadata } from "next";

import { PrintReportButton } from "@/components/reports/print-report-button";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { ProjectRequiredState } from "@/components/workspaces/workspace-states";
import { getApplicationAccess } from "@/lib/auth/access";
import { formatCurrency } from "@/lib/format";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  const access = await getApplicationAccess();
  const project = access.mode === "authenticated" ? access.project : null;
  if (!project) return <ProjectRequiredState authenticated={access.mode === "authenticated"} description="Create a project before opening its deterministic report snapshot." icon={ReceiptText} title="Reports" />;
  const supabase = await createServerSupabaseClient();
  const [financialResult, progressResult, workforceResult, expenseResult, logResult] = await Promise.all([
    supabase.from("project_financial_summary").select("*").eq("project_id", project.id).maybeSingle(),
    supabase.from("project_progress_summary").select("*").eq("project_id", project.id).maybeSingle(),
    supabase.from("project_workforce_summary").select("*").eq("project_id", project.id).maybeSingle(),
    supabase.from("expenses").select("id", { count: "exact", head: true }).eq("project_id", project.id).eq("status", "posted"),
    supabase.from("daily_site_logs").select("id", { count: "exact", head: true }).eq("project_id", project.id),
  ]);
  const financial = financialResult.data;
  const progress = progressResult.data;
  const workforce = workforceResult.data;
  const hasError = Boolean(financialResult.error || progressResult.error || workforceResult.error || expenseResult.error || logResult.error);

  return (
    <div className="space-y-6 lg:space-y-8 print:bg-white">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><StatusPill tone="success">Live snapshot</StatusPill><span className="text-sm font-medium text-slate-500">{project.reference}</span></div><h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Reports</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">Review a deterministic project snapshot from the records currently implemented. PDF, XLSX, and filter-aware exports come in the reporting phase.</p></div><div className="print:hidden"><PrintReportButton /></div></header>
      {hasError ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900" role="alert">Some report values could not be loaded. Refresh before relying on this snapshot.</div> : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Report summary">
        <ReportMetric icon={Landmark} label="Approved budget" value={formatCurrency(financial?.approved_budget, project.currencyCode)} />
        <ReportMetric icon={ReceiptText} label="Actual cost" value={formatCurrency(financial?.actual_cost, project.currencyCode)} />
        <ReportMetric icon={TrendingUp} label="Project progress" value={`${progress?.percent_complete ?? 0}%`} />
        <ReportMetric icon={UsersRound} label="Active workers" value={String(workforce?.active_worker_count ?? 0)} />
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="overflow-hidden"><ReportHeader icon={Landmark} title="Budget versus actual" /><dl className="divide-y divide-slate-100"><ReportLine label="Original budget" value={formatCurrency(financial?.original_budget, project.currencyCode)} /><ReportLine label="Current approved budget" value={formatCurrency(financial?.approved_budget, project.currencyCode)} /><ReportLine label="Committed cost" value={formatCurrency(financial?.committed_cost, project.currencyCode)} note="Purchase orders not implemented" /><ReportLine label="Actual cost" value={formatCurrency(financial?.actual_cost, project.currencyCode)} /><ReportLine label="Payments made" value={formatCurrency(financial?.payments_made, project.currencyCode)} note="Payments not implemented" /><ReportLine label="Remaining budget" value={formatCurrency(financial?.remaining_budget, project.currencyCode)} /></dl></Card>
        <Card className="overflow-hidden"><ReportHeader icon={ClipboardList} title="Delivery and site records" /><dl className="divide-y divide-slate-100"><ReportLine label="Weighted project progress" value={`${progress?.percent_complete ?? 0}%`} /><ReportLine label="Open tasks" value={String(progress?.open_task_count ?? 0)} /><ReportLine label="Overdue tasks" value={String(progress?.overdue_task_count ?? 0)} /><ReportLine label="Daily site logs" value={String(logResult.count ?? 0)} /><ReportLine label="Posted direct expenses" value={String(expenseResult.count ?? 0)} /><ReportLine label="Workers recorded today" value={String(workforce?.workers_recorded_today ?? 0)} /></dl></Card>
      </div>

      <Card className="flex items-start gap-3 border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700"><FileSpreadsheet className="mt-0.5 size-5 shrink-0" aria-hidden="true" /><p><span className="font-bold text-slate-900">Export boundary:</span> printing this page is available for visual testing. Structured PDF, XLSX, and CSV exports will not be labelled complete until parameters, filters, audit history, and file verification are implemented.</p></Card>
    </div>
  );
}

function ReportMetric({ icon: Icon, label, value }: { icon: typeof Landmark; label: string; value: string }) { return <Card className="p-4 sm:p-5"><span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-800"><Icon className="size-5" aria-hidden="true" /></span><p className="mt-4 text-sm font-semibold text-slate-500">{label}</p><p className="mt-1 text-xl font-extrabold tabular-nums text-slate-950">{value}</p></Card>; }
function ReportHeader({ icon: Icon, title }: { icon: typeof Landmark; title: string }) { return <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6"><Icon className="size-5 text-blue-800" aria-hidden="true" /><h2 className="font-extrabold text-slate-950">{title}</h2></div>; }
function ReportLine({ label, value, note }: { label: string; value: string; note?: string }) { return <div className="flex items-start justify-between gap-4 px-5 py-3 sm:px-6"><dt><span className="text-sm font-semibold text-slate-700">{label}</span>{note ? <span className="mt-0.5 block text-xs text-slate-500">{note}</span> : null}</dt><dd className="shrink-0 text-sm font-extrabold tabular-nums text-slate-950">{value}</dd></div>; }
