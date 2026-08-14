import { randomUUID } from "node:crypto";

import { Check, Circle, CircleAlert, ExternalLink, LockKeyhole, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ProjectSetupForm } from "@/components/projects/project-setup-form";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { getApplicationAccess } from "@/lib/auth/access";
import type { ApplicationAccessContext } from "@/lib/auth/types";
import { getFoundationReadiness } from "@/lib/env/server";

export const metadata: Metadata = { title: "Project setup" };

const ownerDecisions = [
  { label: "Application name", current: "Construction Manager" },
  { label: "Default currency", current: "Zambian Kwacha (ZMW)" },
  { label: "Project timezone", current: "Africa/Lusaka" },
  { label: "Tax calculations", current: "Excluded from scope" },
  { label: "Wage calculations", current: "Excluded from scope" },
];

export default async function SetupPage() {
  const access = await getApplicationAccess();
  if (access.mode === "authenticated") {
    return <AuthenticatedProjectSetup access={access} idempotencyKey={randomUUID()} />;
  }

  const readiness = getFoundationReadiness(process.env);
  const configuredCount = [
    readiness.supabaseConfigured,
    readiness.ownerConfigured,
    readiness.driveConfigured,
    readiness.projectDefaultsConfigured,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <StatusPill tone="warning">Local foundation</StatusPill>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Project setup</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">Safe local work can continue without accounts. Production values stay unset until you choose them and place secrets in secure dashboards.</p>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-right">
          <p className="text-2xl font-extrabold tabular-nums text-blue-950">{configuredCount}/4</p>
          <p className="text-xs font-semibold text-blue-800">external areas configured</p>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="overflow-hidden" id="project">
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-800">Owner choices</p>
            <h2 className="mt-1 text-lg font-extrabold text-slate-950">Defaults that materially affect the system</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">These remain configurable and are not blocking local implementation.</p>
          </div>
          <dl className="divide-y divide-slate-100 px-5 sm:px-6">
            {ownerDecisions.map((decision) => (
              <div className="grid gap-1 py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6" key={decision.label}>
                <dt className="text-sm font-bold text-slate-800">{decision.label}</dt>
                <dd className="text-sm font-medium text-slate-500 sm:text-right">{decision.current}</dd>
              </div>
            ))}
          </dl>
          <div className="border-t border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-950 sm:px-6">
            The owner email is intentionally not collected by this local screen. It will be placed in secure environment configuration at the Supabase/deployment checkpoint.
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-800">Account checkpoints</p>
              <h2 className="mt-1 text-lg font-extrabold text-slate-950">One free account at a time</h2>
            </div>
            <LockKeyhole className="size-6 text-blue-800" aria-hidden="true" />
          </div>
          <ol className="mt-5 space-y-3">
            <Checkpoint label="GitHub Free" detail="Private source repository and workflows" />
            <Checkpoint label="Supabase Free" detail="Development database and Google sign-in" ready={readiness.supabaseConfigured} />
            <Checkpoint label="Google Cloud project" detail="Drive API and least-privilege OAuth" ready={readiness.driveConfigured} />
            <Checkpoint label="Vercel Hobby" detail="Preview and production application hosting" />
          </ol>
          <p className="mt-5 rounded-xl bg-slate-100 p-3 text-sm leading-6 text-slate-600">No billing, paid service, broad Drive permission, or secret-in-chat step is part of the local foundation.</p>
        </Card>
      </div>

      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-800"><ShieldCheck className="size-5" /></span>
            <div>
              <h2 className="font-extrabold text-slate-950">Security gate is active</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Until authentication, RLS, and transactional commands are verified, finance and inventory controls do not post any records.</p>
            </div>
          </div>
          <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-700/25" href="/">
            Back to overview
            <ExternalLink className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </Card>
    </div>
  );
}

