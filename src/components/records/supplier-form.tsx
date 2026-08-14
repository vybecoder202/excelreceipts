"use client";

import { Building2 } from "lucide-react";
import { useActionState } from "react";

import { createSupplierAction, type RecordActionState } from "@/app/actions/records";
import {
  ActionMessage,
  CommandFields,
  descriptionIds,
  inputClassName,
  RecordField,
  SubmitControl,
} from "@/components/forms/record-form";

const initialState: RecordActionState = { status: "idle" };

export function SupplierForm({ projectId, idempotencyKey }: { projectId: string; idempotencyKey: string }) {
  const [state, action, pending] = useActionState(createSupplierAction, initialState);
  return (
    <form action={action} className="space-y-5" noValidate>
      <CommandFields idempotencyKey={idempotencyKey} projectId={projectId} />
      <ActionMessage message={state.message} />
      <RecordField error={state.fieldErrors?.name?.[0]} hint="Use the trading name shown on quotations or receipts." id="supplier-name" label="Supplier name" required>
        <input aria-describedby={descriptionIds("supplier-name", state.fieldErrors?.name?.[0])} aria-invalid={Boolean(state.fieldErrors?.name)} className={inputClassName} disabled={pending} id="supplier-name" maxLength={200} name="name" placeholder="Lusaka Cement Supplies" required />
      </RecordField>
      <div className="grid gap-4 sm:grid-cols-2">
        <RecordField error={state.fieldErrors?.contactName?.[0]} hint="Optional primary person." id="supplier-contact" label="Contact name">
          <input aria-describedby={descriptionIds("supplier-contact", state.fieldErrors?.contactName?.[0])} aria-invalid={Boolean(state.fieldErrors?.contactName)} className={inputClassName} disabled={pending} id="supplier-contact" maxLength={200} name="contactName" placeholder="Chanda Mwila" />
        </RecordField>
        <RecordField error={state.fieldErrors?.phone?.[0]} hint="Optional; include country code when useful." id="supplier-phone" label="Phone">
          <input aria-describedby={descriptionIds("supplier-phone", state.fieldErrors?.phone?.[0])} aria-invalid={Boolean(state.fieldErrors?.phone)} autoComplete="tel" className={inputClassName} disabled={pending} id="supplier-phone" maxLength={80} name="phone" placeholder="+260 97 000 0000" type="tel" />
        </RecordField>
      </div>
      <RecordField error={state.fieldErrors?.email?.[0]} hint="Optional order or accounts email." id="supplier-email" label="Email">
        <input aria-describedby={descriptionIds("supplier-email", state.fieldErrors?.email?.[0])} aria-invalid={Boolean(state.fieldErrors?.email)} autoComplete="email" className={inputClassName} disabled={pending} id="supplier-email" maxLength={320} name="email" placeholder="orders@example.com" type="email" />
      </RecordField>
      <SubmitControl icon={Building2} idleLabel="Add supplier" pending={pending} pendingLabel="Adding supplier…" />
    </form>
  );
}
