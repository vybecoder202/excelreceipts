import { randomUUID } from "node:crypto";

import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  Flag,
  Layers3,
  LockKeyhole,
  NotebookPen,
  ListChecks,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PhaseSetupForm } from "@/components/phases/phase-setup-form";
import { DailyLogForm, TaskForm, TaskProgressForm } from "@/components/records/site-forms";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { getApplicationAccess } from "@/lib/auth/access";
import { dateInputValue } from "@/lib/format";
import type { Tables } from "@/lib/supabase/database.types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Site & progress" };

type PhaseRow = Tables<"phases">;
type TaskRow = Pick<Tables<"tasks">, "id" | "phase_id" | "reference" | "title" | "status" | "priority" | "percent_complete" | "planned_end">;

export default async function SiteProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const access = await getApplicationAccess();
  const project = access.mode === "authenticated" ? access.project : null;
  const { created } = await searchParams;

  if (!project) {
    return <SiteFoundationState authenticated={access.mode === "authenticated"} />;
  }

  const supabase = await createServerSupabaseClient();
  const [phaseResult, taskResult, milestoneResult, progressResult, dailyLogResult] = await Promise.all([
    supabase
      .from("phases")
      .select("*")
      .eq("project_id", project.id)
      .is("archived_at", null)
      .order("sort_order"),
    supabase
      .from("tasks")
      .select("id, phase_id, reference, title, status, priority, percent_complete, planned_end")
      .eq("project_id", project.id)
      .is("archived_at", null),
    supabase
      .from("milestones")
      .select("id, title, due_date, status")
      .eq("project_id", project.id)
      .is("archived_at", null)
      .order("due_date")
      .limit(5),
    supabase
      .from("project_progress_summary")
      .select("percent_complete, overdue_task_count, open_task_count")
      .eq("project_id", project.id)
      .maybeSingle(),
    supabase
      .from("daily_site_logs")
      .select("id, reference, log_date, work_completed, workers_present, weather_notes, delays_or_issues")
      .eq("project_id", project.id)
      .order("log_date", { ascending: false })
      .limit(8),
  ]);

  const dataError = Boolean(
    phaseResult.error || taskResult.error || milestoneResult.error || progressResult.error || dailyLogResult.error,
  );
  const phases = phaseResult.data ?? [];
  const tasks = taskResult.data ?? [];
  const milestones = milestoneResult.data ?? [];
  const progress = progressResult.data;
  const dailyLogs = dailyLogResult.data ?? [];
  const canManage = ["owner", "editor"].includes(project.role);
  const today = dateInputValue(project.timezone);

  return (
    <div className="space-y-6 lg:space-y-8">
      {created ? (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950" role="status">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-800" aria-hidden="true" />
          <div>
            <p className="font-bold">{created === "phase" ? "Phase created" : created === "task" ? "Task created" : created === "progress" ? "Task progress updated" : "Daily log saved"}</p>
            <p>{created === "progress" ? "Weighted project progress has been recalculated from the new task percentage." : "The project reference and audit evidence were recorded with the new data."}</p>
          </div>
        </div>
      ) : null}

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone="success">Project connected</StatusPill>
            <span className="text-sm font-medium text-slate-500">{project.reference}</span>
          </div>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Site & progress</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">Plan construction phases, organize tasks, and keep weighted progress separate from informal site estimates.</p>
        </div>
        <Link className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-700/25 sm:self-auto" href="/setup">
          Project settings
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </header>

      {dataError ? (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900" role="alert">
          <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-bold">Site planning data could not be loaded</p>
            <p>Refresh the page. No project record was changed by this read failure.</p>
          </div>
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Delivery planning summary">
        <DeliveryMetric icon={Layers3} label="Phases" value={String(phases.length)} detail="Active planning stages" />
        <DeliveryMetric icon={ClipboardList} label="Open tasks" value={String(progress?.open_task_count ?? 0)} detail="Excludes completed and cancelled" />
        <DeliveryMetric icon={CalendarDays} label="Overdue tasks" value={String(progress?.overdue_task_count ?? 0)} detail="Open work past planned end" attention={Boolean(progress?.overdue_task_count)} />
        <DeliveryMetric icon={Flag} label="Project progress" value={`${formatProgress(progress?.percent_complete)}%`} detail="Weighted task completion" />
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="overflow-hidden">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-800">Work breakdown</p>
              <h2 className="mt-1 text-lg font-extrabold text-slate-950">Construction phases</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">References and ordering are assigned transactionally.</p>
            </div>
            <StatusPill>{phases.length === 0 ? "Empty" : `${phases.length} total`}</StatusPill>
          </div>

          {phases.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {phases.map((phase) => (
                <PhaseListItem key={phase.id} phase={phase} tasks={tasks} />
              ))}
            </ul>
          ) : (
            <div className="grid min-h-72 place-items-center px-5 py-10 text-center">
              <div className="max-w-sm">
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-blue-50 text-blue-800"><Layers3 className="size-7" aria-hidden="true" /></span>
                <h3 className="mt-4 font-extrabold text-slate-900">No phases yet</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">Start with the major stages of the build. Tasks and milestones will sit inside these phases.</p>
              </div>
            </div>
          )}
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-800">New planning stage</p>
            <h2 className="mt-1 text-lg font-extrabold text-slate-950">Create a phase</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">Dates are optional and can be refined before work begins.</p>
          </div>
          <div className="p-5 sm:p-6">
            {canManage ? (
              <PhaseSetupForm idempotencyKey={randomUUID()} projectId={project.id} />
            ) : (
              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                <LockKeyhole className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                <div><p className="font-bold text-slate-900">Read-only project access</p><p className="mt-1">You can review phases and progress but cannot create or change planning records.</p></div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {canManage ? (
        <section className="grid items-start gap-4 xl:grid-cols-2" aria-label="Site data entry">
          <Card className="overflow-hidden">
            <details open={tasks.length === 0 && phases.length > 0}>
              <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-extrabold text-slate-950 marker:hidden focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-blue-700/25 sm:px-6">
                <span><span className="block text-xs font-bold uppercase tracking-[0.16em] text-blue-800">Schedule</span>Create task</span>
                <span className="text-sm font-semibold text-slate-500">{tasks.length} recorded</span>
              </summary>
              <div className="border-t border-slate-100 p-5 sm:p-6">
                <TaskForm idempotencyKey={randomUUID()} phases={phases.map((phase) => ({ id: phase.id, name: phase.name }))} projectId={project.id} />
              </div>
            </details>
          </Card>
          <Card className="overflow-hidden" id="new-daily-log">
            <details open={dailyLogs.length === 0}>
              <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-extrabold text-slate-950 marker:hidden focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-blue-700/25 sm:px-6">
                <span><span className="block text-xs font-bold uppercase tracking-[0.16em] text-blue-800">Site record</span>Add daily log</span>
                <span className="text-sm font-semibold text-slate-500">{dailyLogs.length} recent</span>
              </summary>
              <div className="border-t border-slate-100 p-5 sm:p-6">
                <DailyLogForm defaultDate={today} idempotencyKey={randomUUID()} projectId={project.id} />
              </div>
            </details>
          </Card>
        </section>
      ) : null}

      <div className="grid items-start gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
            <div><h2 className="font-extrabold text-slate-950">Tasks and progress</h2><p className="mt-1 text-sm text-slate-500">Validated statuses and weighted percentages</p></div>
            <StatusPill>{tasks.length} total</StatusPill>
          </div>
          {tasks.length ? (
            <ul className="divide-y divide-slate-100">
              {tasks.map((task) => (
                <li className="px-5 py-4 sm:px-6" key={task.id}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold uppercase tracking-[0.12em] text-blue-800">{task.reference}</span><StatusPill tone={task.status === "completed" ? "success" : task.status === "blocked" ? "warning" : "neutral"}>{humanize(task.status)}</StatusPill><span className="text-xs font-semibold text-slate-500">{humanize(task.priority)} priority</span></div><h3 className="mt-2 font-extrabold text-slate-950">{task.title}</h3><p className="mt-1 text-sm text-slate-500">{task.planned_end ? `Due ${formatDate(task.planned_end)}` : "No due date"}</p></div>
                    <div className="min-w-28 shrink-0 sm:text-right"><p className="text-lg font-extrabold tabular-nums text-slate-950">{formatProgress(task.percent_complete)}%</p><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100" aria-label={`${formatProgress(task.percent_complete)} percent complete`}><div className="h-full rounded-full bg-blue-700" style={{ width: `${task.percent_complete}%` }} /></div></div>
                  </div>
                  {canManage ? (
                    <details className="mt-3 rounded-xl border border-slate-200 bg-slate-50">
                      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-3 text-sm font-bold text-blue-800 marker:hidden focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-700/25">Update progress<span aria-hidden="true">+</span></summary>
                      <div className="border-t border-slate-200 p-4"><TaskProgressForm currentPercent={task.percent_complete} currentStatus={task.status} defaultDate={today} idempotencyKey={randomUUID()} projectId={project.id} taskId={task.id} /></div>
                    </details>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <div className="grid min-h-56 place-items-center p-6 text-center"><div><span className="mx-auto grid size-12 place-items-center rounded-xl bg-slate-100 text-slate-600"><ListChecks className="size-6" aria-hidden="true" /></span><p className="mt-3 max-w-sm text-sm leading-6 text-slate-500">No tasks yet. Create a phase, then add the work that will drive project progress.</p></div></div>
          )}
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6"><div><h2 className="font-extrabold text-slate-950">Recent daily logs</h2><p className="mt-1 text-sm text-slate-500">User-entered site observations</p></div><StatusPill>{dailyLogs.length} shown</StatusPill></div>
          {dailyLogs.length ? <ul className="divide-y divide-slate-100">{dailyLogs.map((log) => <li className="px-5 py-4 sm:px-6" key={log.id}><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold uppercase tracking-[0.12em] text-blue-800">{log.reference}</span><StatusPill>{formatDate(log.log_date)}</StatusPill></div><p className="mt-2 text-sm font-semibold leading-6 text-slate-900">{log.work_completed}</p><p className="mt-2 text-xs leading-5 text-slate-500">{log.workers_present} workers{log.weather_notes ? ` · ${log.weather_notes}` : ""}{log.delays_or_issues ? ` · Issue: ${log.delays_or_issues}` : ""}</p></li>)}</ul> : <div className="grid min-h-56 place-items-center p-6 text-center"><div><span className="mx-auto grid size-12 place-items-center rounded-xl bg-slate-100 text-slate-600"><NotebookPen className="size-6" aria-hidden="true" /></span><p className="mt-3 text-sm text-slate-500">No daily site logs have been recorded.</p></div></div>}
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div><h2 className="font-extrabold text-slate-950">Upcoming milestones</h2><p className="mt-1 text-sm text-slate-500">Nearest project dates</p></div>
          <StatusPill>{milestones.length === 0 ? "Empty" : `${milestones.length} shown`}</StatusPill>
        </div>
        {milestones.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {milestones.map((milestone) => (
              <li className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6" key={milestone.id}>
                <div><p className="font-bold text-slate-900">{milestone.title}</p><p className="mt-1 text-sm text-slate-500">Due {formatDate(milestone.due_date)}</p></div>
                <StatusPill tone={milestone.status === "at_risk" || milestone.status === "missed" ? "warning" : "neutral"}>{humanize(milestone.status)}</StatusPill>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-8 text-center text-sm leading-6 text-slate-500 sm:px-6">No milestones have been recorded. Milestone creation will follow the task workflow.</p>
        )}
      </Card>
    </div>
  );
}

function SiteFoundationState({ authenticated }: { authenticated: boolean }) {
  return (
    <div className="space-y-6">
      <header><StatusPill tone="warning">Project required</StatusPill><h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Site & progress</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">Connect an authorized project before planning phases, tasks, milestones, or progress.</p></header>
      <Card className="grid min-h-80 place-items-center p-6 text-center">
        <div className="max-w-md"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-600"><LockKeyhole className="size-7" aria-hidden="true" /></span><h2 className="mt-4 text-lg font-extrabold text-slate-900">{authenticated ? "Create your project first" : "Foundation preview"}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{authenticated ? "The setup screen will create the project and owner membership together." : "The responsive planning screen is ready; live project records require configured authentication."}</p><Link className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-800 px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-900 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-700/25" href="/setup">Open project setup<ArrowRight className="size-4" aria-hidden="true" /></Link></div>
      </Card>
    </div>
  );
}

function DeliveryMetric({ icon: Icon, label, value, detail, attention = false }: { icon: LucideIcon; label: string; value: string; detail: string; attention?: boolean }) {
  return <Card className="p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-slate-600">{label}</p><p className={`mt-2 text-2xl font-extrabold tabular-nums tracking-tight ${attention ? "text-amber-800" : "text-slate-950"}`}>{value}</p></div><span className={`grid size-10 shrink-0 place-items-center rounded-xl ${attention ? "bg-amber-100 text-amber-800" : "bg-blue-50 text-blue-800"}`}><Icon className="size-5" aria-hidden="true" /></span></div><p className="mt-3 text-xs font-medium leading-5 text-slate-500">{detail}</p></Card>;
}

function PhaseListItem({ phase, tasks }: { phase: PhaseRow; tasks: TaskRow[] }) {
  const taskCount = tasks.filter((task) => task.phase_id === phase.id).length;
  return (
    <li className="px-5 py-4 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold uppercase tracking-[0.12em] text-blue-800">{phase.reference}</span><StatusPill tone={phaseTone(phase.status)}>{humanize(phase.status)}</StatusPill></div><h3 className="mt-2 font-extrabold text-slate-950">{phase.name}</h3>{phase.description ? <p className="mt-1 text-sm leading-6 text-slate-500">{phase.description}</p> : null}</div>
        <div className="shrink-0 text-sm text-slate-500 sm:text-right"><p className="font-bold tabular-nums text-slate-800">{taskCount} {taskCount === 1 ? "task" : "tasks"}</p><p className="mt-1">{formatDateRange(phase.planned_start, phase.planned_end)}</p></div>
      </div>
    </li>
  );
}

function phaseTone(status: string): "neutral" | "success" | "warning" {
  if (status === "completed") return "success";
  if (status === "on_hold") return "warning";
  return "neutral";
}

function humanize(value: string) {
  return value.replaceAll("_", " ");
}

function formatProgress(value: number | null | undefined) {
  return new Intl.NumberFormat("en-ZM", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value ?? 0);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-ZM", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function formatDateRange(start: string | null, end: string | null) {
  if (start && end) return `${formatDate(start)} – ${formatDate(end)}`;
  if (start) return `Starts ${formatDate(start)}`;
  if (end) return `Ends ${formatDate(end)}`;
  return "Dates not set";
}
