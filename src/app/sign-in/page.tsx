import { Building2, Check, CircleAlert, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { LocalDemoSignInForm } from "@/components/auth/local-demo-sign-in-form";
import { isLocalDemoEnabled } from "@/lib/auth/local-demo";
import { safeNextPath } from "@/lib/auth/navigation";
import { hasPublicSupabaseConfiguration } from "@/lib/env/public";

export const metadata: Metadata = { title: "Sign in" };

const errorMessages: Record<string, string> = {
  callback: "Google sign-in could not be completed. Retry and confirm that the same Google account is selected.",
  configuration: "Sign-in is not configured for this environment yet.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const configured = hasPublicSupabaseConfiguration();
  const localDemoEnabled = isLocalDemoEnabled(process.env);
  const parameters = await searchParams;
  const nextPath = safeNextPath(parameters.next);
  const errorMessage = parameters.error ? errorMessages[parameters.error] : undefined;

  return (
    <main className="grid min-h-dvh bg-slate-50 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-blue-950 p-12 text-white lg:flex lg:flex-col lg:justify-between" aria-label="Product principles">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 15% 10%, #3b82f6 0, transparent 28%), radial-gradient(circle at 90% 85%, #d97706 0, transparent 26%)" }} />
        <Link className="relative flex items-center gap-3 self-start rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-white/45" href="/">
          <span className="grid size-11 place-items-center rounded-2xl bg-white text-blue-950"><Building2 className="size-6" /></span>
          <span className="text-xl font-extrabold tracking-tight">Construction Manager</span>
        </Link>
        <div className="relative max-w-xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-200">Private home construction records</p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight">A complete project history, without losing the difference between cost and stock.</h1>
          <ul className="mt-8 space-y-4">
            {["Allowlisted owner access", "Exact financial calculations", "Traceable inventory movements"].map((item) => <li className="flex items-center gap-3 font-semibold text-blue-100" key={item}><span className="grid size-7 place-items-center rounded-full bg-emerald-400/15 text-emerald-200"><Check className="size-4" /></span>{item}</li>)}
          </ul>
        </div>
        <p className="relative text-sm text-blue-200">Built for one homeowner first. No public registration.</p>
      </section>

      <section className="grid place-items-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link className="mb-10 flex items-center gap-3 lg:hidden" href="/"><span className="grid size-11 place-items-center rounded-2xl bg-blue-950 text-white"><Building2 className="size-6" /></span><span className="text-xl font-extrabold">Construction Manager</span></Link>
          <span className="grid size-12 place-items-center rounded-2xl bg-blue-100 text-blue-900"><ShieldCheck className="size-6" /></span>
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-950">Welcome back</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Use the explicitly allowlisted Google account. Other Google accounts will not receive project access.</p>
          {errorMessage ? (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900" role="alert">
              <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>
          ) : null}
          <div className="mt-8 space-y-4">
            {localDemoEnabled ? (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm font-bold text-blue-950">Local testing mode</p>
                <p className="mt-1 text-xs leading-5 text-blue-900">
                  Uses a fake owner stored only in the local Supabase database. Test records persist until you reset them.
                </p>
                <div className="mt-3">
                  <LocalDemoSignInForm nextPath={nextPath} />
                </div>
              </div>
            ) : null}
            <GoogleSignInButton configured={configured} nextPath={nextPath} />
          </div>
          <div className="mt-8 border-t border-slate-200 pt-6">
            <p className="text-xs leading-5 text-slate-500">Google sign-in proves identity. Project membership and database Row Level Security still decide what the account may read or change.</p>
          </div>
          <Link className="mt-6 inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-bold text-blue-800 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-700/25" href="/">Return to foundation overview</Link>
        </div>
      </section>
    </main>
  );
}
