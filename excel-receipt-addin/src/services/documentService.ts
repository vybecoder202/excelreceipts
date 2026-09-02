import { addDocument, findDocumentByHash, listDocuments } from "../excel/documentRepository";
import { countDocumentsByExpense, getDocumentIdsForExpense, linkExpensesToDocument, listLinks, unlinkExpenseDocument } from "../excel/linkRepository";
import { getSelectedExpenses, updateDocumentDisplay } from "../excel/expenseRepository";
import { initializeWorkbook } from "../excel/workbookSetup";
import { sha256File } from "./hashingService";
import { nextDocumentId } from "./idService";
import type { ManagedDocument, Expense } from "../types/models";
import type { StorageProvider } from "../storage/StorageProvider";

export type DuplicateChoice = "link-existing" | "continue-new" | "cancel";

export interface AttachResult {
  document: ManagedDocument;
  expenses: Expense[];
  linkedCount: number;
  duplicateOf?: ManagedDocument;
}

export interface SelectionSummary {
  expenses: Expense[];
  documents: ManagedDocument[];
}

export async function getSelectionSummary(options: { updateWorksheetDisplay?: boolean } = {}): Promise<SelectionSummary> {
  await initializeWorkbook();
  const expenses = await getSelectedExpenses();
  const documents = await listDocuments();
  if (options.updateWorksheetDisplay ?? true) {
    await refreshWorkbookDocumentDisplay(documents);
  }
  const selectedIds = new Set(expenses.map((expense) => expense.expenseId));
  const linkedDocumentIds = new Set<string>();

  for (const expense of expenses) {
    for (const documentId of await getDocumentIdsForExpense(expense.expenseId)) {
      linkedDocumentIds.add(documentId);
    }
  }

  return {
    expenses,
    documents: documents.filter((document) => linkedDocumentIds.has(document.documentId) || selectedIds.size === 0)
  };
}

async function refreshWorkbookDocumentDisplay(knownDocuments?: ManagedDocument[]): Promise<void> {
  const documents = knownDocuments ?? (await listDocuments());
  const links = await listLinks();
  const documentsById = new Map(documents.map((document) => [document.documentId, document]));
  const documentIdsByExpense = new Map<string, string[]>();

  for (const link of links) {
    const ids = documentIdsByExpense.get(link.expenseId) ?? [];
    if (!ids.includes(link.documentId)) {
      ids.push(link.documentId);
    }
    documentIdsByExpense.set(link.expenseId, ids);
  }

  await updateDocumentDisplay(await countDocumentsByExpense(), documentIdsByExpense, documentsById);
}

export async function attachFileToSelectedExpenses(
  file: File,
  storageProvider: StorageProvider,
  duplicateChoice: (existing: ManagedDocument) => Promise<DuplicateChoice>
): Promise<AttachResult | undefined> {
  await initializeWorkbook();
  const expenses = await getSelectedExpenses();
  if (expenses.length === 0) {
    throw new Error("Select at least one expense row.");
  }

  const hash = await sha256File(file);
  const duplicate = await findDocumentByHash(hash);
  if (duplicate) {
    const choice = await duplicateChoice(duplicate);
    if (choice === "cancel") {
      return undefined;
    }
    if (choice === "link-existing") {
      const linkedCount = await linkExpensesToDocument(
        expenses.map((expense) => expense.expenseId),
        duplicate.documentId
      );
      await refreshWorkbookDocumentDisplay();
      return { document: duplicate, expenses, linkedCount, duplicateOf: duplicate };
    }
  }

  const existingIds = (await listDocuments()).map((document) => document.documentId);
  const documentId = nextDocumentId(existingIds);
  const firstExpense = expenses[0];
  const stored = await storageProvider.saveFile(file, documentId, { expenseDate: firstExpense.date });
  const document: ManagedDocument = {
    documentId,
    fileName: stored.fileName,
    originalFileName: file.name,
    fileType: stored.fileType,
    storageKey: stored.storageKey,
    storageUrl: stored.storageUrl,
    storageProvider: stored.provider ?? storageProvider.name,
    sha256: hash,
    supplier: firstExpense.supplier,
    documentDate: firstExpense.date,
    createdAt: new Date().toISOString()
  };

  await addDocument(document);
  const linkedCount = await linkExpensesToDocument(
    expenses.map((expense) => expense.expenseId),
    document.documentId
  );
  await refreshWorkbookDocumentDisplay();
  return { document, expenses, linkedCount };
}

export async function markSelectedExpensesAsCash(): Promise<AttachResult> {
  await initializeWorkbook();
  const expenses = await getSelectedExpenses();
  if (expenses.length === 0) {
    throw new Error("Select at least one expense row.");
  }

  const existingIds = (await listDocuments()).map((document) => document.documentId);
  const documentId = nextDocumentId(existingIds);
  const firstExpense = expenses[0];
  const document: ManagedDocument = {
    documentId,
    fileName: documentId,
    originalFileName: "Cash / No receipt",
    fileType: "cash/no-receipt",
    storageKey: `cash:${documentId}`,
    storageProvider: "Cash / No Receipt",
    supplier: firstExpense.supplier,
    documentDate: firstExpense.date,
    createdAt: new Date().toISOString(),
    notes: "Payment was marked as cash/no receipt in the Excel add-in."
  };

  await addDocument(document);
  const linkedCount = await linkExpensesToDocument(
    expenses.map((expense) => expense.expenseId),
    document.documentId
  );
  await refreshWorkbookDocumentDisplay();
  return { document, expenses, linkedCount };
}

export async function linkExistingDocumentToSelectedExpenses(documentId: string): Promise<number> {
  await initializeWorkbook();
  const expenses = await getSelectedExpenses();
  const count = await linkExpensesToDocument(
    expenses.map((expense) => expense.expenseId),
    documentId
  );
  await refreshWorkbookDocumentDisplay();
  return count;
}

export async function unlinkDocumentFromExpense(expenseId: string, documentId: string): Promise<void> {
  await unlinkExpenseDocument(expenseId, documentId);
  await refreshWorkbookDocumentDisplay();
}
