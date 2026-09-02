import { DEFAULT_EXPENSE_COLUMNS } from "./constants";
import { getSettingsInContext } from "./settingsRepository";
import { readTableHeaders, requireColumn } from "./tableUtils";
import { nextExpenseId } from "../services/idService";
import type { Expense, ManagedDocument, WorkbookSettings } from "../types/models";

type CellValue = string | number | boolean;

interface SelectedExpenseContext {
  mode: "table" | "range";
  worksheetName: string;
  headers: string[];
  values: CellValue[][];
  texts: string[][];
  bodyStartRow: number;
  selectedRowOffsets: number[];
  settings: WorkbookSettings;
  table?: Excel.Table;
  bodyRange?: Excel.Range;
}

function pickColumn(settingsValue: string | undefined, fallback: string): string {
  return settingsValue?.trim() || fallback;
}

function parsePositiveRow(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeHeader(value: CellValue | null | undefined): string {
  return String(value ?? "").trim();
}

async function resolveSelectedTable(
  context: Excel.RequestContext,
  settings: WorkbookSettings,
  selectedRange: Excel.Range,
  worksheet: Excel.Worksheet
): Promise<SelectedExpenseContext> {
  let table: Excel.Table;
  if (settings.expenseTable) {
    const configuredTable = context.workbook.tables.getItemOrNullObject(settings.expenseTable);
    configuredTable.load("name");
    await context.sync();
    if (configuredTable.isNullObject) {
      throw new Error(
        `Configured expense table "${settings.expenseTable}" does not exist. In Settings, clear Expense table to use range mode or enter the exact Excel table name.`
      );
    }
    table = configuredTable;
  } else {
    const tables = worksheet.tables.load("items/name");
    await context.sync();
    if (tables.items.length === 0) {
      throw new Error("No Excel table was found. Leave Expense table blank to use worksheet range mode.");
    }
    table = tables.items[0];
  }

  const tableRange = table.getRange().load(["rowIndex", "rowCount"]);
  const bodyRange = table.getDataBodyRange().load(["rowIndex", "values", "text"]);
  await context.sync();

  const headers = await readTableHeaders(context, table);
  const selectionStart = selectedRange.rowIndex;
  const selectionEnd = selectedRange.rowIndex + selectedRange.rowCount - 1;
  const bodyStart = bodyRange.rowIndex;
  const bodyEnd = tableRange.rowIndex + tableRange.rowCount - 1;
  const firstRow = Math.max(selectionStart, bodyStart);
  const lastRow = Math.min(selectionEnd, bodyEnd);

  if (firstRow > lastRow) {
    throw new Error("Select one or more rows inside the expense table.");
  }

  return {
    mode: "table",
    table,
    worksheetName: worksheet.name,
    headers,
    values: bodyRange.values,
    texts: bodyRange.text,
    bodyStartRow: bodyStart,
    selectedRowOffsets: Array.from({ length: lastRow - firstRow + 1 }, (_, index) => firstRow + index - bodyStart),
    settings
  };
}

async function resolveSelectedRange(
  context: Excel.RequestContext,
  settings: WorkbookSettings,
  selectedRange: Excel.Range,
  worksheet: Excel.Worksheet
): Promise<SelectedExpenseContext> {
  const headerRowNumber = parsePositiveRow(settings.headerRow, 1);
  const firstDataRowNumber = parsePositiveRow(settings.firstDataRow, headerRowNumber + 1);
  const usedRange = worksheet.getUsedRangeOrNullObject().load(["rowIndex", "rowCount", "columnIndex", "columnCount"]);
  await context.sync();

  if (usedRange.isNullObject) {
    throw new Error("The selected worksheet is empty.");
  }

  const headerRowIndex = headerRowNumber - 1;
  const firstDataRowIndex = firstDataRowNumber - 1;
  const usedLastRowIndex = usedRange.rowIndex + usedRange.rowCount - 1;
  const configuredLastDataRowIndex = settings.lastDataRow ? parsePositiveRow(settings.lastDataRow, usedLastRowIndex + 1) - 1 : usedLastRowIndex;
  const lastDataRowIndex = Math.min(configuredLastDataRowIndex, usedLastRowIndex);

  if (headerRowIndex < usedRange.rowIndex || headerRowIndex > usedLastRowIndex) {
    throw new Error(`Header row ${headerRowNumber} is outside the used worksheet area.`);
  }

  if (firstDataRowIndex > lastDataRowIndex) {
    throw new Error("First data row is after the last data row.");
  }

  const headerRange = worksheet
    .getRangeByIndexes(headerRowIndex, usedRange.columnIndex, 1, usedRange.columnCount)
    .load("values");
  const bodyRange = worksheet
    .getRangeByIndexes(firstDataRowIndex, usedRange.columnIndex, lastDataRowIndex - firstDataRowIndex + 1, usedRange.columnCount)
    .load(["values", "text", "rowIndex"]);
  await context.sync();

  const selectionStart = selectedRange.rowIndex;
  const selectionEnd = selectedRange.rowIndex + selectedRange.rowCount - 1;
  const firstSelectedDataRow = Math.max(selectionStart, firstDataRowIndex);
  const lastSelectedDataRow = Math.min(selectionEnd, lastDataRowIndex);

  if (firstSelectedDataRow > lastSelectedDataRow) {
    throw new Error(`Select one or more expense rows below header row ${headerRowNumber}.`);
  }

  return {
    mode: "range",
    bodyRange,
    worksheetName: worksheet.name,
    headers: headerRange.values[0].map(normalizeHeader),
    values: bodyRange.values,
    texts: bodyRange.text,
    bodyStartRow: bodyRange.rowIndex,
    selectedRowOffsets: Array.from(
      { length: lastSelectedDataRow - firstSelectedDataRow + 1 },
      (_, index) => firstSelectedDataRow + index - bodyRange.rowIndex
    ),
    settings
  };
}

async function resolveSelectedExpensesContext(context: Excel.RequestContext): Promise<SelectedExpenseContext> {
  const settings = await getSettingsInContext(context);
  const selectedRange = context.workbook.getSelectedRange().load(["rowIndex", "rowCount"]);
  const worksheet = settings.expenseWorksheet
    ? context.workbook.worksheets.getItemOrNullObject(settings.expenseWorksheet).load("name")
    : context.workbook.worksheets.getActiveWorksheet().load("name");
  await context.sync();

  if (worksheet.isNullObject) {
    throw new Error(
      `Configured expense worksheet "${settings.expenseWorksheet}" does not exist. In Settings, clear Expense worksheet to use the active sheet or enter the exact sheet tab name.`
    );
  }

  return settings.expenseTable?.trim()
    ? resolveSelectedTable(context, settings, selectedRange, worksheet)
    : resolveSelectedRange(context, settings, selectedRange, worksheet);
}

function writeExpenseId(selected: SelectedExpenseContext, rowOffset: number, idIndex: number, expenseId: string): void {
  if (selected.mode === "table" && selected.table) {
    selected.table.getDataBodyRange().getCell(rowOffset, idIndex).values = [[expenseId]];
    return;
  }
  if (!selected.bodyRange) {
    throw new Error("Expense range could not be resolved.");
  }
  selected.bodyRange.getCell(rowOffset, idIndex).values = [[expenseId]];
}

export async function getSelectedExpenses(): Promise<Expense[]> {
  return Excel.run(async (context) => {
    const selected = await resolveSelectedExpensesContext(context);
    const expenseIdColumn = pickColumn(selected.settings.expenseIdColumn, DEFAULT_EXPENSE_COLUMNS.expenseId);
    const dateColumn = pickColumn(selected.settings.dateColumn, DEFAULT_EXPENSE_COLUMNS.date);
    const itemColumn = pickColumn(selected.settings.itemColumn, DEFAULT_EXPENSE_COLUMNS.item);
    const supplierColumn = pickColumn(selected.settings.supplierColumn, DEFAULT_EXPENSE_COLUMNS.supplier);
    const descriptionColumn = pickColumn(selected.settings.descriptionColumn, DEFAULT_EXPENSE_COLUMNS.description);
    const amountColumn = pickColumn(selected.settings.amountColumn, DEFAULT_EXPENSE_COLUMNS.amount);

    const idIndex = requireColumn(selected.headers, expenseIdColumn);
    const dateIndex = selected.headers.indexOf(dateColumn);
    const itemIndex = selected.headers.indexOf(itemColumn);
    const supplierIndex = selected.headers.indexOf(supplierColumn);
    const descriptionIndex = selected.headers.indexOf(descriptionColumn);
    const amountIndex = selected.headers.indexOf(amountColumn);
    const existingIds = selected.values.map((row) => String(row[idIndex] ?? "")).filter(Boolean);

    const expenses: Expense[] = [];
    for (const rowOffset of selected.selectedRowOffsets) {
      const row = selected.values[rowOffset];
      const textRow = selected.texts[rowOffset] ?? [];
      let expenseId = String(row[idIndex] ?? "").trim();
      if (!expenseId) {
        expenseId = nextExpenseId(existingIds);
        existingIds.push(expenseId);
        writeExpenseId(selected, rowOffset, idIndex, expenseId);
      }

      expenses.push({
        expenseId,
        worksheet: selected.worksheetName,
        tableName: selected.table?.name,
        rowNumber: selected.bodyStartRow + rowOffset + 1,
        date: dateIndex >= 0 ? String(textRow[dateIndex] ?? row[dateIndex] ?? "") : undefined,
        item: itemIndex >= 0 ? String(textRow[itemIndex] ?? row[itemIndex] ?? "") : undefined,
        supplier: supplierIndex >= 0 ? String(textRow[supplierIndex] ?? row[supplierIndex] ?? "") : undefined,
        description: descriptionIndex >= 0 ? String(textRow[descriptionIndex] ?? row[descriptionIndex] ?? "") : undefined,
        amount: amountIndex >= 0 ? String(textRow[amountIndex] ?? row[amountIndex] ?? "") : undefined
      });
    }

    await context.sync();
    return expenses;
  });
}

export async function updateDocumentCounts(counts: ReadonlyMap<string, number>): Promise<void> {
  await Excel.run(async (context) => {
    const selected = await resolveSelectedExpensesContext(context);
    const idColumn = pickColumn(selected.settings.expenseIdColumn, DEFAULT_EXPENSE_COLUMNS.expenseId);
    const displayColumn = pickColumn(selected.settings.documentDisplayColumn, DEFAULT_EXPENSE_COLUMNS.documentDisplay);
    const idIndex = requireColumn(selected.headers, idColumn);
    const displayIndex = requireColumn(selected.headers, displayColumn);
    const targetRange = selected.mode === "table" ? selected.table?.getDataBodyRange() : selected.bodyRange;
    if (!targetRange) {
      throw new Error("Expense range could not be resolved.");
    }

    selected.values.forEach((row, rowIndex) => {
      const expenseId = String(row[idIndex] ?? "");
      if (!expenseId) {
        return;
      }
      const count = counts.get(expenseId) ?? 0;
      targetRange.getCell(rowIndex, displayIndex).values = [[count === 0 ? "No receipt" : `Attached: ${count}`]];
    });
    await context.sync();
  });
}

export async function updateDocumentDisplay(
  counts: ReadonlyMap<string, number>,
  documentIdsByExpense: ReadonlyMap<string, string[]>,
  documentsById: ReadonlyMap<string, ManagedDocument>,
  targetExpenseIds?: ReadonlySet<string>
): Promise<void> {
  await Excel.run(async (context) => {
    const selected = await resolveSelectedExpensesContext(context);
    const idColumn = pickColumn(selected.settings.expenseIdColumn, DEFAULT_EXPENSE_COLUMNS.expenseId);
    const displayColumn = pickColumn(selected.settings.documentDisplayColumn, DEFAULT_EXPENSE_COLUMNS.documentDisplay);
    const idsColumn = pickColumn(selected.settings.documentIdsColumn, DEFAULT_EXPENSE_COLUMNS.documentIds);
    const idIndex = requireColumn(selected.headers, idColumn);
    const displayIndex = requireColumn(selected.headers, displayColumn);
    const idsIndex = selected.headers.findIndex((header) => header.trim().toLowerCase() === idsColumn.trim().toLowerCase());
    const targetRange = selected.mode === "table" ? selected.table?.getDataBodyRange() : selected.bodyRange;
    if (!targetRange) {
      throw new Error("Expense range could not be resolved.");
    }

    selected.values.forEach((row, rowIndex) => {
      const expenseId = String(row[idIndex] ?? "");
      if (!expenseId) {
        return;
      }
      if (targetExpenseIds && !targetExpenseIds.has(expenseId)) {
        return;
      }

      const count = counts.get(expenseId) ?? 0;
      const documentIds = documentIdsByExpense.get(expenseId) ?? [];
      const linkedDocuments = documentIds
        .map((documentId) => documentsById.get(documentId))
        .filter((document): document is ManagedDocument => document !== undefined);
      const hasOnlyCashMarkers =
        linkedDocuments.length > 0 &&
        linkedDocuments.every((document) => document.storageProvider === "Cash / No Receipt" || document.fileType === "cash/no-receipt");
      targetRange.getCell(rowIndex, displayIndex).values = [[count === 0 ? "No receipt" : hasOnlyCashMarkers ? "Cash" : `Attached: ${count}`]];

      if (idsIndex < 0) {
        return;
      }

      if (documentIds.length === 0) {
        const idsCell = targetRange.getCell(rowIndex, idsIndex);
        idsCell.values = [[""]];
        return;
      }

      const idsCell = targetRange.getCell(rowIndex, idsIndex);
      const displayText = documentIds.join("; ");
      const onlyDocument = documentIds.length === 1 ? documentsById.get(documentIds[0]) : undefined;
      if (onlyDocument?.storageUrl) {
        idsCell.hyperlink = {
          address: onlyDocument.storageUrl,
          textToDisplay: onlyDocument.documentId,
          screenTip: `Open ${onlyDocument.documentId}`
        };
        return;
      }

      idsCell.values = [[displayText]];
    });
    await context.sync();
  });
}

export async function listAllExpensesFromConfiguredTable(): Promise<Expense[]> {
  return Excel.run(async (context) => {
    const selected = await resolveSelectedExpensesContext(context);
    const idIndex = requireColumn(selected.headers, pickColumn(selected.settings.expenseIdColumn, DEFAULT_EXPENSE_COLUMNS.expenseId));
    const amountIndex = selected.headers.indexOf(pickColumn(selected.settings.amountColumn, DEFAULT_EXPENSE_COLUMNS.amount));
    const itemIndex = selected.headers.indexOf(pickColumn(selected.settings.itemColumn, DEFAULT_EXPENSE_COLUMNS.item));
    const supplierIndex = selected.headers.indexOf(pickColumn(selected.settings.supplierColumn, DEFAULT_EXPENSE_COLUMNS.supplier));
    const dateIndex = selected.headers.indexOf(pickColumn(selected.settings.dateColumn, DEFAULT_EXPENSE_COLUMNS.date));
    const descriptionIndex = selected.headers.indexOf(pickColumn(selected.settings.descriptionColumn, DEFAULT_EXPENSE_COLUMNS.description));

    return selected.values
      .map((row, index): Expense => ({
        expenseId: String(row[idIndex] ?? ""),
        worksheet: selected.worksheetName,
        tableName: selected.table?.name,
        rowNumber: selected.bodyStartRow + index + 1,
        amount: amountIndex >= 0 ? String(selected.texts[index]?.[amountIndex] ?? row[amountIndex] ?? "") : undefined,
        item: itemIndex >= 0 ? String(selected.texts[index]?.[itemIndex] ?? row[itemIndex] ?? "") : undefined,
        supplier: supplierIndex >= 0 ? String(selected.texts[index]?.[supplierIndex] ?? row[supplierIndex] ?? "") : undefined,
        date: dateIndex >= 0 ? String(selected.texts[index]?.[dateIndex] ?? row[dateIndex] ?? "") : undefined,
        description: descriptionIndex >= 0 ? String(selected.texts[index]?.[descriptionIndex] ?? row[descriptionIndex] ?? "") : undefined
      }))
      .filter((expense) => expense.expenseId);
  });
}
