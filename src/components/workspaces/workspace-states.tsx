import { ArrowRight, LockKeyhole, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";

export function ProjectRequiredState({
  icon: Icon,
  title,
  description,
  authenticated,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  authenticated: boolean;
}) {
  return (
    <div className="space-y-6">
      <header>
        <StatusPill tone="warning">Project required</StatusPill>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">{description}</p>
      </header>
      <Card className="grid min-h-80 place-items-center p-6 text-center">
        <div className="max-w-md">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-600">
            {authenticated ? <LockKeyhole className="size-7" aria-hidden="true" /> : <Icon className="size-7" aria-hidden="true" />}
          </span>
          <h2 className="mt-4 text-lg font-extrabold text-slate-900">
            {authenticated ? "Create your project first" : "Start the local demo"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {authenticated
              ? "Project setup creates the owner membership and ZMW/Africa-Lusaka defaults together."
              : "Run npm run demo, open sign in, and choose Open local demo to enter persistent fake records."}
          </p>
          <Link
            className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-800 px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-900 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-700/25"
            href={authenticated ? "/setup" : "/sign-in"}
          >
            {authenticated ? "Open project setup" : "Open sign in"}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </Card>
    </div>
  );
}

export function WorkspaceSuccess({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-950" role="status">
      {children}
    </div>
  );
}
