import { TABLE_NAMES } from "./constants";
import { readTableHeaders, rowToRecord } from "./tableUtils";
import type { ExpenseDocumentLink } from "../types/models";
import { readTableBodyValues } from "./tableRead";

function linkFromRecord(record: Record<string, string>): ExpenseDocumentLink {
  return {
    expenseId: record["Expense ID"],
    documentId: record["Document ID"],
    linkedAt: record["Linked At"]
  };
}

export async function listLinks(): Promise<ExpenseDocumentLink[]> {
  return Excel.run(async (context) => {
    const table = context.workbook.tables.getItem(TABLE_NAMES.links);
    const headers = await readTableHeaders(context, table);
    const values = await readTableBodyValues(context, table);
    return values.map((row) => linkFromRecord(rowToRecord(headers, row.map((cell) => String(cell ?? "")))));
  });
}

export function createUniqueLinks(
  existingLinks: readonly ExpenseDocumentLink[],
  expenseIds: readonly string[],
  documentId: string,
  linkedAt = new Date().toISOString()
): ExpenseDocumentLink[] {
  const seen = new Set(existingLinks.map((link) => `${link.expenseId}::${link.documentId}`));
  return Array.from(new Set(expenseIds))
    .filter((expenseId) => {
      const key = `${expenseId}::${documentId}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .map((expenseId) => ({ expenseId, documentId, linkedAt }));
}

export async function addLinks(links: readonly ExpenseDocumentLink[]): Promise<void> {
  if (links.length === 0) {
    return;
  }

  await Excel.run(async (context) => {
    const table = context.workbook.tables.getItem(TABLE_NAMES.links);
    table.rows.add(
      undefined,
      links.map((link) => [link.expenseId, link.documentId, link.linkedAt])
    );
    await context.sync();
  });
}

export async function linkExpensesToDocument(expenseIds: readonly string[], documentId: string): Promise<number> {
  const existingLinks = await listLinks();
  const links = createUniqueLinks(existingLinks, expenseIds, documentId);
  await addLinks(links);
  return links.length;
}

export async function unlinkExpenseDocument(expenseId: string, documentId: string): Promise<void> {
  await Excel.run(async (context) => {
    const table = context.workbook.tables.getItem(TABLE_NAMES.links);
    const values = await readTableBodyValues(context, table);

    for (let index = values.length - 1; index >= 0; index -= 1) {
      const row = values[index];
      if (String(row[0]) === expenseId && String(row[1]) === documentId) {
        table.rows.getItemAt(index).delete();
      }
    }
    await context.sync();
  });
}

export async function getDocumentIdsForExpense(expenseId: string): Promise<string[]> {
  const links = await listLinks();
  return links.filter((link) => link.expenseId === expenseId).map((link) => link.documentId);
}

export async function countDocumentsByExpense(): Promise<Map<string, number>> {
  const counts = new Map<string, Set<string>>();
  for (const link of await listLinks()) {
    const set = counts.get(link.expenseId) ?? new Set<string>();
    set.add(link.documentId);
    counts.set(link.expenseId, set);
  }
  return new Map(Array.from(counts.entries()).map(([expenseId, documentIds]) => [expenseId, documentIds.size]));
}
