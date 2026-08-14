"use client";

import { CalendarCheck2, UserPlus } from "lucide-react";
import { useActionState } from "react";

import {
  createWorkerAction,
  recordAttendanceAction,
  type RecordActionState,
} from "@/app/actions/records";
import {
  ActionMessage,
  CommandFields,
  descriptionIds,
  inputClassName,
  RecordField,
  selectClassName,
  SubmitControl,
} from "@/components/forms/record-form";

const initialState: RecordActionState = { status: "idle" };

export function WorkerForm({ projectId, idempotencyKey }: { projectId: string; idempotencyKey: string }) {
  const [state, action, pending] = useActionState(createWorkerAction, initialState);
  return (
    <form action={action} className="space-y-5" noValidate>
      <CommandFields idempotencyKey={idempotencyKey} projectId={projectId} />
      <ActionMessage message={state.message} />
      <RecordField error={state.fieldErrors?.fullName?.[0]} hint="Use the name you recognize on site." id="worker-name" label="Full name" required>
        <input aria-describedby={descriptionIds("worker-name", state.fieldErrors?.fullName?.[0])} aria-invalid={Boolean(state.fieldErrors?.fullName)} autoComplete="name" className={inputClassName} disabled={pending} id="worker-name" maxLength={200} name="fullName" placeholder="Moses Banda" required />
      </RecordField>
      <div className="grid gap-4 sm:grid-cols-2">
        <RecordField error={state.fieldErrors?.trade?.[0]} hint="Optional role or skill." id="worker-trade" label="Trade">
          <input aria-describedby={descriptionIds("worker-trade", state.fieldErrors?.trade?.[0])} aria-invalid={Boolean(state.fieldErrors?.trade)} className={inputClassName} disabled={pending} id="worker-trade" maxLength={120} name="trade" placeholder="Bricklayer" />
        </RecordField>
        <RecordField error={state.fieldErrors?.phone?.[0]} hint="Optional contact number." id="worker-phone" label="Phone">
          <input aria-describedby={descriptionIds("worker-phone", state.fieldErrors?.phone?.[0])} aria-invalid={Boolean(state.fieldErrors?.phone)} autoComplete="tel" className={inputClassName} disabled={pending} id="worker-phone" maxLength={80} name="phone" placeholder="+260 96 000 0000" type="tel" />
        </RecordField>
      </div>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">Worker records and attendance are project-management notes only. No wage, payroll, tax, or statutory calculation is performed.</div>
      <SubmitControl icon={UserPlus} idleLabel="Add worker" pending={pending} pendingLabel="Adding worker…" />
    </form>
  );
}

export function AttendanceForm({
  projectId,
  idempotencyKey,
  workers,
  defaultDate,
}: {
  projectId: string;
  idempotencyKey: string;
  workers: { id: string; fullName: string }[];
  defaultDate: string;
}) {
  const [state, action, pending] = useActionState(recordAttendanceAction, initialState);
  return (
    <form action={action} className="space-y-5" noValidate>
      <CommandFields idempotencyKey={idempotencyKey} projectId={projectId} />
      <ActionMessage message={state.message} />
      <RecordField error={state.fieldErrors?.workerId?.[0]} hint="One record per worker per date." id="attendance-worker" label="Worker" required>
        <select aria-describedby={descriptionIds("attendance-worker", state.fieldErrors?.workerId?.[0])} aria-invalid={Boolean(state.fieldErrors?.workerId)} className={selectClassName} defaultValue="" disabled={pending} id="attendance-worker" name="workerId" required>
          <option disabled value="">Choose worker</option>
          {workers.map((worker) => <option key={worker.id} value={worker.id}>{worker.fullName}</option>)}
        </select>
      </RecordField>
      <div className="grid gap-4 sm:grid-cols-2">
        <RecordField error={state.fieldErrors?.attendanceDate?.[0]} hint="Lusaka project date." id="attendance-date" label="Date" required>
          <input aria-describedby={descriptionIds("attendance-date", state.fieldErrors?.attendanceDate?.[0])} aria-invalid={Boolean(state.fieldErrors?.attendanceDate)} className={inputClassName} defaultValue={defaultDate} disabled={pending} id="attendance-date" name="attendanceDate" required type="date" />
        </RecordField>
        <RecordField error={state.fieldErrors?.attendanceStatus?.[0]} hint="Use half day only as a site record." id="attendance-status" label="Status" required>
          <select aria-describedby={descriptionIds("attendance-status", state.fieldErrors?.attendanceStatus?.[0])} aria-invalid={Boolean(state.fieldErrors?.attendanceStatus)} className={selectClassName} defaultValue="present" disabled={pending} id="attendance-status" name="attendanceStatus" required>
            <option value="present">Present</option>
            <option value="half_day">Half day</option>
            <option value="absent">Absent</option>
          </select>
        </RecordField>
      </div>
      <RecordField error={state.fieldErrors?.notes?.[0]} hint="Optional work area or context." id="attendance-notes" label="Notes">
        <input aria-describedby={descriptionIds("attendance-notes", state.fieldErrors?.notes?.[0])} aria-invalid={Boolean(state.fieldErrors?.notes)} className={inputClassName} disabled={pending} id="attendance-notes" maxLength={1000} name="notes" placeholder="Foundation setting out" />
      </RecordField>
      <SubmitControl icon={CalendarCheck2} idleLabel="Record attendance" pending={pending} pendingLabel="Recording attendance…" />
    </form>
  );
}
