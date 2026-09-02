import type { SaveFileContext, StorageProvider, StoredFile } from "./StorageProvider";

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const DRIVE_UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,webContentLink,createdTime,modifiedTime,headRevisionId";
const DRIVE_FILE_URL = "https://www.googleapis.com/drive/v3/files";
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

interface GoogleDriveConfig {
  clientId: string;
  folderId?: string;
}

interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

interface DriveFileResponse {
  id: string;
  name: string;
  mimeType?: string;
  webViewLink?: string;
  webContentLink?: string;
  createdTime?: string;
  modifiedTime?: string;
  headRevisionId?: string;
}

function normalizeDateForFileName(value: string | undefined): string | undefined {
  if (!value?.trim()) {
    return undefined;
  }
  const trimmed = value.trim();
  if (/^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(trimmed)) {
    return trimmed.replace(/[/-]/g, "-");
  }
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmed)) {
    return trimmed;
  }
  const date = new Date(trimmed);
  if (!Number.isNaN(date.valueOf())) {
    return date.toISOString().slice(0, 10);
  }
  return trimmed.replace(/[^\dA-Za-z-]/g, "-").replace(/-+/g, "-").slice(0, 24);
}

function createDriveFileName(documentId: string, file: File, context?: SaveFileContext): string {
  const extensionMatch = /\.[A-Za-z0-9]{1,12}$/.exec(file.name.trim());
  const datePart = normalizeDateForFileName(context?.expenseDate);
  return `${documentId}${datePart ? `_${datePart}` : ""}${extensionMatch?.[0].toLowerCase() ?? ""}`;
}

async function parseDriveResponse(response: Response): Promise<DriveFileResponse> {
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Google Drive request failed (${response.status}): ${text || response.statusText}`);
  }
  return JSON.parse(text) as DriveFileResponse;
}

function openExternalUrl(url: string): void {
  if (Office.context.ui.openBrowserWindow) {
    Office.context.ui.openBrowserWindow(url);
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

export class GoogleDriveStorageProvider implements StorageProvider {
  readonly name = "Google Drive";

  private accessToken?: string;
  private tokenExpiresAt = 0;

  constructor(private readonly config: GoogleDriveConfig) {}

  async saveFile(file: File, documentId: string, context?: SaveFileContext): Promise<StoredFile> {
    const accessToken = await this.getAccessToken();
    const fileName = createDriveFileName(documentId, file, context);
    const metadata = {
      name: fileName,
      mimeType: file.type || "application/octet-stream",
      parents: this.config.folderId ? [this.config.folderId] : undefined
    };
    const boundary = `receipt_addin_${crypto.randomUUID()}`;
    const body = new Blob(
      [
        `--${boundary}\r\n`,
        "Content-Type: application/json; charset=UTF-8\r\n\r\n",
        JSON.stringify(metadata),
        "\r\n",
        `--${boundary}\r\n`,
        `Content-Type: ${file.type || "application/octet-stream"}\r\n\r\n`,
        file,
        "\r\n",
        `--${boundary}--`
      ],
      { type: `multipart/related; boundary=${boundary}` }
    );

    const response = await fetch(DRIVE_UPLOAD_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`
      },
      body
    });

    const driveFile = await parseDriveResponse(response);
    return {
      storageKey: driveFile.id,
      fileName: driveFile.name,
      fileType: driveFile.mimeType || file.type || "application/octet-stream",
      storageUrl: driveFile.webViewLink || `https://drive.google.com/file/d/${driveFile.id}/view`,
      provider: this.name
    };
  }

  async openFile(storageKey: string): Promise<void> {
    const url = await this.getFileUrl(storageKey);
    if (!url) {
      throw new Error("Google Drive did not return an openable URL for this file.");
    }
    openExternalUrl(url);
  }

  async getFileBlob(): Promise<Blob | undefined> {
    return undefined;
  }

  async deleteFile(storageKey: string): Promise<void> {
    const accessToken = await this.getAccessToken();
    const response = await fetch(`${DRIVE_FILE_URL}/${encodeURIComponent(storageKey)}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ trashed: true })
    });
    await parseDriveResponse(response);
  }

  async getFileUrl(storageKey: string): Promise<string | undefined> {
    const accessToken = await this.getAccessToken();
    const response = await fetch(
      `${DRIVE_FILE_URL}/${encodeURIComponent(storageKey)}?fields=id,webViewLink,webContentLink,name`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );
    const driveFile = await parseDriveResponse(response);
    return driveFile.webViewLink || driveFile.webContentLink || `https://drive.google.com/file/d/${driveFile.id}/view`;
  }

  async fileExists(storageKey: string): Promise<boolean> {
    try {
      await this.getFileUrl(storageKey);
      return true;
    } catch {
      return false;
    }
  }

  private async getAccessToken(): Promise<string> {
    if (!this.config.clientId.trim()) {
      throw new Error("Google Drive storage needs a Google OAuth Client ID in Settings.");
    }
    if (this.accessToken && Date.now() < this.tokenExpiresAt - 60_000) {
      return this.accessToken;
    }

    const token = await this.authorizeWithOfficeDialog();

    if (token.error || !token.access_token) {
      throw new Error(token.error_description || token.error || "Google authorization failed.");
    }

    this.accessToken = token.access_token;
    this.tokenExpiresAt = Date.now() + (token.expires_in ?? 3600) * 1000;
    return this.accessToken;
  }

  private authorizeWithOfficeDialog(): Promise<TokenResponse> {
    const redirectUri = new URL(`${import.meta.env.BASE_URL}auth/google.html`, window.location.origin).toString();
    const state = crypto.randomUUID();
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: redirectUri,
      response_type: "token",
      scope: DRIVE_SCOPE,
      include_granted_scopes: "true",
      prompt: this.accessToken ? "" : "consent",
      state
    });
    const authUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`;
    const dialogUrl = `${redirectUri}?authUrl=${encodeURIComponent(authUrl)}&state=${encodeURIComponent(state)}`;

    return new Promise<TokenResponse>((resolve, reject) => {
      Office.context.ui.displayDialogAsync(
        dialogUrl,
        { height: 60, width: 40, promptBeforeOpen: false },
        (asyncResult) => {
          if (asyncResult.status === Office.AsyncResultStatus.Failed) {
            reject(new Error(`Could not open Google sign-in dialog: ${asyncResult.error.message}`));
            return;
          }

          const dialog = asyncResult.value;
          const cleanup = () => {
            dialog.close();
          };

          dialog.addEventHandler(Office.EventType.DialogMessageReceived, (event) => {
            const message = "message" in event ? event.message : "";
            try {
              const payload = JSON.parse(message) as TokenResponse & { state?: string };
              cleanup();
              if (payload.state && payload.state !== state) {
                reject(new Error("Google authorization returned an invalid state."));
                return;
              }
              resolve(payload);
            } catch {
              cleanup();
              reject(new Error("Google authorization returned an unreadable response."));
            }
          });

          dialog.addEventHandler(Office.EventType.DialogEventReceived, (event) => {
            cleanup();
            const errorCode = "error" in event ? event.error : "unknown";
            reject(new Error(`Google sign-in dialog closed before authorization completed. Event ${errorCode}.`));
          });
        }
      );
    });
  }
}
