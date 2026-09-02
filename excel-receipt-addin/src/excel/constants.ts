export const SCHEMA_VERSION = "1";

export const SHEET_NAMES = {
  documents: "__Documents",
  links: "__ExpenseDocumentLinks",
  settings: "__Settings"
} as const;

export const TABLE_NAMES = {
  documents: "__tblDocuments",
  links: "__tblExpenseDocumentLinks",
  settings: "__tblSettings"
} as const;

export const DOCUMENT_COLUMNS = [
  "Document ID",
  "File Name",
  "Original File Name",
  "File Type",
  "Storage Key",
  "Storage URL",
  "Storage Provider",
  "SHA-256",
  "Supplier",
  "Document Date",
  "Document Total",
  "Created At",
  "Notes"
] as const;

export const LINK_COLUMNS = ["Expense ID", "Document ID", "Linked At"] as const;

export const SETTINGS_COLUMNS = ["Key", "Value"] as const;

export const DEFAULT_EXPENSE_COLUMNS = {
  expenseId: "Expense ID",
  date: "Date",
  item: "Item",
  supplier: "Supplier",
  description: "Description",
  amount: "Amount",
  documentDisplay: "Receipt",
  documentIds: "Receipt IDs"
} as const;
