"use client";

import { Landmark, ReceiptText } from "lucide-react";
import { useActionState } from "react";

import {
  createBudgetItemAction,
  createExpenseAction,
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

type Option = { id: string; name: string };

export function BudgetItemForm({
  projectId,
  idempotencyKey,
  phases,
}: {
  projectId: string;
  idempotencyKey: string;
  phases: Option[];
}) {
  const [state, action, pending] = useActionState(createBudgetItemAction, initialState);
  return (
    <form action={action} className="space-y-5" noValidate>
      <CommandFields idempotencyKey={idempotencyKey} projectId={projectId} />
      <ActionMessage message={state.message} />
      <div className="grid gap-4 sm:grid-cols-2">
        <RecordField error={state.fieldErrors?.categoryName?.[0]} hint="Examples: Substructure, Roofing, Electrical." id="budget-category" label="Category" required>
          <input aria-describedby={descriptionIds("budget-category", state.fieldErrors?.categoryName?.[0])} aria-invalid={Boolean(state.fieldErrors?.categoryName)} className={inputClassName} disabled={pending} id="budget-category" maxLength={120} name="categoryName" placeholder="Substructure" required />
        </RecordField>
        <RecordField error={state.fieldErrors?.phaseId?.[0]} hint="Optional link to the work breakdown." id="budget-phase" label="Construction phase">
          <select aria-describedby={descriptionIds("budget-phase", state.fieldErrors?.phaseId?.[0])} aria-invalid={Boolean(state.fieldErrors?.phaseId)} className={selectClassName} disabled={pending} id="budget-phase" name="phaseId" defaultValue="">
            <option value="">No phase selected</option>
            {phases.map((phase) => <option key={phase.id} value={phase.id}>{phase.name}</option>)}
          </select>
        </RecordField>
      </div>
      <RecordField error={state.fieldErrors?.description?.[0]} hint="Name the planned package, material, or service." id="budget-description" label="Budget item" required>
        <input aria-describedby={descriptionIds("budget-description", state.fieldErrors?.description?.[0])} aria-invalid={Boolean(state.fieldErrors?.description)} className={inputClassName} disabled={pending} id="budget-description" maxLength={240} name="description" placeholder="Foundation concrete and reinforcement" required />
      </RecordField>
      <div className="grid gap-4 sm:grid-cols-2">
        <RecordField error={state.fieldErrors?.originalAmount?.[0]} hint="The first approved amount in ZMW." id="budget-original" label="Original budget (ZMW)" required>
          <input aria-describedby={descriptionIds("budget-original", state.fieldErrors?.originalAmount?.[0])} aria-invalid={Boolean(state.fieldErrors?.originalAmount)} className={inputClassName} disabled={pending} id="budget-original" inputMode="decimal" min="0" name="originalAmount" placeholder="50000.00" required step="0.01" type="number" />
        </RecordField>
        <RecordField error={state.fieldErrors?.forecastAmount?.[0]} hint="Your current expected final cost." id="budget-forecast" label="Forecast cost (ZMW)" required>
          <input aria-describedby={descriptionIds("budget-forecast", state.fieldErrors?.forecastAmount?.[0])} aria-invalid={Boolean(state.fieldErrors?.forecastAmount)} className={inputClassName} disabled={pending} id="budget-forecast" inputMode="decimal" min="0" name="forecastAmount" placeholder="55000.00" required step="0.01" type="number" />
        </RecordField>
      </div>
      <SubmitControl icon={Landmark} idleLabel="Add budget item" pending={pending} pendingLabel="Adding budget…" />
    </form>
  );
}

export function ExpenseForm({
  projectId,
  idempotencyKey,
  categories,
  phases,
  suppliers,
  defaultDate,
}: {
  projectId: string;
  idempotencyKey: string;
  categories: Option[];
  phases: Option[];
  suppliers: Option[];
  defaultDate: string;
}) {
  const [state, action, pending] = useActionState(createExpenseAction, initialState);
  return (
    <form action={action} className="space-y-5" noValidate>
      <CommandFields idempotencyKey={idempotencyKey} projectId={projectId} />
      <ActionMessage message={state.message} />
      <div className="grid gap-4 sm:grid-cols-2">
        <RecordField error={state.fieldErrors?.expenseDate?.[0]} hint="Use the receipt or transaction date." id="expense-date" label="Expense date" required>
          <input aria-describedby={descriptionIds("expense-date", state.fieldErrors?.expenseDate?.[0])} aria-invalid={Boolean(state.fieldErrors?.expenseDate)} className={inputClassName} defaultValue={defaultDate} disabled={pending} id="expense-date" name="expenseDate" required type="date" />
        </RecordField>
        <RecordField error={state.fieldErrors?.amount?.[0]} hint="Posted as actual cost, not a payment." id="expense-amount" label="Amount (ZMW)" required>
          <input aria-describedby={descriptionIds("expense-amount", state.fieldErrors?.amount?.[0])} aria-invalid={Boolean(state.fieldErrors?.amount)} className={inputClassName} disabled={pending} id="expense-amount" inputMode="decimal" min="0.01" name="amount" placeholder="3500.00" required step="0.01" type="number" />
        </RecordField>
      </div>
      <RecordField error={state.fieldErrors?.description?.[0]} hint="Describe the direct cost clearly enough to recognize it later." id="expense-description" label="Description" required>
        <input aria-describedby={descriptionIds("expense-description", state.fieldErrors?.description?.[0])} aria-invalid={Boolean(state.fieldErrors?.description)} className={inputClassName} disabled={pending} id="expense-description" maxLength={500} name="description" placeholder="Site clearing deposit" required />
      </RecordField>
      <div className="grid gap-4 sm:grid-cols-3">
        <RecordField error={state.fieldErrors?.categoryId?.[0]} hint="Required for budget reporting." id="expense-category" label="Budget category" required>
          <select aria-describedby={descriptionIds("expense-category", state.fieldErrors?.categoryId?.[0])} aria-invalid={Boolean(state.fieldErrors?.categoryId)} className={selectClassName} defaultValue="" disabled={pending} id="expense-category" name="categoryId" required>
            <option disabled value="">Choose category</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </RecordField>
        <RecordField error={state.fieldErrors?.phaseId?.[0]} hint="Optional." id="expense-phase" label="Phase">
          <select aria-describedby={descriptionIds("expense-phase", state.fieldErrors?.phaseId?.[0])} aria-invalid={Boolean(state.fieldErrors?.phaseId)} className={selectClassName} defaultValue="" disabled={pending} id="expense-phase" name="phaseId">
            <option value="">No phase</option>
            {phases.map((phase) => <option key={phase.id} value={phase.id}>{phase.name}</option>)}
          </select>
        </RecordField>
        <RecordField error={state.fieldErrors?.supplierId?.[0]} hint="Optional." id="expense-supplier" label="Supplier">
          <select aria-describedby={descriptionIds("expense-supplier", state.fieldErrors?.supplierId?.[0])} aria-invalid={Boolean(state.fieldErrors?.supplierId)} className={selectClassName} defaultValue="" disabled={pending} id="expense-supplier" name="supplierId">
            <option value="">No supplier</option>
            {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
          </select>
        </RecordField>
      </div>
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">
        Posting this expense increases actual cost only. It does not record cash payment and cannot increase inventory.
      </div>
      <SubmitControl icon={ReceiptText} idleLabel="Post expense" pending={pending} pendingLabel="Posting expense…" />
    </form>
  );
}
