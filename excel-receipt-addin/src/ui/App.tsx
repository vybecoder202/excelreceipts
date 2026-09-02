import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { listDocuments } from "../excel/documentRepository";
import { initializeWorkbook } from "../excel/workbookSetup";
import {
  attachFileToSelectedExpenses,
  getSelectionSummary,
  linkExistingDocumentToSelectedExpenses,
  markSelectedExpensesAsCash,
  unlinkDocumentFromExpense
} from "../services/documentService";
import { reconcileDocument } from "../services/reconciliationService";
import { GoogleDriveStorageProvider } from "../storage/GoogleDriveStorageProvider";
import { IndexedDbStorageProvider } from "../storage/IndexedDbStorageProvider";
import type { Expense, ManagedDocument, WorkbookSettings } from "../types/models";
import { getSettings, saveSettings } from "../excel/settingsRepository";

type ViewMode = "selection" | "manage" | "settings";

interface Notice {
  tone: "success" | "error" | "info";
  text: string;
}

interface DocumentPreview {
  document: ManagedDocument;
  source: string;
  kind: "image" | "pdf" | "download";
  objectUrl?: string;
}

const emptySettings: WorkbookSettings = {
  schemaVersion: "1",
  expenseWorksheet: "",
  expenseTable: "",
  headerRow: "1",
  firstDataRow: "2",
  lastDataRow: "",
  expenseIdColumn: "Expense ID",
  dateColumn: "Date",
  itemColumn: "Item",
  supplierColumn: "Supplier",
  descriptionColumn: "Description",
  amountColumn: "Amount",
  documentDisplayColumn: "Receipt",
  documentIdsColumn: "Receipt IDs",
  storageProvider: "local",
  googleClientId: "",
  googleDriveFolderId: ""
};

