# Construction Receipts Excel Add-in

This is a standalone Microsoft Excel Office.js add-in for attaching and managing receipts or documents against construction expense rows. It lives separately from the main Construction Manager Next.js app so it can be developed, sideloaded, and deployed independently.

## What It Does

- Initializes hidden workbook metadata tables: `__Documents`, `__ExpenseDocumentLinks`, and `__Settings`.
- Treats documents as separate records from expenses.
- Supports many-to-many links: one expense can have multiple documents, and one document can support multiple expense rows.
- Generates stable IDs such as `EXP-000001` and `DOC-000001`.
- Stores compact receipt counts in the visible receipt column instead of long URLs or file payloads.
- Provides a task pane for attaching files, viewing linked documents, linking existing documents, unlinking documents, managing documents, and saving workbook column mappings.

## Where The Add-in Lives

The add-in does not live inside the workbook. The workbook stores only hidden metadata sheets and the visible receipt counts. In development, Excel loads the add-in web app from the local dev server at `https://localhost:5173`, so `npm run dev` must be running whenever you use it.

For everyday use without starting a dev server, deploy the built `dist` folder to a stable HTTPS host and update `manifest.xml` to point to that host. Google Drive or another durable storage provider is recommended before using this as a production archive.

## Google Drive Storage

Google Drive storage is available from the `Settings` tab. When enabled, new attachments are uploaded to Google Drive and the workbook stores the Drive file ID, Drive URL, document ID, hash, supplier/date metadata, and the many-to-many expense links.

### Google Cloud Setup

1. Open Google Cloud Console.
2. Create or choose a project.
3. Enable the Google Drive API.
4. Configure the OAuth consent screen.
5. Create an OAuth Client ID for a web application.
6. Add this authorized JavaScript origin for local development:

```text
https://localhost:5173
```

7. Add this authorized redirect URI for local development:

```text
https://localhost:5173/auth/google.html
```

8. Copy the OAuth Client ID.
9. Create or choose a Google Drive folder for receipts.
10. Copy the folder ID from the folder URL. In a URL like:

```text
https://drive.google.com/drive/folders/ABC123
```

the folder ID is:

```text
ABC123
```

### Add-in Settings

In the task pane `Settings` tab:

- `Storage provider`: choose `Google Drive`.
- `Google OAuth Client ID`: paste the OAuth Client ID.
- `Google Drive folder ID`: paste the target receipt folder ID. If blank, uploads go to the signed-in user's Drive root.

Click `Save Settings`.

### Drive Workflow

When you attach a receipt:

1. The add-in opens Google sign-in in an Office dialog the first time.
2. The selected file uploads to the configured Drive folder.
3. The uploaded file is named with the document ID, expense date, and original extension, such as `DOC-000001_2026-09-01.jpg` or `DOC-000002_2026-09-03.pdf`.
4. The workbook stores the Drive file ID and open URL in `__Documents`.
5. The selected expense rows are linked in `__ExpenseDocumentLinks`.

When you press `Open` on a Google Drive-backed receipt, the add-in opens the Drive file URL in the browser. Local IndexedDB receipts still preview inside the task pane where supported.

If your visible worksheet includes a column configured as `Receipt IDs`, the add-in writes searchable document IDs there. When exactly one linked document has a Google Drive URL, that cell becomes a hyperlink to the Drive file. When multiple documents are linked, the cell shows plain text such as `DOC-000001; DOC-000004`, and the task pane remains the best place to open individual receipts.

For payments without a receipt, select the expense row and click `Cash`. The add-in creates a `DOC-` record marked `Cash / No Receipt`, links it to the selected expense row, and shows `Cash` in the receipt indicator when the row has only cash/no-receipt markers.

## Architecture

The add-in is split by responsibility:

- `src/ui`: React task pane.
- `src/excel`: Office.js workbook setup and repository code.
- `src/storage`: storage provider abstraction and the MVP IndexedDB provider.
- `src/services`: document workflow, hashing, IDs, and reconciliation.
- `src/types`: shared TypeScript models.
- `tests`: pure TypeScript unit tests for logic that does not require Excel.

