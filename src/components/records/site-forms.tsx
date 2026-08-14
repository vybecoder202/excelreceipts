"use client";

import { ListPlus, NotebookPen, TrendingUp } from "lucide-react";
import { useActionState } from "react";

import {
  createDailyLogAction,
  createTaskAction,
  type RecordActionState,
  updateTaskProgressAction,
} from "@/app/actions/records";
import {
  ActionMessage,
  CommandFields,
  descriptionIds,
  inputClassName,
  RecordField,
  selectClassName,
  SubmitControl,
  textareaClassName,
} from "@/components/forms/record-form";

const initialState: RecordActionState = { status: "idle" };

export function TaskForm({
  projectId,
  idempotencyKey,
  phases,
}: {
  projectId: string;
  idempotencyKey: string;
  phases: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(createTaskAction, initialState);
  return (
    <form action={action} className="space-y-5" noValidate>
      <CommandFields idempotencyKey={idempotencyKey} projectId={projectId} />
      <ActionMessage message={state.message} />
      <RecordField error={state.fieldErrors?.title?.[0]} hint="Use a specific result or activity." id="task-title" label="Task title" required>
        <input aria-describedby={descriptionIds("task-title", state.fieldErrors?.title?.[0])} aria-invalid={Boolean(state.fieldErrors?.title)} className={inputClassName} disabled={pending} id="task-title" maxLength={240} name="title" placeholder="Excavate foundation trenches" required />
      </RecordField>
      <RecordField error={state.fieldErrors?.description?.[0]} hint="Optional scope, quality, or handoff notes." id="task-description" label="Description">
        <textarea aria-describedby={descriptionIds("task-description", state.fieldErrors?.description?.[0])} aria-invalid={Boolean(state.fieldErrors?.description)} className={textareaClassName} disabled={pending} id="task-description" maxLength={8000} name="description" placeholder="Set out and excavate to the approved dimensions." />
      </RecordField>
      <div className="grid gap-4 sm:grid-cols-2">
        <RecordField error={state.fieldErrors?.phaseId?.[0]} hint="Optional, but useful for progress grouping." id="task-phase" label="Phase">
          <select aria-describedby={descriptionIds("task-phase", state.fieldErrors?.phaseId?.[0])} aria-invalid={Boolean(state.fieldErrors?.phaseId)} className={selectClassName} defaultValue="" disabled={pending} id="task-phase" name="phaseId">
            <option value="">No phase</option>
            {phases.map((phase) => <option key={phase.id} value={phase.id}>{phase.name}</option>)}
          </select>
        </RecordField>
        <RecordField error={state.fieldErrors?.priority?.[0]} hint="Use critical only for work that needs immediate attention." id="task-priority" label="Priority" required>
          <select aria-describedby={descriptionIds("task-priority", state.fieldErrors?.priority?.[0])} aria-invalid={Boolean(state.fieldErrors?.priority)} className={selectClassName} defaultValue="normal" disabled={pending} id="task-priority" name="priority" required>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </RecordField>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <RecordField error={state.fieldErrors?.plannedStart?.[0]} hint="Optional." id="task-start" label="Planned start">
          <input aria-describedby={descriptionIds("task-start", state.fieldErrors?.plannedStart?.[0])} aria-invalid={Boolean(state.fieldErrors?.plannedStart)} className={inputClassName} disabled={pending} id="task-start" name="plannedStart" type="date" />
        </RecordField>
        <RecordField error={state.fieldErrors?.plannedEnd?.[0]} hint="Optional." id="task-end" label="Planned end">
          <input aria-describedby={descriptionIds("task-end", state.fieldErrors?.plannedEnd?.[0])} aria-invalid={Boolean(state.fieldErrors?.plannedEnd)} className={inputClassName} disabled={pending} id="task-end" name="plannedEnd" type="date" />
        </RecordField>
        <RecordField error={state.fieldErrors?.progressWeight?.[0]} hint="Relative contribution to overall progress." id="task-weight" label="Progress weight" required>
          <input aria-describedby={descriptionIds("task-weight", state.fieldErrors?.progressWeight?.[0])} aria-invalid={Boolean(state.fieldErrors?.progressWeight)} className={inputClassName} defaultValue="1" disabled={pending} id="task-weight" min="0.0001" name="progressWeight" required step="0.0001" type="number" />
        </RecordField>
      </div>
      <SubmitControl icon={ListPlus} idleLabel="Create task" pending={pending} pendingLabel="Creating task…" />
    </form>
  );
}

export function DailyLogForm({ projectId, idempotencyKey, defaultDate }: { projectId: string; idempotencyKey: string; defaultDate: string }) {
  const [state, action, pending] = useActionState(createDailyLogAction, initialState);
  return (
    <form action={action} className="space-y-5" noValidate>
      <CommandFields idempotencyKey={idempotencyKey} projectId={projectId} />
      <ActionMessage message={state.message} />
      <div className="grid gap-4 sm:grid-cols-2">
        <RecordField error={state.fieldErrors?.logDate?.[0]} hint="One log per project date." id="daily-log-date" label="Log date" required>
          <input aria-describedby={descriptionIds("daily-log-date", state.fieldErrors?.logDate?.[0])} aria-invalid={Boolean(state.fieldErrors?.logDate)} className={inputClassName} defaultValue={defaultDate} disabled={pending} id="daily-log-date" name="logDate" required type="date" />
        </RecordField>
        <RecordField error={state.fieldErrors?.workersPresent?.[0]} hint="A simple headcount, not payroll." id="daily-log-workers" label="Workers present" required>
          <input aria-describedby={descriptionIds("daily-log-workers", state.fieldErrors?.workersPresent?.[0])} aria-invalid={Boolean(state.fieldErrors?.workersPresent)} className={inputClassName} defaultValue="0" disabled={pending} id="daily-log-workers" inputMode="numeric" min="0" name="workersPresent" required step="1" type="number" />
        </RecordField>
      </div>
      <RecordField error={state.fieldErrors?.workCompleted?.[0]} hint="Record observable work, quantities, or areas completed." id="daily-log-work" label="Work completed" required>
        <textarea aria-describedby={descriptionIds("daily-log-work", state.fieldErrors?.workCompleted?.[0])} aria-invalid={Boolean(state.fieldErrors?.workCompleted)} className={textareaClassName} disabled={pending} id="daily-log-work" maxLength={8000} name="workCompleted" placeholder="Set out foundation trenches and cleared loose soil." required />
      </RecordField>
      <div className="grid gap-4 sm:grid-cols-2">
        <RecordField error={state.fieldErrors?.weatherNotes?.[0]} hint="User-entered site observation." id="daily-log-weather" label="Weather notes">
          <textarea aria-describedby={descriptionIds("daily-log-weather", state.fieldErrors?.weatherNotes?.[0])} aria-invalid={Boolean(state.fieldErrors?.weatherNotes)} className={textareaClassName} disabled={pending} id="daily-log-weather" maxLength={2000} name="weatherNotes" placeholder="Dry and sunny" />
        </RecordField>
        <RecordField error={state.fieldErrors?.delaysOrIssues?.[0]} hint="Optional blockers, incidents, or follow-up." id="daily-log-delays" label="Delays or issues">
          <textarea aria-describedby={descriptionIds("daily-log-delays", state.fieldErrors?.delaysOrIssues?.[0])} aria-invalid={Boolean(state.fieldErrors?.delaysOrIssues)} className={textareaClassName} disabled={pending} id="daily-log-delays" maxLength={4000} name="delaysOrIssues" placeholder="No delays" />
        </RecordField>
      </div>
      <SubmitControl icon={NotebookPen} idleLabel="Save daily log" pending={pending} pendingLabel="Saving daily log…" />
    </form>
  );
}

const allowedStatuses: Record<string, { value: string; label: string }[]> = {
  not_started: [
    { value: "not_started", label: "Not started" },
    { value: "in_progress", label: "In progress" },
    { value: "blocked", label: "Blocked" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ],
  in_progress: [
    { value: "in_progress", label: "In progress" },
    { value: "blocked", label: "Blocked" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ],
  blocked: [
    { value: "blocked", label: "Blocked" },
    { value: "in_progress", label: "In progress" },
    { value: "cancelled", label: "Cancelled" },
  ],
  completed: [{ value: "completed", label: "Completed" }],
  cancelled: [{ value: "cancelled", label: "Cancelled" }],
};

export function TaskProgressForm({
  projectId,
  idempotencyKey,
  taskId,
  currentStatus,
  currentPercent,
  defaultDate,
}: {
  projectId: string;
  idempotencyKey: string;
  taskId: string;
  currentStatus: string;
  currentPercent: number;
  defaultDate: string;
}) {
  const [state, action, pending] = useActionState(updateTaskProgressAction, initialState);
  const prefix = `task-progress-${taskId}`;
  return (
    <form action={action} className="space-y-4" noValidate>
      <CommandFields idempotencyKey={idempotencyKey} projectId={projectId} />
      <input name="taskId" type="hidden" value={taskId} />
      <ActionMessage message={state.message} />
      <div className="grid gap-4 sm:grid-cols-3">
        <RecordField error={state.fieldErrors?.status?.[0]} hint="Only valid next states are shown." id={`${prefix}-status`} label="Status" required>
          <select aria-describedby={descriptionIds(`${prefix}-status`, state.fieldErrors?.status?.[0])} aria-invalid={Boolean(state.fieldErrors?.status)} className={selectClassName} defaultValue={currentStatus} disabled={pending} id={`${prefix}-status`} name="status" required>
            {(allowedStatuses[currentStatus] ?? allowedStatuses.not_started ?? []).map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
          </select>
        </RecordField>
        <RecordField error={state.fieldErrors?.percentComplete?.[0]} hint="0 to 100; completed must be 100." id={`${prefix}-percent`} label="Complete (%)" required>
          <input aria-describedby={descriptionIds(`${prefix}-percent`, state.fieldErrors?.percentComplete?.[0])} aria-invalid={Boolean(state.fieldErrors?.percentComplete)} className={inputClassName} defaultValue={currentPercent} disabled={pending} id={`${prefix}-percent`} max="100" min="0" name="percentComplete" required step="0.01" type="number" />
        </RecordField>
        <RecordField error={state.fieldErrors?.updateDate?.[0]} hint="Lusaka project date." id={`${prefix}-date`} label="Update date" required>
          <input aria-describedby={descriptionIds(`${prefix}-date`, state.fieldErrors?.updateDate?.[0])} aria-invalid={Boolean(state.fieldErrors?.updateDate)} className={inputClassName} defaultValue={defaultDate} disabled={pending} id={`${prefix}-date`} name="updateDate" required type="date" />
        </RecordField>
      </div>
      <RecordField error={state.fieldErrors?.summary?.[0]} hint="Briefly describe the work behind this percentage." id={`${prefix}-summary`} label="Progress note" required>
        <textarea aria-describedby={descriptionIds(`${prefix}-summary`, state.fieldErrors?.summary?.[0])} aria-invalid={Boolean(state.fieldErrors?.summary)} className={textareaClassName} disabled={pending} id={`${prefix}-summary`} maxLength={8000} name="summary" placeholder="Eastern trench excavation completed." required />
      </RecordField>
      <SubmitControl className="w-full sm:w-auto" icon={TrendingUp} idleLabel="Save progress" pending={pending} pendingLabel="Saving progress…" />
    </form>
  );
}
