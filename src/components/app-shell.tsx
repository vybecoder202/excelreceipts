"use client";

import { Blocks, Braces, Building2, CircleUserRound, Database, LayoutDashboard, LogOut, Menu, Search, Settings, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";

import { signOutAction } from "@/app/actions/auth";
import type { ApplicationAccessContext } from "@/lib/auth/types";
import { cn } from "@/lib/cn";

const workspaceNavigation = [
  { href: "/data", label: "Data", icon: Database, color: "blue" },
  { href: "/interfaces", label: "Interfaces", icon: LayoutDashboard, color: "cyan" },
  { href: "/forms", label: "Forms", icon: Braces, color: "violet" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ access, children }: { access: Exclude<ApplicationAccessContext, { mode: "configured" }>; children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const builderRoute = workspaceNavigation.some((item) => isActive(pathname, item.href));
  const projectName = access.mode === "authenticated" && access.project ? access.project.name : "Construction workspace";

  return <div className="min-h-dvh bg-slate-50 text-slate-950">
    <a className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-lg bg-blue-800 px-4 py-3 text-sm font-bold text-white shadow-lg transition-transform focus:translate-y-0 motion-reduce:transition-none" href="#main-content">Skip to main content</a>
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/96 backdrop-blur">
      <div className="flex h-14 items-center gap-2 px-3 sm:px-4">
        <button aria-expanded={menuOpen} aria-label="Open workspace menu" className="grid size-11 cursor-pointer place-items-center rounded-lg text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-700/25 lg:hidden" onClick={() => setMenuOpen(true)} type="button"><Menu className="size-5" /></button>
        <Link className="flex min-h-11 min-w-0 items-center gap-2 rounded-lg pr-2 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-700/25" href="/data"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-700 text-white"><Blocks className="size-5" /></span><span className="hidden min-w-0 sm:block"><span className="block truncate text-sm font-extrabold text-slate-950">{projectName}</span><span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Workspace</span></span></Link>
        <span className="mx-1 hidden h-7 w-px bg-slate-200 lg:block" aria-hidden="true" />
        <nav className="hidden h-full items-stretch lg:flex" aria-label="Workspace sections">{workspaceNavigation.map((item) => { const active = isActive(pathname, item.href); const Icon = item.icon; return <Link aria-current={active ? "page" : undefined} className={cn("relative flex min-w-32 items-center justify-center gap-2 px-5 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-blue-700/25", active ? "text-slate-950" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900")} href={item.href} key={item.href}><Icon className={cn("size-4", active && item.color === "blue" ? "text-blue-700" : active && item.color === "cyan" ? "text-cyan-700" : active ? "text-violet-700" : "")} />{item.label}{active ? <span className={cn("absolute inset-x-4 bottom-0 h-0.5 rounded-full", item.color === "blue" ? "bg-blue-700" : item.color === "cyan" ? "bg-cyan-700" : "bg-violet-700")} /> : null}</Link>; })}</nav>
        <div className="ml-auto flex items-center gap-1">
          <button aria-label="Search workspace" className="grid size-11 cursor-pointer place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-700/25" title="Workspace search will expand in a later builder phase" type="button"><Search className="size-5" /></button>
          <Link aria-label="Workspace settings" className={cn("grid size-11 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-700/25", isActive(pathname, "/settings") && "bg-slate-100 text-slate-900")} href="/settings"><Settings className="size-5" /></Link>
          <button aria-expanded={menuOpen} aria-label="Open account menu" className="hidden size-11 cursor-pointer place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-700/25 sm:grid" onClick={() => setMenuOpen(true)} type="button"><CircleUserRound className="size-5" /></button>
        </div>
      </div>
      <nav className="grid grid-cols-3 border-t border-slate-100 lg:hidden" aria-label="Workspace sections">{workspaceNavigation.map((item) => { const active = isActive(pathname, item.href); const Icon = item.icon; return <Link aria-current={active ? "page" : undefined} className={cn("relative flex min-h-12 items-center justify-center gap-2 px-2 text-xs font-bold", active ? "text-slate-950" : "text-slate-500")} href={item.href} key={item.href}><Icon className={cn("size-4", active && item.color === "blue" ? "text-blue-700" : active && item.color === "cyan" ? "text-cyan-700" : active ? "text-violet-700" : "")} />{item.label}{active ? <span className={cn("absolute inset-x-5 bottom-0 h-0.5", item.color === "blue" ? "bg-blue-700" : item.color === "cyan" ? "bg-cyan-700" : "bg-violet-700")} /> : null}</Link>; })}</nav>
    </header>

    {menuOpen ? <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Workspace menu"><button aria-label="Close workspace menu" className="absolute inset-0 cursor-default bg-slate-950/45" onClick={() => setMenuOpen(false)} /><aside className="absolute inset-y-0 right-0 flex w-[min(90vw,22rem)] flex-col bg-white shadow-2xl"><header className="flex min-h-16 items-center justify-between border-b border-slate-200 px-4"><span className="flex min-w-0 items-center gap-2 font-extrabold"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-700 text-white"><Blocks className="size-5" /></span><span className="truncate">{projectName}</span></span><button aria-label="Close menu" className="grid size-11 place-items-center rounded-lg text-slate-600 hover:bg-slate-100" onClick={() => setMenuOpen(false)}><X className="size-5" /></button></header><nav className="flex-1 overflow-y-auto p-3" aria-label="Workspace menu navigation"><p className="px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Build</p>{workspaceNavigation.map((item) => { const Icon = item.icon; const active = isActive(pathname, item.href); return <Link className={cn("flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm font-bold", active ? "bg-blue-50 text-blue-900" : "text-slate-700 hover:bg-slate-100")} href={item.href} key={item.href} onClick={() => setMenuOpen(false)}><Icon className="size-5" />{item.label}</Link>; })}<p className="mt-5 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Construction solution</p><Link className="flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm font-bold text-slate-700 hover:bg-slate-100" href="/modules" onClick={() => setMenuOpen(false)}><Building2 className="size-5" />Earlier module screens</Link><Link className="flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm font-bold text-slate-700 hover:bg-slate-100" href="/settings" onClick={() => setMenuOpen(false)}><Settings className="size-5" />Settings</Link></nav><div className="border-t border-slate-200 p-3">{access.mode === "authenticated" ? <div className="flex min-h-14 items-center gap-3 rounded-lg px-3"><CircleUserRound className="size-6 shrink-0 text-slate-500" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-slate-900">{access.user.displayName}</span><span className="block truncate text-xs text-slate-500">{access.user.email}</span></span><form action={signOutAction}><button aria-label="Sign out" className="grid size-11 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-red-700" type="submit"><LogOut className="size-5" /></button></form></div> : <Link className="flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm font-bold text-slate-700 hover:bg-slate-100" href="/sign-in"><CircleUserRound className="size-5" />Sign in</Link>}</div></aside></div> : null}

    <main className={cn(builderRoute ? "w-full" : "mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8")} id="main-content" tabIndex={-1}>{children}</main>
  </div>;
}
