"use client";

import { CircleAlert, FlaskConical, LoaderCircle } from "lucide-react";
import { useActionState } from "react";

import {
  signInLocalDemoAction,
  type LocalDemoSignInState,
} from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

const initialState: LocalDemoSignInState = { status: "idle" };

export function LocalDemoSignInForm({ nextPath }: { nextPath: string }) {
  const [state, action, pending] = useActionState(signInLocalDemoAction, initialState);

  return (
    <form action={action} className="space-y-3">
      <input name="next" type="hidden" value={nextPath} />
      {state.message ? (
        <div
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-900"
          role="alert"
        >
          <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <span>{state.message}</span>
        </div>
      ) : null}
      <Button className="w-full" disabled={pending} type="submit" variant="secondary">
        {pending ? (
          <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
        ) : (
          <FlaskConical className="size-5" aria-hidden="true" />
        )}
        {pending ? "Opening local demo…" : "Open local demo"}
      </Button>
    </form>
  );
}
