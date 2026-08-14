import { CloudOff, RotateCw } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-slate-50 px-4 py-10">
      <div className="max-w-md text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-slate-200 text-slate-700"><CloudOff className="size-8" /></span>
        <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-950">You’re offline</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">The connection is unavailable. BuildLedger does not queue financial or inventory changes offline, so no critical record has been posted.</p>
        <Link className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-800 px-4 text-sm font-bold text-white shadow-sm hover:bg-blue-900 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-700/25" href="/"><RotateCw className="size-4" />Try again</Link>
      </div>
    </main>
  );
}
