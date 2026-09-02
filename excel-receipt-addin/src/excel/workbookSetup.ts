import { DOCUMENT_COLUMNS, LINK_COLUMNS, SCHEMA_VERSION, SETTINGS_COLUMNS, SHEET_NAMES, TABLE_NAMES } from "./constants";
import { getTableOrNull, getWorksheetOrNull } from "./tableUtils";
import { readTableBodyValues } from "./tableRead";

async function ensureHiddenTable(
  context: Excel.RequestContext,
  sheetName: string,
  tableName: string,
  headers: readonly string[]
): Promise<void> {
  let sheet = await getWorksheetOrNull(context, sheetName);
  if (!sheet) {
    sheet = context.workbook.worksheets.add(sheetName);
    sheet.visibility = Excel.SheetVisibility.veryHidden;
    await context.sync();
  }

  const existingTable = await getTableOrNull(context, tableName);
  if (existingTable) {
    const headerRange = existingTable.getHeaderRowRange().load("values");
    await context.sync();
    const currentHeaders = new Set(headerRange.values[0].map((value) => String(value ?? "")));
    for (const header of headers) {
      if (!currentHeaders.has(header)) {
        existingTable.columns.add(undefined, undefined, header);
      }
    }
    sheet.visibility = Excel.SheetVisibility.veryHidden;
    await context.sync();
    return;
  }

  const headerRange = sheet.getRangeByIndexes(0, 0, 1, headers.length);
  headerRange.values = [Array.from(headers)];
  const table = sheet.tables.add(headerRange, true);
  table.name = tableName;
  sheet.visibility = Excel.SheetVisibility.veryHidden;
  await context.sync();
}

export async function initializeWorkbook(): Promise<void> {
  await Excel.run(async (context) => {
    await ensureHiddenTable(context, SHEET_NAMES.documents, TABLE_NAMES.documents, DOCUMENT_COLUMNS);
    await ensureHiddenTable(context, SHEET_NAMES.links, TABLE_NAMES.links, LINK_COLUMNS);
    await ensureHiddenTable(context, SHEET_NAMES.settings, TABLE_NAMES.settings, SETTINGS_COLUMNS);

    const settingsTable = context.workbook.tables.getItem(TABLE_NAMES.settings);
    const values = await readTableBodyValues(context, settingsTable);

    const hasVersion = values.some((row) => String(row[0]) === "schemaVersion");
    if (!hasVersion) {
      settingsTable.rows.add(undefined, [["schemaVersion", SCHEMA_VERSION]]);
      await context.sync();
    }
  });
}
