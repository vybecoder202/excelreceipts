import { CloudOff, FileText, FolderLock, Image, ReceiptText, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { ProjectRequiredState } from "@/components/workspaces/workspace-states";
import { getApplicationAccess } from "@/lib/auth/access";
import { getFoundationReadiness } from "@/lib/env/server";

export const metadata: Metadata = { title: "Documents" };

const categories = [
  { icon: ReceiptText, label: "Invoices and receipts", detail: "Link to suppliers, expenses, and later purchase records" },
  { icon: Image, label: "Progress photographs", detail: "Link to phases, tasks, and daily site logs" },
  { icon: FileText, label: "Drawings and contracts", detail: "Private project-controlled reference files" },
];

export default async function DocumentsPage() {
  const access = await getApplicationAccess();
  const project = access.mode === "authenticated" ? access.project : null;
  if (!project) return <ProjectRequiredState authenticated={access.mode === "authenticated"} description="Create a project before connecting its private document library." icon={FileText} title="Documents" />;
  const readiness = getFoundationReadiness(process.env);

  return (
    <div className="space-y-6 lg:space-y-8">
      <header><div className="flex flex-wrap items-center gap-2"><StatusPill tone={readiness.driveConfigured ? "success" : "warning"}>{readiness.driveConfigured ? "Drive configuration detected" : "Google Drive not connected"}</StatusPill><span className="text-sm font-medium text-slate-500">{project.reference}</span></div><h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Documents</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">The document workspace will keep private file metadata in the project database while file content stays in a dedicated Google Drive folder.</p></header>

      <Card className="overflow-hidden border-blue-200">
        <div className="grid gap-6 bg-blue-950 p-5 text-white sm:p-7 lg:grid-cols-[1fr_auto] lg:items-center">
          <div><span className="grid size-12 place-items-center rounded-2xl bg-white/10"><FolderLock className="size-6" aria-hidden="true" /></span><h2 className="mt-4 text-xl font-extrabold">Private upload checkpoint</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">Uploads are intentionally disabled until you create the free Google Cloud project and grant the narrow Drive permission. Local test documents will not be written to an unprotected folder.</p></div>
          <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-blue-100">No account action required yet</div>
        </div>
      </Card>

      <section className="grid gap-4 md:grid-cols-3" aria-label="Planned document categories">
        {categories.map(({ icon: Icon, label, detail }) => <Card className="p-5" key={label}><span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-blue-800"><Icon className="size-5" aria-hidden="true" /></span><h2 className="mt-4 font-extrabold text-slate-950">{label}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p></Card>)}
      </section>

      <Card className="p-5 sm:p-6"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-800" aria-hidden="true" /><div><h2 className="font-extrabold text-slate-950">Security behavior already decided</h2><ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600"><li>Files will never receive public “anyone with the link” permissions.</li><li>Database links will be project-scoped and authorized by Row Level Security.</li><li>Replacements will preserve history instead of silently overwriting evidence.</li></ul></div></div></Card>

      <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-100 p-4 text-sm leading-6 text-slate-700"><CloudOff className="mt-0.5 size-5 shrink-0" aria-hidden="true" /><p><span className="font-bold text-slate-900">Nothing to test here yet.</span> Use Finances, Procurement, Inventory, Site, and Workforce for local data entry. Document connection is the first external-account checkpoint.</p></div>
    </div>
  );
}
