"use client";

import { CircleAlert, LoaderCircle, ShieldCheck } from "lucide-react";
import { useActionState } from "react";

import { createProjectAction, type CreateProjectActionState } from "@/app/actions/projects";
import { Button } from "@/components/ui/button";

const initialState: CreateProjectActionState = { status: "idle" };

export function ProjectSetupForm({ idempotencyKey }: { idempotencyKey: string }) {
  const [state, action, pending] = useActionState(
    createProjectAction,
    initialState,
  );

  return (
    <form action={action} className="space-y-5" noValidate>
      <input name="idempotencyKey" type="hidden" value={idempotencyKey} />

      {state.message ? (
        <div
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900"
          role="alert"
        >
          <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <span>{state.message}</span>
        </div>
      ) : null}

      <div>
        <label className="block text-sm font-bold text-slate-900" htmlFor="project-name">
          Project name <span className="text-red-700" aria-hidden="true">*</span>
        </label>
        <p className="mt-1 text-sm leading-5 text-slate-500" id="project-name-hint">
          Use the familiar name you want to see throughout reports and site records.
        </p>
        <input
          aria-describedby={`project-name-hint${state.fieldErrors?.name ? " project-name-error" : ""}`}
          aria-invalid={Boolean(state.fieldErrors?.name)}
          autoComplete="off"
          className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition-[border-color,box-shadow] placeholder:text-slate-400 focus:border-blue-700 focus:ring-3 focus:ring-blue-700/15 disabled:bg-slate-100"
          disabled={pending}
          id="project-name"
          maxLength={160}
          name="name"
          placeholder="e.g. Kamoya family house"
          required
          type="text"
        />
        {state.fieldErrors?.name ? (
          <p className="mt-2 text-sm font-semibold text-red-800" id="project-name-error">
            {state.fieldErrors.name[0]}
          </p>
        ) : null}
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-900" htmlFor="project-description">
          Short description <span className="font-medium text-slate-500">(optional)</span>
        </label>
        <p className="mt-1 text-sm leading-5 text-slate-500" id="project-description-hint">
          Add a location or a short note that helps distinguish this build.
        </p>
        <textarea
          aria-describedby={`project-description-hint${state.fieldErrors?.description ? " project-description-error" : ""}`}
          aria-invalid={Boolean(state.fieldErrors?.description)}
          className="mt-2 min-h-28 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-base leading-6 text-slate-950 outline-none transition-[border-color,box-shadow] placeholder:text-slate-400 focus:border-blue-700 focus:ring-3 focus:ring-blue-700/15 disabled:bg-slate-100"
          disabled={pending}
          id="project-description"
          maxLength={4000}
          name="description"
          placeholder="Residential house construction in Lusaka"
        />
        {state.fieldErrors?.description ? (
          <p className="mt-2 text-sm font-semibold text-red-800" id="project-description-error">
            {state.fieldErrors.description[0]}
          </p>
        ) : null}
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-blue-800" aria-hidden="true" />
          <div>
            <p className="text-sm font-bold text-blue-950">Confirmed project defaults</p>
            <p className="mt-1 text-sm leading-6 text-blue-900">
              Zambian Kwacha (ZMW) · Africa/Lusaka · tax and wage calculations excluded
            </p>
          </div>
        </div>
      </div>

      <Button className="w-full sm:w-auto" disabled={pending} type="submit">
        {pending ? (
          <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
        ) : (
          <ShieldCheck className="size-5" aria-hidden="true" />
        )}
        {pending ? "Creating project…" : "Create secure project"}
      </Button>
    </form>
  );
}
