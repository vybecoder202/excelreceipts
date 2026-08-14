"use client";

import {
  Boxes,
  Building2,
  ChevronDown,
  CircleUserRound,
  ClipboardList,
  FileText,
  HardHat,
  Home,
  LogOut,
  Menu,
  MoreHorizontal,
  PackageCheck,
  ReceiptText,
  Search,
  Settings,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FormEvent, type ReactNode, useState } from "react";

import { signOutAction } from "@/app/actions/auth";
import { cn } from "@/lib/cn";
import type { ApplicationAccessContext } from "@/lib/auth/types";

const desktopNavigation = [
  { href: "/", label: "Overview", icon: Home },
  { href: "/finances", label: "Finances", icon: WalletCards },
  { href: "/procurement", label: "Procurement", icon: PackageCheck },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/site", label: "Site & progress", icon: ClipboardList },
  { href: "/workforce", label: "Workforce", icon: UsersRound },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/reports", label: "Reports", icon: ReceiptText },
];

const mobileNavigation = [
  { href: "/", label: "Home", icon: Home },
  { href: "/finances", label: "Finances", icon: WalletCards },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/site", label: "Site", icon: HardHat },
  { href: "/modules", label: "More", icon: MoreHorizontal },
];

function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === href : pathname.startsWith(href);
}

