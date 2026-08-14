# Construction Manager

Construction Manager is a private residential construction-management PWA. It is being built in controlled phases with exact financial arithmetic, append-only inventory movements, explicit authorization, private document storage, deterministic reports, and independently restorable encrypted backups.

## Local foundation

Requirements: Node.js 20.9 or newer and npm.

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open `http://localhost:3000` to preview the current responsive dashboard shell. It renders without external services; live authenticated data and Google-dependent actions remain unavailable until their development configuration is added. Never put real secret values into documentation or chat.

Local database development requires Docker Desktop:

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
