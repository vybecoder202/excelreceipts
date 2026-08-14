import { randomUUID } from "node:crypto";

import { CalendarCheck2, CircleAlert, Clock3, ShieldAlert, UserRoundCheck, UsersRound } from "lucide-react";
import type { Metadata } from "next";

import { AttendanceForm, WorkerForm } from "@/components/records/workforce-forms";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { ProjectRequiredState, WorkspaceSuccess } from "@/components/workspaces/workspace-states";
import { getApplicationAccess } from "@/lib/auth/access";
import { dateInputValue, formatProjectDate, humanizeStatus } from "@/lib/format";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Workforce" };

export default async function WorkforcePage({ searchParams }: { searchParams: Promise<{ created?: string }> }) {
  const access = await getApplicationAccess();
  const project = access.mode === "authenticated" ? access.project : null;
  const { created } = await searchParams;
  if (!project) return <ProjectRequiredState authenticated={access.mode === "authenticated"} description="Create a project before adding workers and attendance records." icon={UsersRound} title="Workforce" />;

  const supabase = await createServerSupabaseClient();
  const [summaryResult, workerResult, attendanceResult] = await Promise.all([
    supabase.from("project_workforce_summary").select("*").eq("project_id", project.id).maybeSingle(),
    supabase.from("workers").select("id, reference, full_name, trade, phone, status").eq("project_id", project.id).is("archived_at", null).order("full_name"),
    supabase.from("attendance_records").select("id, worker_id, attendance_date, attendance_status, notes").eq("project_id", project.id).order("attendance_date", { ascending: false }).limit(20),
  ]);
  const workers = workerResult.data ?? [];
  const attendance = attendanceResult.data ?? [];
  const summary = summaryResult.data;
  const workerNames = new Map(workers.map((worker) => [worker.id, worker.full_name]));
  const dataError = Boolean(summaryResult.error || workerResult.error || attendanceResult.error);
  const canManage = ["owner", "editor"].includes(project.role);
  const today = dateInputValue(project.timezone);

  return (
    <div className="space-y-6 lg:space-y-8">
      {created ? <WorkspaceSuccess>{created === "attendance" ? "Attendance recorded as a project-management record." : "Worker added to the active project list."}</WorkspaceSuccess> : null}
      <header><div className="flex flex-wrap items-center gap-2"><StatusPill tone="success">Worker records live</StatusPill><span className="text-sm font-medium text-slate-500">No wage calculations</span></div><h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Workforce</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">Keep a practical list of workers and daily attendance. These records do not calculate wages, payroll, tax, or legal employment status.</p></header>
      {dataError ? <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900" role="alert"><CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />Workforce data could not be loaded. Refresh before adding records.</div> : null}

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Workforce summary">
        <WorkforceMetric icon={UsersRound} label="Active workers" value={String(summary?.active_worker_count ?? 0)} />
        <WorkforceMetric icon={UserRoundCheck} label="Recorded today" value={String(summary?.workers_recorded_today ?? 0)} />
        <WorkforceMetric icon={Clock3} label="Recent attendance" value={String(attendance.length)} />
      </section>
      <Card className="flex items-start gap-3 border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" /><div><p className="font-bold">Project records, not payroll</p><p>Attendance is informational. Have any employment, wage, or statutory records reviewed through the appropriate Zambian professional process.</p></div></Card>

      {canManage ? <section className="grid items-start gap-4 xl:grid-cols-2" aria-label="Workforce data entry">
        <Card className="overflow-hidden"><details open={workers.length === 0}><summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-extrabold text-slate-950 marker:hidden focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-blue-700/25 sm:px-6"><span><span className="block text-xs font-bold uppercase tracking-[0.16em] text-blue-800">People</span>Add worker</span><span className="text-sm font-semibold text-slate-500">{workers.length} recorded</span></summary><div className="border-t border-slate-100 p-5 sm:p-6"><WorkerForm idempotencyKey={randomUUID()} projectId={project.id} /></div></details></Card>
        <Card className="overflow-hidden"><details open={workers.length > 0 && attendance.length === 0}><summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-extrabold text-slate-950 marker:hidden focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-blue-700/25 sm:px-6"><span><span className="block text-xs font-bold uppercase tracking-[0.16em] text-blue-800">Daily record</span>Record attendance</span><span className="text-sm font-semibold text-slate-500">{attendance.length} recent</span></summary><div className="border-t border-slate-100 p-5 sm:p-6">{workers.length ? <AttendanceForm defaultDate={today} idempotencyKey={randomUUID()} projectId={project.id} workers={workers.map((worker) => ({ id: worker.id, fullName: worker.full_name }))} /> : <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">Add a worker before recording attendance.</p>}</div></details></Card>
      </section> : null}

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="overflow-hidden"><ListHeader count={workers.length} label="Workers" />{workers.length ? <ul className="divide-y divide-slate-100">{workers.map((worker) => <li className="px-5 py-4 sm:px-6" key={worker.id}><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold uppercase tracking-[0.12em] text-blue-800">{worker.reference}</span><StatusPill tone="success">{worker.status}</StatusPill></div><h3 className="mt-2 font-extrabold text-slate-950">{worker.full_name}</h3><p className="mt-1 text-sm text-slate-500">{worker.trade || "Trade not recorded"}</p></div>{worker.phone ? <p className="text-sm font-semibold text-slate-600">{worker.phone}</p> : null}</div></li>)}</ul> : <EmptyWorkforce icon={UsersRound} text="No workers have been added." />}</Card>
        <Card className="overflow-hidden"><ListHeader count={attendance.length} label="Recent attendance" />{attendance.length ? <ul className="divide-y divide-slate-100">{attendance.map((record) => <li className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6" key={record.id}><div><h3 className="font-extrabold text-slate-950">{workerNames.get(record.worker_id) ?? "Worker"}</h3><p className="mt-1 text-sm text-slate-500">{formatProjectDate(record.attendance_date)}{record.notes ? ` · ${record.notes}` : ""}</p></div><StatusPill tone={record.attendance_status === "absent" ? "warning" : "success"}>{humanizeStatus(record.attendance_status)}</StatusPill></li>)}</ul> : <EmptyWorkforce icon={CalendarCheck2} text="No attendance has been recorded." />}</Card>
      </div>
    </div>
  );
}

function WorkforceMetric({ icon: Icon, label, value }: { icon: typeof UsersRound; label: string; value: string }) { return <Card className="flex items-center gap-4 p-4 sm:p-5"><span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-blue-800"><Icon className="size-5" aria-hidden="true" /></span><div><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-1 text-xl font-extrabold tabular-nums text-slate-950">{value}</p></div></Card>; }
function ListHeader({ label, count }: { label: string; count: number }) { return <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6"><h2 className="font-extrabold text-slate-950">{label}</h2><StatusPill>{count} shown</StatusPill></div>; }
function EmptyWorkforce({ icon: Icon, text }: { icon: typeof UsersRound; text: string }) { return <div className="grid min-h-48 place-items-center p-6 text-center"><div><span className="mx-auto grid size-12 place-items-center rounded-xl bg-slate-100 text-slate-600"><Icon className="size-6" aria-hidden="true" /></span><p className="mt-3 text-sm text-slate-500">{text}</p></div></div>; }