The workbook stores metadata only. File storage is handled by a `StorageProvider` so a future `GoogleDriveStorageProvider` can be added without rewriting the Excel relationship model.

## Prerequisites

- Node.js 20 or newer.
- Microsoft Excel desktop with Office add-in sideloading enabled.
- A workbook with either a normal worksheet range or an Excel table. Table mode is optional.
- Range mode expects a header row with columns such as:
  - `Expense ID`
  - `Date`
  - `Supplier`
  - `Description`
  - `Category`
- `Amount`
- `Receipt`
- `Receipt IDs`

## Installation

```powershell
cd "C:\Users\user\Documents\Construction Project Manager\excel-receipt-addin"
npm install
```

## Development

Install and verify the trusted Office add-in development certificate:

```powershell
npm run cert:install
npm run cert:verify
```

If Excel shows `The content is blocked because it isn't signed by a valid security certificate`, close Excel completely, run the two commands above, restart the dev server, and sideload the manifest again.

```powershell
npm run dev
```

The development task pane runs at:

```text
https://localhost:5173/index.html
```

The manifest is:

```text
C:\Users\user\Documents\Construction Project Manager\excel-receipt-addin\manifest.xml
```

Office add-ins require HTTPS. This project uses `office-addin-dev-certs` so Vite serves the task pane with a localhost certificate trusted by Windows and Office.

## Sideloading In Desktop Excel

1. Start the dev server with `npm run dev`.
2. Open Excel.
3. Open or create the expense workbook.
4. Use Excel's add-in sideloading flow for your Office installation and select `manifest.xml`.
5. Open the `Construction Receipts` task pane from the ribbon.
6. Click `Settings` and confirm the expense worksheet, header row, and column names. Leave `Expense table` blank unless your expenses are already formatted as an Excel table.
7. Select a cell in one or more expense rows.
8. Click `Attach Document`, choose a file, then confirm the visible `Receipt` column updates.
9. Select the same or another row and use `Manage` to link the existing document.

## Sample Workbook

Create a worksheet named `Expenses` and add headers:

| Expense ID | Date | Supplier | Description | Category | Amount | Receipt |
| --- | --- | --- | --- | --- | ---: | --- |
|  | 31 Aug 2026 | ABC Hardware | Cement | Materials | 2400 |  |
|  | 31 Aug 2026 | ABC Hardware | Nails | Materials | 350 |  |
|  | 31 Aug 2026 | ABC Hardware | Paint | Materials | 900 |  |

If `Expense ID` is blank, the add-in generates one when the row is selected.

## Range Mode Without Excel Tables

You do not have to convert your expense area into an Excel table for the MVP. In the add-in `Settings` tab:

- `Expense worksheet`: the sheet name that contains expenses. Leave blank to use the active sheet.
- `Expense table`: leave blank for range mode.
- `Header row`: the 1-based row number containing column names. Example: `1`.
- `First data row`: the first expense row. Example: `2`.
- `Last data row`: optional. Leave blank to use the worksheet's used range.
- Column fields: enter the exact visible header names, such as `Expense ID`, `Supplier`, `Amount`, and `Receipt`.
- `Receipt IDs column`: optional but recommended. Add a visible column such as `Receipt IDs`; the add-in will write `DOC-` IDs there and hyperlink the cell when there is exactly one Google Drive receipt.

In range mode, the add-in reads the used worksheet area, finds columns by header name, writes generated `EXP-` IDs into the configured `Expense ID` column, and writes compact receipt counts into the configured receipt/document column.

Range mode preserves your worksheet layout, but it is less structurally protected than table mode. If totals, notes, merged cells, or section headers are inside the used range, set `First data row` and `Last data row` carefully so the add-in only touches actual expense rows.

The task pane reads Excel's displayed text for date, item, supplier, description, and amount fields. This prevents Excel serial dates such as `46244` from appearing in the pane or in Google Drive filenames.

Selection changes refresh automatically. A short delay is normal because Excel raises a selection event, the add-in waits briefly to avoid duplicate events, then Office.js reads workbook data asynchronously.

