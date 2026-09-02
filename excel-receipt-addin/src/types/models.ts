export type CurrencyCode = "ZMW";
export type StorageProviderKind = "local" | "googleDrive";

export interface Expense {
  expenseId: string;
  worksheet: string;
  tableName?: string;
  rowNumber: number;
  date?: string;
  item?: string;
  supplier?: string;
  description?: string;
  amount?: string;
}

export interface ManagedDocument {
  documentId: string;
  fileName: string;
  originalFileName: string;
  fileType: string;
  storageKey: string;
  storageUrl?: string;
  storageProvider?: string;
  sha256?: string;
  supplier?: string;
  documentDate?: string;
  documentTotal?: string;
  createdAt: string;
  notes?: string;
}

export interface ExpenseDocumentLink {
  expenseId: string;
  documentId: string;
  linkedAt: string;
}

export interface WorkbookSettings {
  schemaVersion: string;
  expenseWorksheet?: string;
  expenseTable?: string;
  headerRow?: string;
  firstDataRow?: string;
  lastDataRow?: string;
  expenseIdColumn?: string;
  dateColumn?: string;
  itemColumn?: string;
  supplierColumn?: string;
  descriptionColumn?: string;
  amountColumn?: string;
  documentDisplayColumn?: string;
  documentIdsColumn?: string;
  storageProvider?: StorageProviderKind;
  googleClientId?: string;
  googleDriveFolderId?: string;
}

export interface ReconciliationSummary {
  documentId: string;
  documentTotal?: string;
  linkedExpenseTotal: string;
  difference?: string;
  isBalanced?: boolean;
}