export function AppShell({
  access,
  children,
}: {
  access: Exclude<ApplicationAccessContext, { mode: "configured" }>;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-950">
      <a
        className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-lg bg-blue-900 px-4 py-3 font-semibold text-white shadow-lg transition-transform focus:translate-y-0 motion-reduce:transition-none"
        href="#main-content"
      >
        Skip to main content
      </a>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">
          <span className="grid size-11 place-items-center rounded-2xl bg-blue-900 shadow-sm" aria-hidden="true">
            <Building2 className="size-6 text-white" strokeWidth={2} />
          </span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-700">Home build</p>
            <p className="text-lg font-extrabold tracking-tight text-slate-950">Construction Manager</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Primary navigation">
          <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Workspace</p>
          <ul className="space-y-1">
            {desktopNavigation.map((item) => {
              const active = isActivePath(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-700/25 motion-reduce:transition-none",
                      active
                        ? "bg-blue-50 text-blue-900"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                    )}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon className="size-5 shrink-0" strokeWidth={active ? 2.25 : 1.75} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-slate-100 p-3">
          <Link
            className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-700/25"
            href="/settings"
          >
            <Settings className="size-5" strokeWidth={1.75} />
            Settings
          </Link>
          {access.mode === "authenticated" ? (
            <div className="mt-1 flex min-h-14 items-center gap-3 rounded-xl px-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-900">
                <CircleUserRound className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-800">{access.user.displayName}</span>
                <span className="block truncate text-xs text-slate-500">{access.user.email}</span>
              </span>
              <form action={signOutAction}>
                <button
                  aria-label="Sign out"
                  className="grid size-11 cursor-pointer place-items-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-700/25"
                  title="Sign out"
                  type="submit"
                >
                  <LogOut className="size-5" aria-hidden="true" />
                </button>
              </form>
            </div>
          ) : (
            <Link
              className="mt-1 flex min-h-14 items-center gap-3 rounded-xl px-3 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-700/25"
              href="/sign-in"
            >
              <span className="grid size-9 place-items-center rounded-full bg-slate-200 text-slate-600">
                <CircleUserRound className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-800">Not signed in</span>
                <span className="block truncate text-xs text-slate-500">Foundation mode</span>
              </span>
              <ChevronDown className="size-4 text-slate-400" aria-hidden="true" />
            </Link>
          )}
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 backdrop-blur-sm">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:h-20 lg:px-8">
            <button
              className="grid size-11 cursor-pointer place-items-center rounded-xl text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-700/25 lg:hidden"
              type="button"
              aria-label="Open navigation menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <Menu className="size-6" />
            </button>
            <Link className="flex min-h-11 min-w-0 items-center gap-2 rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-700/25 lg:hidden" href="/">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-blue-900" aria-hidden="true">
                <Building2 className="size-5 text-white" />
              </span>
              <span className="truncate font-extrabold tracking-tight">Construction</span>
            </Link>
            <form className="ml-auto hidden max-w-xl flex-1 sm:block lg:ml-0" role="search" onSubmit={handleSearch}>
              <label className="relative block">
                <span className="sr-only">Search projects, suppliers, documents, and references</span>
                <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-20 text-base text-slate-900 outline-none transition-[background-color,border-color,box-shadow] placeholder:text-slate-500 hover:border-slate-300 focus:border-blue-700 focus:bg-white focus:ring-3 focus:ring-blue-700/15"
                  type="search"
                  placeholder="Search everything"
                  aria-describedby="search-foundation-hint"
                />
                <span id="search-foundation-hint" className="sr-only">Search will be connected when the project database is ready.</span>
                <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-500 xl:inline">⌘ K</span>
              </label>
            </form>
            <Link
              className="ml-auto inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-800 px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-900 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-700/25 sm:ml-0"
              href="/setup"
              aria-label={access.mode === "authenticated" && access.project ? "Open project setup" : "Set up project"}
            >
              <span className="hidden sm:inline">{access.mode === "authenticated" && access.project ? "Project setup" : "Set up project"}</span>
              <span className="sm:hidden">Setup</span>
            </Link>
          </div>
        </header>

        {menuOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
            <button className="absolute inset-0 cursor-default bg-slate-950/50" aria-label="Close navigation menu" onClick={() => setMenuOpen(false)} />
            <div className="absolute inset-y-0 left-0 flex w-[min(88vw,22rem)] flex-col bg-white shadow-2xl">
              <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
                <span className="flex items-center gap-2 font-extrabold">
                  <span className="grid size-9 place-items-center rounded-xl bg-blue-900" aria-hidden="true"><Building2 className="size-5 text-white" /></span>
                  Construction Manager
                </span>
                <button className="grid size-11 cursor-pointer place-items-center rounded-xl text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-700/25" onClick={() => setMenuOpen(false)} aria-label="Close navigation menu">
                  <X className="size-6" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto p-3" aria-label="Mobile navigation drawer">
                <ul className="space-y-1">
                  {[...desktopNavigation, { href: "/settings", label: "Settings", icon: Settings }].map((item) => {
                    const active = isActivePath(pathname, item.href);
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link className={cn("flex min-h-12 items-center gap-3 rounded-xl px-3 font-semibold focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-700/25", active ? "bg-blue-50 text-blue-900" : "text-slate-700 hover:bg-slate-100")} href={item.href} aria-current={active ? "page" : undefined} onClick={() => setMenuOpen(false)}>
                          <Icon className="size-5" />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
              <div className="border-t border-slate-200 p-3">
                {access.mode === "authenticated" ? (
                  <div className="flex min-h-14 items-center gap-3 rounded-xl px-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-900"><CircleUserRound className="size-5" aria-hidden="true" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-900">{access.user.displayName}</span>
                      <span className="block truncate text-xs text-slate-500">{access.user.email}</span>
                    </span>
                    <form action={signOutAction}>
                      <button aria-label="Sign out" className="grid size-11 cursor-pointer place-items-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-700/25" type="submit">
                        <LogOut className="size-5" aria-hidden="true" />
                      </button>
                    </form>
                  </div>
                ) : (
                  <Link className="flex min-h-12 items-center gap-3 rounded-xl px-3 font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-700/25" href="/sign-in" onClick={() => setMenuOpen(false)}>
                    <CircleUserRound className="size-5" aria-hidden="true" />
                    Sign in
                  </Link>
                )}
              </div>
            </div>
          </div>
        ) : null}

        <main id="main-content" className="mx-auto w-full max-w-[1600px] px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8" tabIndex={-1}>
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/96 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm lg:hidden" aria-label="Primary mobile navigation">
        <ul className="grid grid-cols-5 px-1 py-1.5">
          {mobileNavigation.map((item) => {
            const active = isActivePath(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link className={cn("flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-700/25", active ? "bg-blue-50 text-blue-900" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900")} href={item.href} aria-current={active ? "page" : undefined}>
                  <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
