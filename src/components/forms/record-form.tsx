import { CircleAlert, LoaderCircle, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

export const inputClassName =
  "mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition-[border-color,box-shadow] placeholder:text-slate-400 focus:border-blue-700 focus:ring-3 focus:ring-blue-700/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";
export const selectClassName = `${inputClassName} cursor-pointer pr-10`;
export const textareaClassName =
  "mt-2 min-h-24 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-base leading-6 text-slate-950 outline-none transition-[border-color,box-shadow] placeholder:text-slate-400 focus:border-blue-700 focus:ring-3 focus:ring-blue-700/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

export function descriptionIds(id: string, error?: string) {
  return `${id}-hint${error ? ` ${id}-error` : ""}`;
}

export function CommandFields({
  projectId,
  idempotencyKey,
}: {
  projectId: string;
  idempotencyKey: string;
}) {
  return (
    <>
      <input name="projectId" type="hidden" value={projectId} />
      <input name="idempotencyKey" type="hidden" value={idempotencyKey} />
    </>
  );
}

export function RecordField({
  children,
  error,
  hint,
  id,
  label,
  required = false,
}: {
  children: ReactNode;
  error?: string;
  hint: string;
  id: string;
  label: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-900" htmlFor={id}>
        {label} {required ? <span className="text-red-700" aria-hidden="true">*</span> : null}
      </label>
      <p className="mt-1 text-sm leading-5 text-slate-500" id={`${id}-hint`}>{hint}</p>
      {children}
      {error ? <p className="mt-2 text-sm font-semibold text-red-800" id={`${id}-error`}>{error}</p> : null}
    </div>
  );
}

export function ActionMessage({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900" role="alert">
      <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

export function SubmitControl({
  icon: Icon,
  idleLabel,
  pending,
  pendingLabel,
  className,
}: {
  icon: LucideIcon;
  idleLabel: string;
  pending: boolean;
  pendingLabel: string;
  className?: string;
}) {
  return (
    <Button className={className} disabled={pending} type="submit">
      {pending ? (
        <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
      ) : (
        <Icon className="size-5" aria-hidden="true" />
      )}
      {pending ? pendingLabel : idleLabel}
    </Button>
  );
}
