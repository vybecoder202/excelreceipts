import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";

export function MetricCard({
  label,
  description,
  icon: Icon,
}: {
  label: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="min-w-0 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-600">{label}</p>
          <p className="mt-2 text-2xl font-extrabold tabular-nums tracking-tight text-slate-400" aria-label={`${label} has no value yet`}>—</p>
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-800" aria-hidden="true">
          <Icon className="size-5" strokeWidth={1.9} />
        </span>
      </div>
      <p className="mt-3 text-xs font-medium leading-5 text-slate-500">{description}</p>
    </Card>
  );
}
