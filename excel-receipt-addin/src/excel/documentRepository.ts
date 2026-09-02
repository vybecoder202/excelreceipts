import { TABLE_NAMES } from "./constants";
import { readTableHeaders, rowToRecord } from "./tableUtils";
import type { ManagedDocument } from "../types/models";
import { readTableBodyValues } from "./tableRead";

function documentFromRecord(record: Record<string, string>): ManagedDocument {
  return {
    documentId: record["Document ID"],
    fileName: record["File Name"],
    originalFileName: record["Original File Name"],
    fileType: record["File Type"],
    storageKey: record["Storage Key"],
    storageUrl: record["Storage URL"] || undefined,
    storageProvider: record["Storage Provider"] || (record["Storage URL"]?.includes("drive.google.com") ? "Google Drive" : "IndexedDB local add-in storage"),
    sha256: record["SHA-256"] || undefined,
    supplier: record.Supplier || undefined,
    documentDate: record["Document Date"] || undefined,
    documentTotal: record["Document Total"] || undefined,
    createdAt: record["Created At"],
    notes: record.Notes || undefined
  };
}

export async function listDocuments(): Promise<ManagedDocument[]> {
  return Excel.run(async (context) => {
    const table = context.workbook.tables.getItem(TABLE_NAMES.documents);
    const headers = await readTableHeaders(context, table);
    const values = await readTableBodyValues(context, table);
    return values.map((row) => documentFromRecord(rowToRecord(headers, row.map((cell) => String(cell ?? "")))));
  });
}

export async function addDocument(document: ManagedDocument): Promise<void> {
  await Excel.run(async (context) => {
    const table = context.workbook.tables.getItem(TABLE_NAMES.documents);
    const headers = await readTableHeaders(context, table);
    const record: Record<string, string> = {
      "Document ID": document.documentId,
      "File Name": document.fileName,
      "Original File Name": document.originalFileName,
      "File Type": document.fileType,
      "Storage Key": document.storageKey,
      "Storage URL": document.storageUrl ?? "",
      "Storage Provider": document.storageProvider ?? "",
      "SHA-256": document.sha256 ?? "",
      Supplier: document.supplier ?? "",
      "Document Date": document.documentDate ?? "",
      "Document Total": document.documentTotal ?? "",
      "Created At": document.createdAt,
      Notes: document.notes ?? ""
    };
    table.rows.add(undefined, [headers.map((header) => record[header] ?? "")]);
    await context.sync();
  });
}

export async function findDocumentByHash(hash: string): Promise<ManagedDocument | undefined> {
  const documents = await listDocuments();
  return documents.find((document) => document.sha256 === hash);
}
