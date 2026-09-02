import type { SaveFileContext, StorageProvider, StoredFile } from "./StorageProvider";

interface StoredBlobRecord {
  storageKey: string;
  fileName: string;
  fileType: string;
  blob: Blob;
  createdAt: string;
}

const DB_NAME = "construction-receipt-addin";
const STORE_NAME = "documents";
const DB_VERSION = 1;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME, { keyPath: "storageKey" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Unable to open IndexedDB."));
  });
}

function runTransaction<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDatabase().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, mode);
        const request = action(transaction.objectStore(STORE_NAME));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed."));
        transaction.oncomplete = () => db.close();
        transaction.onerror = () => {
          db.close();
          reject(transaction.error ?? new Error("IndexedDB transaction failed."));
        };
      })
  );
}

export class IndexedDbStorageProvider implements StorageProvider {
  readonly name = "IndexedDB local add-in storage";

  async saveFile(file: File, documentId: string, _context?: SaveFileContext): Promise<StoredFile> {
    const safeName = file.name.replace(/[^\w.\- ]/g, "_");
    const storageKey = `${documentId}-${crypto.randomUUID()}-${safeName}`;
    const record: StoredBlobRecord = {
      storageKey,
      fileName: safeName,
      fileType: file.type || "application/octet-stream",
      blob: file,
      createdAt: new Date().toISOString()
    };
    await runTransaction("readwrite", (store) => store.put(record));
    return { storageKey, fileName: safeName, fileType: record.fileType };
  }

  async openFile(storageKey: string): Promise<void> {
    const record = await this.getRecord(storageKey);
    if (!record) {
      throw new Error("The stored file could not be found. It may have been removed from this browser profile.");
    }
    const url = URL.createObjectURL(record.blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = record.fileName;
    link.rel = "noopener";
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  async getFileBlob(storageKey: string): Promise<Blob | undefined> {
    return (await this.getRecord(storageKey))?.blob;
  }

  async deleteFile(storageKey: string): Promise<void> {
    await runTransaction("readwrite", (store) => store.delete(storageKey));
  }

  async getFileUrl(storageKey: string): Promise<string | undefined> {
    const record = await this.getRecord(storageKey);
    if (!record) {
      return undefined;
    }
    return URL.createObjectURL(record.blob);
  }

  async fileExists(storageKey: string): Promise<boolean> {
    return Boolean(await this.getRecord(storageKey));
  }

  private async getRecord(storageKey: string): Promise<StoredBlobRecord | undefined> {
    return runTransaction<StoredBlobRecord | undefined>("readonly", (store) => store.get(storageKey));
  }
}
