"use client";

import { MoreHorizontal, Plus, Table2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type MouseEvent } from "react";

import { archiveDataTableMutation } from "@/app/actions/data-workspace";
import type { DataTableDefinition } from "@/features/data-workspace/types";
import { cn } from "@/lib/cn";

const colorClasses: Record<string, string> = { blue: "bg-blue-600", cyan: "bg-cyan-600", green: "bg-green-600", amber: "bg-amber-600", orange: "bg-orange-600", violet: "bg-violet-600", rose: "bg-rose-600", slate: "bg-slate-600" };

type MenuState = { table: DataTableDefinition; x: number; y: number };

export function DataTableSidebar({ projectId, currentTableId, tables }: { projectId: string; currentTableId: string; tables: DataTableDefinition[] }) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [confirmTable, setConfirmTable] = useState<DataTableDefinition | null>(null);
  const [notice, setNotice] = useState<{ kind: "error" | "success"; message: string } | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    function close(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenu(null);
    }
    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenu(null);
        setConfirmTable(null);
      }
    }
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", keydown);
    window.addEventListener("resize", () => setMenu(null));
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", keydown);
    };
  }, []);

  function openMenu(event: MouseEvent, table: DataTableDefinition) {
    event.preventDefault();
    event.stopPropagation();
    setMenu({ table, x: Math.min(event.clientX, window.innerWidth - 224), y: Math.min(event.clientY, window.innerHeight - 156) });
  }

  function deleteTable() {
    if (!confirmTable) return;
    const target = confirmTable;
    startTransition(async () => {
      const result = await archiveDataTableMutation({ projectId, tableId: target.id, idempotencyKey: crypto.randomUUID() });
      if (!result.ok) {
        setNotice({ kind: "error", message: result.message });
        setConfirmTable(null);
        return;
      }
      const nextTable = tables.find((table) => table.id !== target.id);
      setNotice({ kind: "success", message: result.message });
      setConfirmTable(null);
      if (target.id === currentTableId) router.push(nextTable ? `/data/${nextTable.id}?deleted=table` : "/data?deleted=table");
      else router.refresh();
    });
  }

  return <>
    <aside className="border-b border-slate-200 bg-slate-50 lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r" aria-label="Tables">
      <div className="hidden items-center justify-between px-4 py-4 lg:flex">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Tables</p>
        <Link aria-label="Create table" className="grid size-11 place-items-center rounded-lg text-slate-500 hover:bg-white hover:text-blue-800 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-700/25" href={`/data/${currentTableId}?panel=table`}><Plus className="size-4" /></Link>
      </div>
      {notice ? <p className={cn("mx-3 mb-2 rounded-lg border p-2 text-xs font-semibold", notice.kind === "error" ? "border-red-200 bg-red-50 text-red-900" : "border-green-200 bg-green-50 text-green-900")} role={notice.kind === "error" ? "alert" : "status"}>{notice.message}</p> : null}
      <nav className="flex gap-1 overflow-x-auto px-3 py-2 lg:block lg:space-y-1 lg:overflow-visible lg:py-0">
        {tables.map((table) => <div className="group relative flex shrink-0 items-center lg:w-full" key={table.id} onContextMenu={(event) => openMenu(event, table)}>
          <Link aria-current={table.id === currentTableId ? "page" : undefined} className={cn("flex min-h-11 min-w-36 flex-1 items-center gap-2 rounded-lg pl-3 pr-11 text-sm font-bold transition-colors lg:min-w-0", table.id === currentTableId ? "bg-white text-slate-950 shadow-sm ring-1 ring-slate-200" : "text-slate-600 hover:bg-white hover:text-slate-950")} href={`/data/${table.id}`}>
            <span className={cn("size-2.5 rounded-sm", colorClasses[table.color] ?? "bg-blue-600")} aria-hidden="true" />
            <span className="truncate">{table.name}</span>
          </Link>
          <button aria-label={`More actions for ${table.name}`} className="absolute right-0 grid size-11 place-items-center rounded-lg text-slate-400 opacity-70 hover:bg-slate-100 hover:text-slate-800 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-700/25 group-hover:opacity-100" onClick={(event) => openMenu(event, table)} type="button"><MoreHorizontal className="size-4" /></button>
        </div>)}
      </nav>
      <div className="hidden border-t border-slate-200 p-3 lg:block">
        <Link className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-bold text-slate-600 hover:bg-white hover:text-blue-800" href={`/data/${currentTableId}?panel=table`}><Plus className="size-4" />Add table</Link>
      </div>
    </aside>

    {menu ? <div className="fixed z-60 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl" ref={menuRef} role="menu" style={{ left: menu.x, top: menu.y }}>
      <Link className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100" href={`/data/${menu.table.id}`} onClick={() => setMenu(null)} role="menuitem"><Table2 className="size-4" />Open table</Link>
      <button className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold text-red-700 hover:bg-red-50" onClick={() => { setConfirmTable(menu.table); setMenu(null); }} role="menuitem" type="button"><Trash2 className="size-4" />Delete table</button>
    </div> : null}

    {confirmTable ? <div className="fixed inset-0 z-70 grid place-items-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-table-title">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <span className="grid size-11 place-items-center rounded-xl bg-red-100 text-red-700"><Trash2 className="size-5" /></span>
        <h2 className="mt-4 text-lg font-extrabold text-slate-950" id="delete-table-title">Delete “{confirmTable.name}”?</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">The table, its active fields, records, views, and forms will disappear from the workspace. The audited archive remains recoverable. Tables used by links must be unlinked first.</p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50" disabled={pending} onClick={() => setConfirmTable(null)} type="button">Cancel</button>
          <button className="min-h-11 rounded-lg bg-red-700 px-4 text-sm font-bold text-white hover:bg-red-800 disabled:cursor-wait disabled:opacity-60" disabled={pending} onClick={deleteTable} type="button">{pending ? "Deleting…" : "Delete table"}</button>
        </div>
      </div>
    </div> : null}
  </>;
}
