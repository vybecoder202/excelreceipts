# Construction Manager

Construction Manager is becoming a configurable local workspace builder with **Data**, **Interfaces**, and **Forms**. The construction system is the first solution installed on top of that general engine. Typed fields, linked records, lookups, formulas, views, forms, and interface blocks all use the same PostgreSQL records.

## Preview and add test data

Requirements: Node.js 20.9 or newer, npm, and Docker Desktop.

```powershell
cd "C:\Users\user\Documents\Construction Project Manager"
npm run demo
```

Open `http://localhost:3000/sign-in`, choose **Open local demo**, and create a project if needed. In **Data**, install the Construction starter or create a blank table. The starter creates connected tables, two entry forms, multiple views, and a construction overview interface. Data persists locally between runs.

Useful builder checks:

1. Open an empty grid and confirm its field headers and blue inline add row remain visible.
2. Add a supplier in the inline row, then add an expense and link it to that supplier.
3. Confirm the linked supplier appears as a violet record chip.
4. Use Filter, Group, and Sort, then clear the active controls.
5. Drag a field header to reorder it. Right-click a field, row, or table to open its action menu.
6. Insert a row above or below, duplicate it, add a comment, and test a confirmed delete.
7. Add a lookup field that follows the Supplier link and returns Phone.
8. Open Forms and Interfaces and confirm submissions, record counts, and summaries update.

To intentionally erase all local demo data, stop the app and run `npm run demo:reset`.

## Local development

Install and verify dependencies, then use the local database commands when changing migrations:

```powershell
npm run db:start
npm run db:reset
npm run db:test
```

## Checks

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

See `docs/IMPLEMENTATION_PLAN.md` and `docs/IMPLEMENTATION_STATUS.md` for scope and current progress.
