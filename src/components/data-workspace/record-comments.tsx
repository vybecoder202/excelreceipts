"use client";

import { MessageSquarePlus, Send } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";

import { createDataRecordCommentAction } from "@/app/actions/data-workspace";
import type { DataRecordComment, MaterializedRecord } from "@/features/data-workspace/types";

const idleState = { status: "idle" as const };

export function RecordComments({ projectId, tableId, record, comments, idempotencyKey }: { projectId: string; tableId: string; record: MaterializedRecord; comments: DataRecordComment[]; idempotencyKey: string }) {
  const [state, action, pending] = useActionState(createDataRecordCommentAction, idleState);
  const formRef = useRef<HTMLFormElement>(null);
  const commandKeyRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      if (commandKeyRef.current) commandKeyRef.current.value = crypto.randomUUID();
    }
  }, [state.status]);

  return <div>
    <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white text-blue-800"><MessageSquarePlus className="size-5" /></span>
      <div><p className="font-bold text-slate-900">Discussion for {record.label}</p><p className="mt-1 text-sm leading-6 text-slate-600">Comments stay attached to this record and are visible to project members.</p></div>
    </div>

    <form action={action} className="mt-5" noValidate ref={formRef}>
      <input name="projectId" type="hidden" value={projectId} />
      <input name="tableId" type="hidden" value={tableId} />
      <input name="recordId" type="hidden" value={record.id} />
      <input defaultValue={idempotencyKey} name="idempotencyKey" ref={commandKeyRef} type="hidden" />
      <label className="mb-1.5 block text-sm font-bold text-slate-800" htmlFor="record-comment">Add a comment</label>
      <textarea aria-invalid={state.status === "error"} className="min-h-28 w-full rounded-xl border border-slate-300 bg-white p-3 text-base text-slate-950 outline-none focus:border-blue-700 focus:ring-3 focus:ring-blue-700/15" id="record-comment" maxLength={4000} name="body" placeholder="Add context, a question, or a decision…" required />
      {state.message ? <p className={`mt-2 text-sm font-semibold ${state.status === "error" ? "text-red-700" : "text-green-700"}`} role={state.status === "error" ? "alert" : "status"}>{state.message}</p> : null}
      <button className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-bold text-white hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60" disabled={pending} type="submit"><Send className="size-4" />{pending ? "Adding…" : "Add comment"}</button>
    </form>

    <div className="mt-8 border-t border-slate-200 pt-5">
      <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{comments.length} comment{comments.length === 1 ? "" : "s"}</h3>
      {comments.length ? <ol className="mt-3 space-y-3">{comments.map((comment) => <li className="rounded-xl border border-slate-200 bg-slate-50 p-4" key={comment.id}><p className="whitespace-pre-wrap text-sm leading-6 text-slate-800">{comment.body}</p><p className="mt-2 text-xs font-semibold text-slate-500">Project member · {new Intl.DateTimeFormat("en-ZM", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lusaka" }).format(new Date(comment.created_at))}</p></li>)}</ol> : <p className="mt-3 rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">No comments yet.</p>}
    </div>
  </div>;
}
