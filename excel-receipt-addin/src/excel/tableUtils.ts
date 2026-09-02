export async function getTableOrNull(
  context: Excel.RequestContext,
  tableName: string
): Promise<Excel.Table | null> {
  const table = context.workbook.tables.getItemOrNullObject(tableName);
  table.load("name");
  await context.sync();
  return table.isNullObject ? null : table;
}

export async function getWorksheetOrNull(
  context: Excel.RequestContext,
  sheetName: string
): Promise<Excel.Worksheet | null> {
  const sheet = context.workbook.worksheets.getItemOrNullObject(sheetName);
  sheet.load("name");
  await context.sync();
  return sheet.isNullObject ? null : sheet;
}

export async function readTableRows(
  context: Excel.RequestContext,
  tableName: string
): Promise<string[][]> {
  const table = context.workbook.tables.getItem(tableName);
  const body = table.getDataBodyRange().load("values");
  await context.sync();
  return body.values.map((row) => row.map((cell) => String(cell ?? "")));
}

export async function readTableHeaders(
  context: Excel.RequestContext,
  table: Excel.Table
): Promise<string[]> {
  const headerRange = table.getHeaderRowRange().load("values");
  await context.sync();
  return headerRange.values[0].map((value) => String(value ?? ""));
}

export function rowToRecord(headers: string[], row: string[]): Record<string, string> {
  return headers.reduce<Record<string, string>>((record, header, index) => {
    record[header] = row[index] ?? "";
    return record;
  }, {});
}

export function requireColumn(headers: string[], columnName: string): number {
  const index = headers.findIndex((header) => header.trim().toLowerCase() === columnName.trim().toLowerCase());
  if (index < 0) {
    throw new Error(`Missing required column "${columnName}".`);
  }
  return index;
}
