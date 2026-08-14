# BuildLedger

BuildLedger is the working title for a private residential construction-management PWA. It is being built in controlled phases with exact financial arithmetic, append-only inventory movements, explicit authorization, private document storage, deterministic reports, and independently restorable encrypted backups.

## Local foundation

Requirements: Node.js 20.9 or newer and npm.

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

The foundation can render without external services. Supabase and Google-dependent actions remain unavailable until their development configuration is added. Never put real secret values into documentation or chat.

## Checks

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

See `docs/IMPLEMENTATION_PLAN.md` and `docs/IMPLEMENTATION_STATUS.md` for scope and current progress.
