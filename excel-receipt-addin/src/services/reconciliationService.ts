import type { Expense, ManagedDocument, ReconciliationSummary } from "../types/models";
import { formatMinorUnits, parseMoneyToMinorUnits } from "./money";

export function reconcileDocument(document: ManagedDocument, linkedExpenses: readonly Expense[]): ReconciliationSummary {
  const linkedTotal = linkedExpenses.reduce((sum, expense) => sum + parseMoneyToMinorUnits(expense.amount), 0n);

  if (!document.documentTotal) {
    return {
      documentId: document.documentId,
      linkedExpenseTotal: formatMinorUnits(linkedTotal)
    };
  }

  const documentTotal = parseMoneyToMinorUnits(document.documentTotal);
  const difference = documentTotal - linkedTotal;
  return {
    documentId: document.documentId,
    documentTotal: formatMinorUnits(documentTotal),
    linkedExpenseTotal: formatMinorUnits(linkedTotal),
    difference: formatMinorUnits(difference),
    isBalanced: difference === 0n
  };
}
