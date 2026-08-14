"use client";

import { MapPinned, PackagePlus } from "lucide-react";
import { useActionState } from "react";

import {
  createMaterialAction,
  createStockLocationAction,
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
  textareaClassName,
} from "@/components/forms/record-form";

const initialState: RecordActionState = { status: "idle" };

export function MaterialForm({ projectId, idempotencyKey, units }: { projectId: string; idempotencyKey: string; units: { code: string; name: string }[] }) {
  const [state, action, pending] = useActionState(createMaterialAction, initialState);
  return (
    <form action={action} className="space-y-5" noValidate>
      <CommandFields idempotencyKey={idempotencyKey} projectId={projectId} />
      <ActionMessage message={state.message} />
      <RecordField error={state.fieldErrors?.name?.[0]} hint="Use a specific description and pack size." id="material-name" label="Material name" required>
        <input aria-describedby={descriptionIds("material-name", state.fieldErrors?.name?.[0])} aria-invalid={Boolean(state.fieldErrors?.name)} className={inputClassName} disabled={pending} id="material-name" maxLength={200} name="name" placeholder="Cement 50 kg" required />
      </RecordField>
      <div className="grid gap-4 sm:grid-cols-3">
        <RecordField error={state.fieldErrors?.category?.[0]} hint="Optional grouping." id="material-category" label="Category">
          <input aria-describedby={descriptionIds("material-category", state.fieldErrors?.category?.[0])} aria-invalid={Boolean(state.fieldErrors?.category)} className={inputClassName} disabled={pending} id="material-category" maxLength={120} name="category" placeholder="Cement and binders" />
        </RecordField>
        <RecordField error={state.fieldErrors?.unitCode?.[0]} hint="How stock will be counted." id="material-unit" label="Unit" required>
          <select aria-describedby={descriptionIds("material-unit", state.fieldErrors?.unitCode?.[0])} aria-invalid={Boolean(state.fieldErrors?.unitCode)} className={selectClassName} defaultValue="" disabled={pending} id="material-unit" name="unitCode" required>
            <option disabled value="">Choose unit</option>
            {units.map((unit) => <option key={unit.code} value={unit.code}>{unit.name}</option>)}
          </select>
        </RecordField>
        <RecordField error={state.fieldErrors?.reorderLevel?.[0]} hint="Planning threshold, not current stock." id="material-reorder" label="Reorder level" required>
          <input aria-describedby={descriptionIds("material-reorder", state.fieldErrors?.reorderLevel?.[0])} aria-invalid={Boolean(state.fieldErrors?.reorderLevel)} className={inputClassName} defaultValue="0" disabled={pending} id="material-reorder" inputMode="decimal" min="0" name="reorderLevel" required step="0.0001" type="number" />
        </RecordField>
      </div>
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm leading-6 text-blue-950">This creates a catalogue item only. Stock stays at zero until a confirmed goods receipt posts an inventory movement.</div>
      <SubmitControl icon={PackagePlus} idleLabel="Add material" pending={pending} pendingLabel="Adding material…" />
    </form>
  );
}

export function StockLocationForm({ projectId, idempotencyKey }: { projectId: string; idempotencyKey: string }) {
  const [state, action, pending] = useActionState(createStockLocationAction, initialState);
  return (
    <form action={action} className="space-y-5" noValidate>
      <CommandFields idempotencyKey={idempotencyKey} projectId={projectId} />
      <ActionMessage message={state.message} />
      <RecordField error={state.fieldErrors?.name?.[0]} hint="A physical area where materials will be held." id="location-name" label="Location name" required>
        <input aria-describedby={descriptionIds("location-name", state.fieldErrors?.name?.[0])} aria-invalid={Boolean(state.fieldErrors?.name)} className={inputClassName} disabled={pending} id="location-name" maxLength={160} name="name" placeholder="Main site store" required />
      </RecordField>
      <RecordField error={state.fieldErrors?.description?.[0]} hint="Optional access or position notes." id="location-description" label="Description">
        <textarea aria-describedby={descriptionIds("location-description", state.fieldErrors?.description?.[0])} aria-invalid={Boolean(state.fieldErrors?.description)} className={textareaClassName} disabled={pending} id="location-description" maxLength={1000} name="description" placeholder="Locked container near the entrance" />
      </RecordField>
      <SubmitControl icon={MapPinned} idleLabel="Add stock location" pending={pending} pendingLabel="Adding location…" />
    </form>
  );
}
