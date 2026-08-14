import { Activity, Building2, CalendarDays, CircleAlert, FlaskConical, Globe2, Settings, ShieldCheck, UsersRound, WalletCards } from "lucide-react";
import type { Metadata } from "next";

import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { ProjectRequiredState } from "@/components/workspaces/workspace-states";
import { getApplicationAccess } from "@/lib/auth/access";
import { isLocalDemoEnabled } from "@/lib/auth/local-demo";
import { humanizeStatus } from "@/lib/format";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Settings" };

const countQueries = [
  ["Phases", "phases"],
  ["Tasks", "tasks"],
  ["Budget items", "budget_lines"],
  ["Expenses", "expenses"],
  ["Suppliers", "suppliers"],
  ["Materials", "materials"],
  ["Workers", "workers"],
  ["Daily logs", "daily_site_logs"],
] as const;

export default async function SettingsPage() {
  const access = await getApplicationAccess();
  const project = access.mode === "authenticated" ? access.project : null;
  if (!project) return <ProjectRequiredState authenticated={access.mode === "authenticated"} description="Create a project before reviewing project configuration and audit history." icon={Settings} title="Settings" />;
  const supabase = await createServerSupabaseClient();
  const [auditResult, ...countResults] = await Promise.all([
    supabase.from("audit_events").select("id, action, entity_type, occurred_at").eq("project_id", project.id).order("occurred_at", { ascending: false }).limit(20),
    ...countQueries.map(([, table]) => supabase.from(table).select("id", { count: "exact", head: true }).eq("project_id", project.id)),
  ]);
  const counts = countQueries.map(([label], index) => ({ label, value: countResults[index]?.count ?? 0 }));
  const dataError = Boolean(auditResult.error || countResults.some((result) => result.error));
  const localDemo = isLocalDemoEnabled(process.env);

  return (
    <div className="space-y-6 lg:space-y-8">
      <header><div className="flex flex-wrap items-center gap-2"><StatusPill tone="success">Project configured</StatusPill>{localDemo ? <StatusPill tone="warning">Local fake data</StatusPill> : null}</div><h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Settings</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">Review the active project boundary, confirmed defaults, record counts, and recent audit evidence.</p></header>
      {dataError ? <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900" role="alert"><CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />Some settings summary data could not be loaded.</div> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Project configuration">
        <SettingCard icon={Building2} label="Project" value={project.name} detail={project.reference} />
        <SettingCard icon={WalletCards} label="Currency" value={project.currencyCode} detail="Zambian Kwacha" />
        <SettingCard icon={Globe2} label="Timezone" value={project.timezone} detail="Project dates and summaries" />
        <SettingCard icon={ShieldCheck} label="Your role" value={humanizeStatus(project.role)} detail={access.mode === "authenticated" ? access.user.email : "Authenticated member"} />
      </section>

      {localDemo ? <Card className="flex items-start gap-3 border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><FlaskConical className="mt-0.5 size-5 shrink-0" aria-hidden="true" /><div><p className="font-bold">Local demo data persists</p><p>Stopping the app does not erase these fake records. From the project folder, run <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs">npm run demo:reset</code> only when you deliberately want a clean local database.</p></div></Card> : null}

      <div className="grid gap-4 xl:grid-cols-[0.72fr_1.28fr]">
        <Card className="overflow-hidden"><div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6"><Activity className="size-5 text-blue-800" aria-hidden="true" /><h2 className="font-extrabold text-slate-950">Data entered</h2></div><dl className="grid grid-cols-2 gap-px bg-slate-100">{counts.map((item) => <div className="bg-white p-4" key={item.label}><dt className="text-xs font-semibold text-slate-500">{item.label}</dt><dd className="mt-1 text-xl font-extrabold tabular-nums text-slate-950">{item.value}</dd></div>)}</dl></Card>
        <Card className="overflow-hidden"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6"><div><h2 className="font-extrabold text-slate-950">Recent audit history</h2><p className="mt-1 text-sm text-slate-500">Append-only evidence from authorized commands</p></div><StatusPill>{auditResult.data?.length ?? 0} shown</StatusPill></div>{auditResult.data?.length ? <ul className="divide-y divide-slate-100">{auditResult.data.map((event) => <li className="flex items-start gap-3 px-5 py-4 sm:px-6" key={event.id}><span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-800"><CalendarDays className="size-4" aria-hidden="true" /></span><div className="min-w-0"><p className="font-bold text-slate-950">{humanizeStatus(event.action)}</p><p className="mt-1 text-xs text-slate-500">{humanizeStatus(event.entity_type)} · {formatAuditTime(event.occurred_at, project.timezone)}</p></div></li>)}</ul> : <div className="grid min-h-48 place-items-center p-6 text-center"><div><UsersRound className="mx-auto size-7 text-slate-400" aria-hidden="true" /><p className="mt-3 text-sm text-slate-500">No audit events are visible.</p></div></div>}</Card>
      </div>
    </div>
  );
}

function SettingCard({ icon: Icon, label, value, detail }: { icon: typeof Settings; label: string; value: string; detail: string }) { return <Card className="p-5"><span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-800"><Icon className="size-5" aria-hidden="true" /></span><p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p><p className="mt-1 break-words font-extrabold text-slate-950">{value}</p><p className="mt-1 break-words text-xs text-slate-500">{detail}</p></Card>; }
function formatAuditTime(value: string, timeZone: string) { return new Intl.DateTimeFormat("en-ZM", { dateStyle: "medium", timeStyle: "short", timeZone }).format(new Date(value)); }