## Hidden Metadata Tables

`__Documents` stores one row per physical document:

- `Document ID`
- `File Name`
- `Original File Name`
- `File Type`
- `Storage Key`
- `Storage URL`
- `SHA-256`
- `Supplier`
- `Document Date`
- `Document Total`
- `Created At`
- `Notes`

`__ExpenseDocumentLinks` stores the many-to-many relationship:

- `Expense ID`
- `Document ID`
- `Linked At`

`__Settings` stores schema version and workbook mapping.

## Current Storage Limitations

The MVP uses IndexedDB in the add-in browser runtime. This is local to the Office add-in webview profile and is reliable for a working local/reference-based MVP, but it is not the same as writing files into an arbitrary folder on disk.

Office.js does not allow an add-in to silently copy files to or open files from arbitrary local filesystem paths. The user must choose files through a browser file picker, and the add-in can store the selected file in browser-managed storage or upload it to a backend/cloud provider.

Images and PDFs preview inside the task pane. Other document types are downloaded from the add-in storage when opened.

For production, Google Drive or another durable provider should be added.

## Google Drive Later

Add a real `GoogleDriveStorageProvider` that implements:

- `saveFile`
- `openFile`
- `deleteFile`
- `getFileUrl`
- `fileExists`

The provider should upload into a project folder, return a stable Drive file ID or URL, and store that reference in `__Documents`. The workbook relationship tables should not need to change.

## Testing

Run tests:

```powershell
npm test
```

Run typecheck and production build:

```powershell
npm run typecheck
npm run build
```

## Manual Test Checklist

- First run creates `__Documents`, `__ExpenseDocumentLinks`, and `__Settings`.
- Selecting an expense row with no ID generates an `EXP-` ID.
- Attaching a PDF creates one `DOC-` record and one link.
- The visible receipt column shows `Attached: 1`.
- Selecting multiple rows and attaching one file links the same `DOC-` ID to all selected expenses.
- Linking an existing document to another row does not create a duplicate document record.
- Unlinking removes only the relationship, not the document record.
- Reattaching the same file warns that the file already exists.
- Opening a document from the task pane opens the stored file blob.
- Settings can map non-default table and column names.

## Troubleshooting

- If the task pane is blank, confirm the dev server is running and Excel trusts the localhost HTTPS endpoint.
- If selection detection fails, make sure the selected cell is inside the configured Excel table.
- If files cannot be opened after clearing Office/browser data, reattach them. IndexedDB storage lives in the local add-in runtime profile.
- If the receipt count does not update, check the configured receipt/document display column in Settings.

## Build And Deployment

```powershell
npm run build
```

Deploy the `dist` output to an HTTPS host and update every URL in `manifest.xml` from `https://localhost:5173` to the production origin.

GitHub Pages can host the built add-in because it is a static HTTPS site. If you use GitHub Pages, update `manifest.xml` to the GitHub Pages URL, update the Google OAuth authorized JavaScript origin and redirect URI to the same origin, and then load the updated manifest in Excel.

### GitHub Pages Setup For `kamoyafamily/excelreceipts`

This repository is configured to deploy the add-in to:

```text
https://kamoyafamily.github.io/excelreceipts/
```

Use this manifest for the hosted version:

```text
excel-receipt-addin/manifest.github.xml
```

Add these Google OAuth settings:

```text
Authorized JavaScript origin:
https://kamoyafamily.github.io

Authorized redirect URI:
https://kamoyafamily.github.io/excelreceipts/auth/google.html
```

First push:

```powershell
cd "C:\Users\user\Documents\Construction Project Manager"
git init
git add excel-receipt-addin .github
git commit -m "Add Excel receipt add-in"
git branch -M main
git remote add origin https://github.com/kamoyafamily/excelreceipts.git
git push -u origin main
```

For later updates:

```powershell
cd "C:\Users\user\Documents\Construction Project Manager"
git add excel-receipt-addin .github
git commit -m "Update Excel receipt add-in"
git push
```
