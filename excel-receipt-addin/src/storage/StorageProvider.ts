export interface StoredFile {
  storageKey: string;
  fileName: string;
  fileType: string;
  storageUrl?: string;
  provider?: string;
}

export interface SaveFileContext {
  expenseDate?: string;
}

export interface StorageProvider {
  readonly name: string;
  saveFile(file: File, documentId: string, context?: SaveFileContext): Promise<StoredFile>;
  openFile(storageKey: string): Promise<void>;
  getFileBlob(storageKey: string): Promise<Blob | undefined>;
  deleteFile(storageKey: string): Promise<void>;
  getFileUrl(storageKey: string): Promise<string | undefined>;
  fileExists(storageKey: string): Promise<boolean>;
}