function AuthenticatedProjectSetup({
  access,
  idempotencyKey,
}: {
  access: Extract<ApplicationAccessContext, { mode: "authenticated" }>;
  idempotencyKey: string;
}) {
  const project = access.project;

  return (
    <div className="space-y-6">
      <header>
        <StatusPill tone={project ? "success" : access.canCreateProject ? "warning" : "danger"}>
          {project ? "Project active" : access.canCreateProject ? "Owner verified" : "Access pending"}
        </StatusPill>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
          {project ? "Project setup" : "Create your first project"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
          {project
            ? "Review the project identity and confirmed operating defaults. Business-module settings will be added here as each module is implemented."
            : "Start with the project identity. Construction Manager creates the project, owner membership, settings, audit event, and retry protection together."}
        </p>
      </header>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-800">
              {project ? "Project identity" : "Step 1 of 1"}
            </p>
            <h2 className="mt-1 text-lg font-extrabold text-slate-950">
              {project ? project.name : "Name this construction project"}
            </h2>
          </div>

          {project ? (
            <dl className="divide-y divide-slate-100 px-5 sm:px-6">
              <ProjectDetail label="Reference" value={project.reference} />
              <ProjectDetail label="Status" value={project.status.replace("_", " ")} />
              <ProjectDetail label="Your role" value={project.role.replace("_", " ")} />
              <ProjectDetail label="Currency" value={`${project.currencyCode} · Zambian Kwacha`} />
              <ProjectDetail label="Timezone" value={project.timezone} />
            </dl>
          ) : access.canCreateProject ? (
            <div className="p-5 sm:p-6">
              <ProjectSetupForm idempotencyKey={idempotencyKey} />
            </div>
          ) : (
            <div className="p-5 sm:p-6">
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900" role="alert">
                <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-bold">This Google account has no project access</p>
                  <p className="mt-1">Sign out and use the privately configured owner account, or add this account later through an authorized project invitation.</p>
                </div>
              </div>
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card className="p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-900">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-800">Signed-in identity</p>
                <h2 className="mt-1 font-extrabold text-slate-950">{access.user.displayName}</h2>
                <p className="mt-1 break-all text-sm text-slate-600">{access.user.email}</p>
              </div>
            </div>
            <p className="mt-4 rounded-xl bg-slate-100 p-3 text-sm leading-6 text-slate-600">Authentication proves identity; database membership and Row Level Security still authorize every project record.</p>
          </Card>

          <Card className="p-5 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-800">Confirmed defaults</p>
            <dl className="mt-3 space-y-3">
              {ownerDecisions.slice(1).map((decision) => (
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0" key={decision.label}>
                  <dt className="text-sm font-semibold text-slate-700">{decision.label}</dt>
                  <dd className="text-right text-sm font-bold text-slate-900">{decision.current}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </div>

      <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h2 className="font-extrabold text-slate-950">Secure foundation</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Project creation is transactional and idempotent: a retry cannot silently create duplicate partial projects.</p>
        </div>
        <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-700/25" href="/">
          Back to overview
          <ExternalLink className="size-4" aria-hidden="true" />
        </Link>
      </Card>
    </div>
  );
}

function ProjectDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6">
      <dt className="text-sm font-bold text-slate-700">{label}</dt>
      <dd className="text-sm font-semibold capitalize text-slate-950 sm:text-right">{value}</dd>
    </div>
  );
}

function Checkpoint({ label, detail, ready = false }: { label: string; detail: string; ready?: boolean }) {
  return (
    <li className="flex min-h-14 items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5">
      <span className={`grid size-8 shrink-0 place-items-center rounded-full ${ready ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`} aria-hidden="true">
        {ready ? <Check className="size-4" /> : <Circle className="size-4" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-slate-900">{label}</span>
        <span className="block text-xs leading-5 text-slate-500">{detail}</span>
      </span>
      <span className={`text-xs font-bold ${ready ? "text-emerald-800" : "text-slate-500"}`}>{ready ? "Ready" : "Later"}</span>
    </li>
  );
}
