"use client";

import { CalendarPlus, CircleAlert, LoaderCircle } from "lucide-react";
import { useActionState } from "react";

import { createPhaseAction, type CreatePhaseActionState } from "@/app/actions/phases";
import { Button } from "@/components/ui/button";

const initialState: CreatePhaseActionState = { status: "idle" };

export function PhaseSetupForm({
  projectId,
  idempotencyKey,
}: {
  projectId: string;
  idempotencyKey: string;
}) {
  const [state, action, pending] = useActionState(createPhaseAction, initialState);

  return (
    <form action={action} className="space-y-5" noValidate>
      <input name="projectId" type="hidden" value={projectId} />
      <input name="idempotencyKey" type="hidden" value={idempotencyKey} />

      {state.message ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900" role="alert">
          <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <span>{state.message}</span>
        </div>
      ) : null}

      <PhaseField
        error={state.fieldErrors?.name?.[0]}
        hint="Use a clear work stage such as Substructure, Roofing, or Finishes."
        id="phase-name"
        label="Phase name"
        required
      >
        <input
          aria-describedby={`phase-name-hint${state.fieldErrors?.name ? " phase-name-error" : ""}`}
          aria-invalid={Boolean(state.fieldErrors?.name)}
          className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition-[border-color,box-shadow] placeholder:text-slate-400 focus:border-blue-700 focus:ring-3 focus:ring-blue-700/15 disabled:bg-slate-100"
          disabled={pending}
          id="phase-name"
          maxLength={160}
          name="name"
          placeholder="e.g. Substructure"
          required
          type="text"
        />
      </PhaseField>

      <PhaseField
        error={state.fieldErrors?.description?.[0]}
        hint="Summarize the work included in this stage."
        id="phase-description"
        label="Description"
      >
        <textarea
          aria-describedby={`phase-description-hint${state.fieldErrors?.description ? " phase-description-error" : ""}`}
          aria-invalid={Boolean(state.fieldErrors?.description)}
          className="mt-2 min-h-24 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-base leading-6 text-slate-950 outline-none transition-[border-color,box-shadow] placeholder:text-slate-400 focus:border-blue-700 focus:ring-3 focus:ring-blue-700/15 disabled:bg-slate-100"
          disabled={pending}
          id="phase-description"
          maxLength={4000}
          name="description"
          placeholder="Foundations, slab, and ground works"
        />
      </PhaseField>

      <div className="grid gap-4 sm:grid-cols-2">
        <PhaseField error={state.fieldErrors?.plannedStart?.[0]} hint="Optional" id="phase-start" label="Planned start">
          <input
            aria-describedby={`phase-start-hint${state.fieldErrors?.plannedStart ? " phase-start-error" : ""}`}
            aria-invalid={Boolean(state.fieldErrors?.plannedStart)}
            className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-950 outline-none focus:border-blue-700 focus:ring-3 focus:ring-blue-700/15 disabled:bg-slate-100"
            disabled={pending}
            id="phase-start"
            name="plannedStart"
            type="date"
          />
        </PhaseField>
        <PhaseField error={state.fieldErrors?.plannedEnd?.[0]} hint="Optional" id="phase-end" label="Planned end">
          <input
            aria-describedby={`phase-end-hint${state.fieldErrors?.plannedEnd ? " phase-end-error" : ""}`}
            aria-invalid={Boolean(state.fieldErrors?.plannedEnd)}
            className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-950 outline-none focus:border-blue-700 focus:ring-3 focus:ring-blue-700/15 disabled:bg-slate-100"
            disabled={pending}
            id="phase-end"
            name="plannedEnd"
            type="date"
          />
        </PhaseField>
      </div>

      <Button className="w-full sm:w-auto" disabled={pending} type="submit">
        {pending ? (
          <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
        ) : (
          <CalendarPlus className="size-5" aria-hidden="true" />
        )}
        {pending ? "Creating phase…" : "Create phase"}
      </Button>
    </form>
  );
}

function PhaseField({
  children,
  error,
  hint,
  id,
  label,
  required = false,
}: {
  children: React.ReactNode;
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