export default function App() {
  const localStorage = useMemo(() => new IndexedDbStorageProvider(), []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectionTimerRef = useRef<number | undefined>(undefined);
  const isRefreshingRef = useRef(false);
  const [viewMode, setViewMode] = useState<ViewMode>("selection");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [linkedDocuments, setLinkedDocuments] = useState<ManagedDocument[]>([]);
  const [allDocuments, setAllDocuments] = useState<ManagedDocument[]>([]);
  const [settings, setSettings] = useState<WorkbookSettings>(emptySettings);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState<Notice | undefined>();
  const [preview, setPreview] = useState<DocumentPreview | undefined>();
  const [isBusy, setIsBusy] = useState(false);
  const storage = useMemo(
    () =>
      settings.storageProvider === "googleDrive"
        ? new GoogleDriveStorageProvider({
            clientId: settings.googleClientId || import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
            folderId: settings.googleDriveFolderId || import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID || undefined
          })
        : localStorage,
    [localStorage, settings.googleClientId, settings.googleDriveFolderId, settings.storageProvider]
  );
  const googleDriveStorage = useMemo(
    () =>
      new GoogleDriveStorageProvider({
        clientId: settings.googleClientId || import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
        folderId: settings.googleDriveFolderId || import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID || undefined
      }),
    [settings.googleClientId, settings.googleDriveFolderId]
  );

  const getStorageForDocument = useCallback(
    (managedDocument: ManagedDocument) =>
      managedDocument.storageProvider === "Google Drive" || managedDocument.storageUrl?.includes("drive.google.com")
        ? googleDriveStorage
        : localStorage,
    [googleDriveStorage, localStorage]
  );

  const closePreview = useCallback(() => {
    if (preview?.objectUrl) {
      URL.revokeObjectURL(preview.objectUrl);
    }
    setPreview(undefined);
  }, [preview]);

  const runWithNotice = useCallback(async (action: () => Promise<void>, success?: string) => {
    setIsBusy(true);
    setNotice(undefined);
    try {
      await action();
      if (success) {
        setNotice({ tone: "success", text: success });
      }
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Something went wrong." });
    } finally {
      setIsBusy(false);
    }
  }, []);

  const refreshSelection = useCallback(
    async (options: { showErrors?: boolean; showBusy?: boolean; updateWorksheetDisplay?: boolean } = {}) => {
      if (isRefreshingRef.current) {
        return;
      }

      const showErrors = options.showErrors ?? true;
      const showBusy = options.showBusy ?? true;
      isRefreshingRef.current = true;
      if (showBusy) {
        setIsBusy(true);
      }

      try {
        const summary = await getSelectionSummary({ updateWorksheetDisplay: options.updateWorksheetDisplay });
        setExpenses(summary.expenses);
        setLinkedDocuments(summary.documents);
        setAllDocuments(await listDocuments());
        if (!showErrors) {
          setNotice(undefined);
        }
      } catch (error) {
        if (showErrors) {
          setNotice({ tone: "error", text: error instanceof Error ? error.message : "Something went wrong." });
        }
      } finally {
        isRefreshingRef.current = false;
        if (showBusy) {
          setIsBusy(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    void runWithNotice(async () => {
      await initializeWorkbook();
      setSettings({ ...emptySettings, ...(await getSettings()) });
      await refreshSelection({ showErrors: true });
    }, "Workbook metadata is ready.");
  }, [refreshSelection, runWithNotice]);

  useEffect(() => {
    const handleSelectionChanged = () => {
      window.clearTimeout(selectionTimerRef.current);
      selectionTimerRef.current = window.setTimeout(() => {
        void refreshSelection({ showErrors: false, showBusy: false, updateWorksheetDisplay: false });
      }, 100);
    };

    Office.context.document.addHandlerAsync(Office.EventType.DocumentSelectionChanged, handleSelectionChanged, (result) => {
      if (result.status === Office.AsyncResultStatus.Failed) {
        setNotice({ tone: "error", text: `Could not watch Excel selection changes: ${result.error.message}` });
      }
    });

    return () => {
      window.clearTimeout(selectionTimerRef.current);
      Office.context.document.removeHandlerAsync(
        Office.EventType.DocumentSelectionChanged,
        { handler: handleSelectionChanged },
        () => undefined
      );
    };
  }, [refreshSelection]);

  const selectedExpense = expenses.length === 1 ? expenses[0] : undefined;
  const filteredDocuments = allDocuments.filter((document) => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return true;
    }
    return [document.documentId, document.fileName, document.originalFileName, document.supplier]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(query));
  });

  const handleFileSelected = useCallback(async (file: File | undefined) => {
    if (!file) {
      return;
    }

    await runWithNotice(async () => {
      const result = await attachFileToSelectedExpenses(file, storage, async (existing) => {
        const choice = window.prompt(
          `This file already exists as ${existing.documentId}. Type LINK to link it, NEW to create a separate document record, or CANCEL to stop.`,
          "LINK"
        );
        if (choice?.trim().toUpperCase() === "NEW") {
          return "continue-new";
        }
        if (choice?.trim().toUpperCase() === "LINK") {
          return "link-existing";
        }
        return "cancel";
      });
      if (result) {
        setNotice({
          tone: "success",
          text: `${result.document.documentId} linked to ${result.linkedCount} expense row${result.linkedCount === 1 ? "" : "s"}.`
        });
      }
      const summary = await getSelectionSummary();
      setExpenses(summary.expenses);
      setLinkedDocuments(summary.documents);
      setAllDocuments(await listDocuments());
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [runWithNotice, storage]);

  const pasteImageFromClipboard = useCallback(async () => {
    if (!navigator.clipboard?.read) {
      throw new Error("Clipboard image paste is not supported in this Excel browser view. Use Attach Receipt instead.");
    }

    const clipboardItems = await navigator.clipboard.read();
    for (const item of clipboardItems) {
      const imageType = item.types.find((type) => type.startsWith("image/"));
      if (!imageType) {
        continue;
      }

      const blob = await item.getType(imageType);
      await handleFileSelected(new File([blob], makeClipboardImageName(imageType), { type: imageType }));
      return;
    }

    throw new Error("The clipboard does not contain an image.");
  }, [handleFileSelected]);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const pastedImage = Array.from(event.clipboardData?.files ?? []).find((file) => file.type.startsWith("image/"));
      if (!pastedImage) {
        return;
      }

      event.preventDefault();
      void handleFileSelected(pastedImage);
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handleFileSelected]);

  async function openDocument(managedDocument: ManagedDocument) {
    await runWithNotice(async () => {
      if (managedDocument.storageProvider === "Cash / No Receipt" || managedDocument.fileType === "cash/no-receipt") {
        setNotice({ tone: "info", text: `${managedDocument.documentId} is marked as Cash / No Receipt. There is no file to open.` });
        return;
      }

      const documentStorage = getStorageForDocument(managedDocument);
      const blob = await documentStorage.getFileBlob(managedDocument.storageKey);
      if (!blob) {
        await documentStorage.openFile(managedDocument.storageKey);
        return;
      }

      closePreview();
      const fileType = managedDocument.fileType || blob.type;
      const fileName = managedDocument.originalFileName.toLowerCase();
      const isImage = fileType.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(fileName);
      if (isImage) {
        setPreview({ document: managedDocument, source: await blobToDataUrl(blob), kind: "image" });
        return;
      }
      if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
        const objectUrl = URL.createObjectURL(blob);
        setPreview({ document: managedDocument, source: objectUrl, objectUrl, kind: "pdf" });
        return;
      }

      downloadBlob(blob, managedDocument.originalFileName);
      setNotice({ tone: "info", text: `${managedDocument.originalFileName} was sent to your browser downloads.` });
    });
  }

  useEffect(() => {
    return () => {
      if (preview?.objectUrl) {
        URL.revokeObjectURL(preview.objectUrl);
      }
    };
  }, [preview]);

  async function linkDocument(document: ManagedDocument) {
    await runWithNotice(async () => {
      const count = await linkExistingDocumentToSelectedExpenses(document.documentId);
      await refreshSelection({ updateWorksheetDisplay: false });
      setNotice({ tone: "success", text: `${document.documentId} linked to ${count} selected expense row${count === 1 ? "" : "s"}.` });
    });
  }

  async function saveCurrentSettings() {
    await runWithNotice(async () => {
      await saveSettings(settings);
      await refreshSelection();
    }, "Settings saved.");
  }

  async function markCash() {
    await runWithNotice(async () => {
      const result = await markSelectedExpensesAsCash();
      await refreshSelection({ updateWorksheetDisplay: false });
      setNotice({
        tone: "success",
        text: `${result.document.documentId} marked as Cash / No Receipt for ${result.linkedCount} expense row${result.linkedCount === 1 ? "" : "s"}.`
      });
    });
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Construction Manager</p>
          <h1>Receipt Documents</h1>
        </div>
        <button type="button" onClick={() => void refreshSelection()} disabled={isBusy}>
          Refresh
        </button>
      </header>

      <nav className="tabs" aria-label="Receipt add-in sections">
        <button className={viewMode === "selection" ? "active" : ""} type="button" onClick={() => setViewMode("selection")}>
          Selection
        </button>
        <button className={viewMode === "manage" ? "active" : ""} type="button" onClick={() => setViewMode("manage")}>
          Manage
        </button>
        <button className={viewMode === "settings" ? "active" : ""} type="button" onClick={() => setViewMode("settings")}>
          Settings
        </button>
      </nav>

      {notice ? <div className={`notice ${notice.tone}`}>{notice.text}</div> : null}

      {preview ? (
        <section className="panel preview-panel">
          <div className="section-heading">
            <h2>{preview.document.originalFileName}</h2>
            <button type="button" onClick={closePreview}>
              Close
            </button>
          </div>
          {preview.kind === "image" ? <img src={preview.source} alt={preview.document.originalFileName} /> : null}
          {preview.kind === "pdf" ? <iframe title={preview.document.originalFileName} src={preview.source} /> : null}
          <button
            type="button"
            onClick={() =>
              void runWithNotice(async () => {
                const documentStorage = getStorageForDocument(preview.document);
                const blob = await documentStorage.getFileBlob(preview.document.storageKey);
                if (!blob) {
                  await documentStorage.openFile(preview.document.storageKey);
                  return;
                }
                downloadBlob(blob, preview.document.originalFileName);
              }, "Download started.")
            }
          >
            Download
          </button>
        </section>
      ) : null}

      {viewMode === "selection" ? (
        <section className="panel">
          <div className="section-heading">
            <h2>{expenses.length === 1 ? `Expense ${expenses[0].expenseId}` : `${expenses.length} expenses selected`}</h2>
            <div className="row-actions">
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isBusy || expenses.length === 0}>
                Attach Receipt
              </button>
              <button
                type="button"
                onClick={() => void runWithNotice(pasteImageFromClipboard)}
                disabled={isBusy || expenses.length === 0}
              >
                Paste Image
              </button>
              <button type="button" onClick={() => void markCash()} disabled={isBusy || expenses.length === 0}>
                Cash
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            className="file-input"
            type="file"
            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
            onChange={(event) => void handleFileSelected(event.currentTarget.files?.[0])}
          />

          {selectedExpense ? (
            <dl className="expense-facts">
              <div>
                <dt>Supplier</dt>
                <dd>{selectedExpense.supplier || "Not set"}</dd>
              </div>
              <div>
                <dt>Date</dt>
                <dd>{selectedExpense.date || "Not set"}</dd>
              </div>
              <div>
                <dt>Item</dt>
                <dd>{selectedExpense.item || selectedExpense.description || "Not set"}</dd>
              </div>
              <div>
                <dt>Amount</dt>
                <dd>{selectedExpense.amount ? `K${selectedExpense.amount}` : "Not set"}</dd>
              </div>
            </dl>
          ) : null}

          <div className="document-list">
            {linkedDocuments.length === 0 ? <p className="muted">No linked documents for the current selection.</p> : null}
            {linkedDocuments.map((document) => (
              <article className="document-row" key={document.documentId}>
                <div>
                  <strong>{document.documentId}</strong>
                  <span>{document.originalFileName}</span>
                </div>
                <div className="row-actions">
                  <button type="button" onClick={() => void openDocument(document)}>
                    Open
                  </button>
                  {selectedExpense ? (
                    <button
                      type="button"
                      onClick={() =>
                        void runWithNotice(async () => {
                          await unlinkDocumentFromExpense(selectedExpense.expenseId, document.documentId);
                          await refreshSelection({ updateWorksheetDisplay: false });
                        }, "Document unlinked.")
                      }
                    >
                      Unlink
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {viewMode === "manage" ? (
        <section className="panel">
          <div className="section-heading">
            <h2>Document Management</h2>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search documents" />
          </div>
          <div className="document-list">
            {filteredDocuments.map((document) => {
              const reconciliation = reconcileDocument(document, expenses);
              return (
                <article className="document-row" key={document.documentId}>
                  <div>
                    <strong>{document.documentId}</strong>
                    <span>{document.originalFileName}</span>
                    {document.supplier ? <small>{document.supplier}</small> : null}
                    {document.documentTotal ? (
                      <small className={reconciliation.isBalanced === false ? "warning" : ""}>
                        Linked selected total K{reconciliation.linkedExpenseTotal}
                      </small>
                    ) : null}
                  </div>
                  <div className="row-actions">
                    <button type="button" onClick={() => void openDocument(document)}>
                      Open
                    </button>
                    <button type="button" onClick={() => void linkDocument(document)} disabled={expenses.length === 0}>
                      Link
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {viewMode === "settings" ? (
        <section className="panel settings-grid">
          <h2>Workbook Mapping</h2>
          {[
            ["expenseWorksheet", "Expense worksheet"],
            ["expenseTable", "Expense table"],
            ["headerRow", "Header row"],
            ["firstDataRow", "First data row"],
            ["lastDataRow", "Last data row"],
            ["expenseIdColumn", "Expense ID column"],
            ["dateColumn", "Date column"],
            ["itemColumn", "Item column"],
            ["supplierColumn", "Supplier column"],
            ["descriptionColumn", "Description column"],
            ["amountColumn", "Amount column"],
            ["documentDisplayColumn", "Receipt/Documents column"],
            ["documentIdsColumn", "Receipt IDs column"],
            ["googleClientId", "Google OAuth Client ID"],
            ["googleDriveFolderId", "Google Drive folder ID"]
          ].map(([key, label]) => (
            <label key={key}>
              <span>{label}</span>
              <input
                value={String(settings[key as keyof WorkbookSettings] ?? "")}
                onChange={(event) => setSettings((current) => ({ ...current, [key]: event.target.value }))}
              />
            </label>
          ))}
          <label>
            <span>Storage provider</span>
            <select
              value={settings.storageProvider ?? "local"}
              onChange={(event) =>
                setSettings((current) => ({ ...current, storageProvider: event.target.value === "googleDrive" ? "googleDrive" : "local" }))
              }
            >
              <option value="local">Local add-in storage</option>
              <option value="googleDrive">Google Drive</option>
            </select>
          </label>
          <button type="button" onClick={saveCurrentSettings} disabled={isBusy}>
            Save Settings
          </button>
        </section>
      ) : null}
    </main>
  );
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read the stored file."));
    reader.readAsDataURL(blob);
  });
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = globalThis.document.createElement("a");
  link.href = url;
  link.download = fileName;
  globalThis.document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function makeClipboardImageName(mimeType: string): string {
  const extensionByType: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/bmp": "bmp"
  };
  const extension = extensionByType[mimeType.toLowerCase()] ?? "png";
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "");
  return `clipboard-receipt-${stamp}.${extension}`;
}
