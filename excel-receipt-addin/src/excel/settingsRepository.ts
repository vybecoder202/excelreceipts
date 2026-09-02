import { SCHEMA_VERSION, TABLE_NAMES } from "./constants";
import type { WorkbookSettings } from "../types/models";
import { readTableBodyValues } from "./tableRead";

const SETTINGS_KEY_MAP: Record<Exclude<keyof WorkbookSettings, "schemaVersion">, string> = {
  expenseWorksheet: "expenseWorksheet",
  expenseTable: "expenseTable",
  headerRow: "headerRow",
  firstDataRow: "firstDataRow",
  lastDataRow: "lastDataRow",
  expenseIdColumn: "expenseIdColumn",
  dateColumn: "dateColumn",
  itemColumn: "itemColumn",
  supplierColumn: "supplierColumn",
  descriptionColumn: "descriptionColumn",
  amountColumn: "amountColumn",
  documentDisplayColumn: "documentDisplayColumn",
  documentIdsColumn: "documentIdsColumn",
  storageProvider: "storageProvider",
  googleClientId: "googleClientId",
  googleDriveFolderId: "googleDriveFolderId"
};

export async function getSettings(): Promise<WorkbookSettings> {
  return Excel.run(async (context) => {
    return getSettingsInContext(context);
  });
}

export async function getSettingsInContext(context: Excel.RequestContext): Promise<WorkbookSettings> {
  const table = context.workbook.tables.getItem(TABLE_NAMES.settings);
  const values = await readTableBodyValues(context, table);

  const raw = new Map(values.map((row) => [String(row[0] ?? ""), String(row[1] ?? "")]));
  return {
    schemaVersion: raw.get("schemaVersion") || SCHEMA_VERSION,
    expenseWorksheet: raw.get("expenseWorksheet") || undefined,
    expenseTable: raw.get("expenseTable") || undefined,
    headerRow: raw.get("headerRow") || undefined,
    firstDataRow: raw.get("firstDataRow") || undefined,
    lastDataRow: raw.get("lastDataRow") || undefined,
    expenseIdColumn: raw.get("expenseIdColumn") || undefined,
    dateColumn: raw.get("dateColumn") || undefined,
    itemColumn: raw.get("itemColumn") || undefined,
    supplierColumn: raw.get("supplierColumn") || undefined,
    descriptionColumn: raw.get("descriptionColumn") || undefined,
    amountColumn: raw.get("amountColumn") || undefined,
    documentDisplayColumn: raw.get("documentDisplayColumn") || undefined,
    documentIdsColumn: raw.get("documentIdsColumn") || undefined,
    storageProvider: raw.get("storageProvider") === "googleDrive" ? "googleDrive" : "local",
    googleClientId: raw.get("googleClientId") || undefined,
    googleDriveFolderId: raw.get("googleDriveFolderId") || undefined
  };
}

export async function saveSettings(settings: WorkbookSettings): Promise<void> {
  await Excel.run(async (context) => {
    const table = context.workbook.tables.getItem(TABLE_NAMES.settings);
    const values = await readTableBodyValues(context, table);

    const desired = new Map<string, string>([["schemaVersion", settings.schemaVersion || SCHEMA_VERSION]]);
    Object.entries(SETTINGS_KEY_MAP).forEach(([settingsKey, storageKey]) => {
      const value = settings[settingsKey as keyof WorkbookSettings];
      if (typeof value === "string" && value.trim()) {
        desired.set(storageKey, value.trim());
      }
    });

    if (values.length > 0) {
      table.getDataBodyRange().delete(Excel.DeleteShiftDirection.up);
      await context.sync();
    }
    table.rows.add(undefined, Array.from(desired.entries()));
    await context.sync();
  });
}
