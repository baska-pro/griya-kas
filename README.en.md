# GriyaKas v2.0.0

GriyaKas is a local-first personal and family finance PWA with transactions, multiple accounts, budgets, debts/receivables, savings goals, recurring bills, analytics, JSON/CSV backup, local PIN protection, and optional Google Sheets or Supabase synchronization.

## v2 highlights

- Modular React 19 + TypeScript UI.
- Automatic one-time migration from recognized GriyaKas v1 localStorage keys.
- v1-compatible backup restore normalization.
- PBKDF2-hashed local PIN with migration from the v1 hash and early-v2 plaintext preview format.
- Improved PWA packaging with local assets and runtime caching.
- Optional ID-based two-way cloud merge.

## Development

```bash
npm install
npm run typecheck
npm run build
npm run dev
```

Requires Node.js 20.19+.

## Security note

The app PIN is an interface lock, not full data-at-rest encryption. Supabase anon keys are public client keys; protect financial data with a private project and appropriate RLS. Google Apps Script Web App URLs should also be treated as sensitive endpoints.

See [README.md](README.md), [SECURITY.md](SECURITY.md), and [docs/CLOUD_SYNC.md](docs/CLOUD_SYNC.md).

## License

BASKA-PRO PERSONAL USE LICENSE Version 1.0.
