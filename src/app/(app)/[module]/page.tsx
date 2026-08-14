import {
  ArrowRight,
  Boxes,
  ClipboardList,
  FileText,
  HardHat,
  PackageCheck,
  ReceiptText,
  Settings,
  UsersRound,
  WalletCards,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";

const modules = {
  finances: { title: "Finances", description: "Budgets, supplier invoices, expenses, payments, and forecasts stay distinct and traceable.", icon: WalletCards },
  procurement: { title: "Procurement", description: "Manage quotations, purchase orders, partial deliveries, and outstanding quantities.", icon: PackageCheck },
  inventory: { title: "Inventory", description: "Track stock through posted receipts, issues, transfers, returns, damage, and reversals.", icon: Boxes },
  site: { title: "Site & progress", description: "Capture tasks, milestones, daily logs, progress, delays, inspections, and site photos.", icon: HardHat },
  workforce: { title: "Workforce", description: "Keep worker, attendance, and timesheet records together without payroll or wage calculations.", icon: UsersRound },
  documents: { title: "Documents", description: "Register private invoices, drawings, photographs, contracts, and generated reports.", icon: FileText },
  reports: { title: "Reports", description: "Generate filter-aware PDF, XLSX, and CSV outputs from deterministic calculations.", icon: ReceiptText },
  settings: { title: "Settings", description: "Configure the project, roles, currency, timezone, integrations, and backup status.", icon: Settings },
} as const;

type ModuleName = keyof typeof modules;

function isModuleName(value: string): value is ModuleName {
  return value in modules;
}

export function generateStaticParams() {
  return Object.keys(modules).map((module) => ({ module }));
}

export async function generateMetadata({ params }: { params: Promise<{ module: string }> }): Promise<Metadata> {
  const { module } = await params;
  return isModuleName(module) ? { title: modules[module].title } : {};
}

export default async function ModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  if (!isModuleName(module)) notFound();

  const item = modules[module];
  const Icon = item.icon;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-blue-100 text-blue-900" aria-hidden="true"><Icon className="size-5" /></span>
            <StatusPill tone="warning">Foundation phase</StatusPill>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">{item.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">{item.description}</p>
        </div>
        <Link className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-blue-800 px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-900 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-700/25" href="/setup">
          Review setup
          <ArrowRight className="size-4" />
        </Link>
      </header>

      <Card className="grid min-h-[420px] place-items-center p-6 text-center">
        <div className="max-w-md">
          <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-slate-100 text-slate-600" aria-hidden="true"><ClipboardList className="size-8" /></span>
          <h2 className="mt-5 text-xl font-extrabold tracking-tight text-slate-900">Ready for secure implementation</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            This route and responsive module shell are in place. Real records will appear only after the database schema, RLS policies, and authorized commands are implemented and tested.
          </p>
          <Link className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-blue-800 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-700/25" href="/">
            Return to overview
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </Card>
    </div>
  );
}
