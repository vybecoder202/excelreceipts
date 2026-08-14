import { ArrowDownAZ, Filter, Group, Search, X } from "lucide-react";
import Link from "next/link";

import type { DataFieldDefinition } from "@/features/data-workspace/types";

type ViewQuery = {
  view?: string;
  q?: string;
  filterField?: string;
  filterOp?: string;
  filterValue?: string;
  sortField?: string;
  sortDir?: string;
  groupField?: string;
};

const selectClass = "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-700 focus:ring-3 focus:ring-blue-700/15";
const menuClass = "absolute left-0 top-[calc(100%+0.35rem)] z-30 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white p-4 shadow-xl";
const summaryClass = "inline-flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-lg px-3 text-sm font-bold text-slate-600 transition-colors hover:bg-white hover:text-slate-950 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-700/25 [&::-webkit-details-marker]:hidden";

function HiddenInputs({ query, omit }: { query: ViewQuery; omit: (keyof ViewQuery)[] }) {
  return <>{Object.entries(query).map(([key, value]) => value && !omit.includes(key as keyof ViewQuery) ? <input key={key} name={key} type="hidden" value={value} /> : null)}</>;
}

function ApplyButton() {
  return <button className="mt-3 min-h-11 w-full rounded-lg bg-blue-700 px-4 text-sm font-bold text-white hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-700/25" type="submit">Apply</button>;
}

export function DataViewControls({ tableId, fields, query }: { tableId: string; fields: DataFieldDefinition[]; query: ViewQuery }) {
  const activeFilters = query.filterField ? 1 : 0;
  const activeSort = fields.some((field) => field.id === query.sortField);
  const activeGroup = fields.some((field) => field.id === query.groupField);
  const clearParams = new URLSearchParams();
  if (query.view) clearParams.set("view", query.view);
  if (query.q) clearParams.set("q", query.q);
  const clearHref = `/data/${tableId}${clearParams.size ? `?${clearParams}` : ""}`;

  return <div className="flex flex-col border-b border-slate-200 bg-slate-50/80 xl:flex-row xl:items-center">
    <div className="flex min-h-12 flex-wrap items-center gap-1 px-2 py-1.5 sm:px-3">
      <details className="relative">
        <summary className={summaryClass}><Filter className="size-4" aria-hidden="true" />Filter{activeFilters ? <span className="rounded-full bg-blue-100 px-1.5 text-xs text-blue-800">{activeFilters}</span> : null}</summary>
        <form className={menuClass} method="get">
          <HiddenInputs omit={["filterField", "filterOp", "filterValue"]} query={query} />
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Show records where</p>
          <div className="grid gap-2">
            <select aria-label="Filter field" className={selectClass} defaultValue={query.filterField ?? ""} name="filterField">
              <option value="">Choose a field</option>
              {fields.map((field) => <option key={field.id} value={field.id}>{field.name}</option>)}
            </select>
            <select aria-label="Filter operator" className={selectClass} defaultValue={query.filterOp ?? "contains"} name="filterOp">
              <option value="contains">contains</option>
              <option value="equals">equals</option>
              <option value="is_empty">is empty</option>
              <option value="is_not_empty">is not empty</option>
            </select>
            <input aria-label="Filter value" className={selectClass} defaultValue={query.filterValue ?? ""} name="filterValue" placeholder="Value (not needed for empty)" />
          </div>
          <ApplyButton />
        </form>
      </details>

      <details className="relative">
        <summary className={summaryClass}><Group className="size-4" aria-hidden="true" />Group{activeGroup ? <span className="size-2 rounded-full bg-blue-600" aria-label="Active" /> : null}</summary>
        <form className={menuClass} method="get">
          <HiddenInputs omit={["groupField"]} query={query} />
          <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500" htmlFor="group-field">Group records by</label>
          <select className={selectClass} defaultValue={query.groupField ?? ""} id="group-field" name="groupField">
            <option value="">No grouping</option>
            {fields.filter((field) => !["long_text", "formula"].includes(field.field_type)).map((field) => <option key={field.id} value={field.id}>{field.name}</option>)}
          </select>
          <ApplyButton />
        </form>
      </details>

      <details className="relative">
        <summary className={summaryClass}><ArrowDownAZ className="size-4" aria-hidden="true" />Sort{activeSort ? <span className="size-2 rounded-full bg-blue-600" aria-label="Active" /> : null}</summary>
        <form className={menuClass} method="get">
          <HiddenInputs omit={["sortField", "sortDir"]} query={query} />
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Sort records</p>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <select aria-label="Sort field" className={selectClass} defaultValue={query.sortField ?? ""} name="sortField">
              <option value="">No sorting</option>
              {fields.map((field) => <option key={field.id} value={field.id}>{field.name}</option>)}
            </select>
            <select aria-label="Sort direction" className={selectClass} defaultValue={query.sortDir ?? "asc"} name="sortDir">
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
          <ApplyButton />
        </form>
      </details>

      {activeFilters || activeSort || activeGroup ? <Link className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-bold text-slate-500 hover:bg-white hover:text-red-700" href={clearHref}><X className="size-4" aria-hidden="true" />Clear</Link> : null}
    </div>

    <form className="flex gap-2 border-t border-slate-200 p-2 xl:ml-auto xl:border-l xl:border-t-0" method="get" role="search">
      <HiddenInputs omit={["q"]} query={query} />
      <label className="relative min-w-0 flex-1 xl:w-64">
        <span className="sr-only">Search this table</span>
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <input className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-base outline-none focus:border-blue-700 focus:ring-3 focus:ring-blue-700/15" defaultValue={query.q} name="q" placeholder="Find in view" type="search" />
      </label>
      <button className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-100" type="submit">Search</button>
    </form>
  </div>;
}
