import {
  ArrowRight,
  BanknoteArrowDown,
  Boxes,
  CalendarClock,
  Camera,
  Check,
  CircleDollarSign,
  CloudOff,
  FileUp,
  Hammer,
  Landmark,
  PackageCheck,
  ReceiptText,
  Settings,
  ShieldCheck,
  Truck,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { MetricCard } from "@/components/dashboard/metric-card";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { getFoundationReadiness } from "@/lib/env/server";

const metrics = [
  { label: "Approved budget", description: "Original plus approved revisions", icon: Landmark },
  { label: "Committed cost", description: "Approved purchase commitments", icon: WalletCards },
  { label: "Actual cost", description: "Posted invoices and expenses", icon: CircleDollarSign },
  { label: "Payments made", description: "Posted cash movements", icon: BanknoteArrowDown },
];

const quickActions = [
  { label: "Add expense", detail: "Receipt or direct cost", icon: ReceiptText, href: "/setup#project" },
  { label: "Record delivery", detail: "Partial deliveries supported", icon: Truck, href: "/setup#project" },
  { label: "Daily site log", detail: "Progress, crew and photos", icon: Hammer, href: "/setup#project" },
  { label: "Upload invoice", detail: "Image or PDF document", icon: FileUp, href: "/setup#project" },
];

export default function DashboardPage() {
  const readiness = getFoundationReadiness(process.env);

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between" aria-labelledby="overview-title">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusPill tone="warning">Foundation mode</StatusPill>
            <span className="text-sm font-medium text-slate-500">No project data connected</span>
          </div>
          <h1 id="overview-title" className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Project overview</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Your budget, site activity, and delivery status will come together here once the secure project foundation is configured.
          </p>
        </div>
        <Link className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-700/25 sm:self-auto" href="/setup">
          View setup checklist
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </section>

      <section className="overflow-hidden rounded-2xl bg-blue-950 text-white shadow-[0_16px_40px_rgba(15,46,97,0.18)]" aria-labelledby="welcome-title">
        <div className="relative grid gap-8 p-5 sm:p-7 lg:grid-cols-[1.25fr_0.75fr] lg:p-8">
          <div className="absolute inset-0 opacity-25" aria-hidden="true" style={{ backgroundImage: "radial-gradient(circle at 85% 20%, #60a5fa 0, transparent 28%), radial-gradient(circle at 65% 110%, #d97706 0, transparent 26%)" }} />
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200">A clear record from day one</p>
            <h2 id="welcome-title" className="mt-3 max-w-2xl text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">Know what was planned, ordered, delivered, used, and paid.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
              BuildLedger keeps financial totals separate from stock movements and preserves a traceable history for every posted correction.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-blue-950 shadow-sm transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-white/45" href="/setup">
                Start local setup
                <ArrowRight className="size-4" />
              </Link>
              <Link className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/30 bg-white/10 px-4 text-sm font-bold text-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-white/45" href="/modules">
                Explore modules
              </Link>
            </div>
          </div>
          <div className="relative grid content-center gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {["Exact money calculations", "Append-only stock ledger", "Private by default"].map((label) => (
              <div className="flex min-h-12 items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-4 text-sm font-semibold backdrop-blur-sm" key={label}>
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-emerald-400/15 text-emerald-200"><Check className="size-4" aria-hidden="true" /></span>
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="financial-position-title">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <h2 id="financial-position-title" className="text-lg font-extrabold tracking-tight text-slate-950">Financial position</h2>
            <p className="mt-1 text-sm text-slate-500">Values remain blank until an authorized project is connected.</p>
          </div>
          <StatusPill>Not calculated</StatusPill>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
        </div>
      </section>

      <section aria-labelledby="quick-actions-title">
        <div className="mb-3">
          <h2 id="quick-actions-title" className="text-lg font-extrabold tracking-tight text-slate-950">Quick actions</h2>
          <p className="mt-1 text-sm text-slate-500">Designed for fast capture on site; setup is required before records can be posted.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link className="group flex min-h-24 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-[border-color,background-color,box-shadow] duration-200 hover:border-blue-200 hover:bg-blue-50/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-700/25" href={action.href} key={action.label}>
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700 transition-colors group-hover:bg-blue-100 group-hover:text-blue-900" aria-hidden="true"><Icon className="size-5" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-slate-900">{action.label}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-slate-500">{action.detail}</span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-slate-400 transition-colors group-hover:text-blue-800" aria-hidden="true" />
              </Link>
            );
          })}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="overflow-hidden" role="region" aria-labelledby="activity-title">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <h2 id="activity-title" className="font-extrabold text-slate-950">Recent activity</h2>
              <p className="mt-1 text-sm text-slate-500">Expenses, deliveries, and daily logs</p>
            </div>
            <StatusPill>Empty</StatusPill>
          </div>
          <div className="grid min-h-64 place-items-center px-5 py-10 text-center">
            <div className="max-w-sm">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-600" aria-hidden="true"><CalendarClock className="size-7" /></span>
              <h3 className="mt-4 font-extrabold text-slate-900">Nothing recorded yet</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">Once the first project is created, this feed will show authorized changes in time order.</p>
              <Link className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold text-blue-800 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-700/25" href="/setup">
                Prepare the project
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </Card>

        <Card className="p-5 sm:p-6" role="region" aria-labelledby="readiness-title">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-800">System health</p>
              <h2 id="readiness-title" className="mt-1 text-lg font-extrabold text-slate-950">Foundation readiness</h2>
            </div>
            <ShieldCheck className="size-6 text-blue-800" aria-hidden="true" />
          </div>
          <ul className="mt-5 space-y-3">
            <ReadinessRow label="Application shell" ready icon={Check} />
            <ReadinessRow label="Supabase database" ready={readiness.supabaseConfigured} icon={Landmark} />
            <ReadinessRow label="Owner access" ready={readiness.ownerConfigured} icon={ShieldCheck} />
            <ReadinessRow label="Google Drive" ready={readiness.driveConfigured} icon={CloudOff} />
            <ReadinessRow label="Project defaults" ready={readiness.projectDefaultsConfigured} icon={Settings} />
          </ul>
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">
            Financial and stock actions stay unavailable until secure configuration and database rules are in place.
          </div>
        </Card>
      </div>

      <section className="grid gap-4 md:grid-cols-3" aria-label="Project operational summaries">
        <SummaryCard icon={PackageCheck} title="Deliveries" detail="No purchase orders are connected." />
        <SummaryCard icon={Boxes} title="Materials" detail="No stock locations are connected." />
        <SummaryCard icon={Camera} title="Site progress" detail="No daily logs are connected." />
      </section>
    </div>
  );
}

function ReadinessRow({ label, ready, icon: Icon }: { label: string; ready: boolean; icon: LucideIcon }) {
  return (
    <li className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3">
      <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${ready ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`} aria-hidden="true"><Icon className="size-4" /></span>
      <span className="flex-1 text-sm font-semibold text-slate-800">{label}</span>
      <span className={`text-xs font-bold ${ready ? "text-emerald-800" : "text-slate-500"}`}>{ready ? "Ready" : "Pending"}</span>
    </li>
  );
}

function SummaryCard({ icon: Icon, title, detail }: { icon: LucideIcon; title: string; detail: string }) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-800" aria-hidden="true"><Icon className="size-5" /></span>
      <div>
        <h2 className="font-extrabold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm leading-5 text-slate-500">{detail}</p>
      </div>
    </Card>
  );
}
