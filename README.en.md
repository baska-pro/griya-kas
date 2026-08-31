# GriyaKas v2.0.0

GriyaKas is a local-first personal and family finance PWA with transactions, multiple accounts, budgets, debts/receivables, savings goals, recurring bills, analytics, JSON/CSV backup, local PIN protection, and optional Google Sheets or Supabase synchronization.

> [README Bahasa Indonesia](README.md)

## Screenshots

The screenshots below use absolute raw image URLs so they render consistently on GitHub and external Markdown renderers. Click an image to open its full-resolution repository file.

| Dashboard | Transactions |
| --- | --- |
| [![GriyaKas Dashboard](https://raw.githubusercontent.com/baska-pro/griya-kas/main/assets/screenshots/dashboard.jpg)](https://github.com/baska-pro/griya-kas/blob/main/assets/screenshots/dashboard.jpg) | [![GriyaKas Transactions](https://raw.githubusercontent.com/baska-pro/griya-kas/main/assets/screenshots/transaksi.jpg)](https://github.com/baska-pro/griya-kas/blob/main/assets/screenshots/transaksi.jpg) |
| Net-worth, income/expense, member, and account/wallet overview. | Monthly filters, search, cash-flow summary, and transaction editing/deletion. |

| Master Data | Add Transaction |
| --- | --- |
| [![GriyaKas Master Data](https://raw.githubusercontent.com/baska-pro/griya-kas/main/assets/screenshots/masterdata.jpg)](https://github.com/baska-pro/griya-kas/blob/main/assets/screenshots/masterdata.jpg) | [![GriyaKas Add Transaction](https://raw.githubusercontent.com/baska-pro/griya-kas/main/assets/screenshots/catat.jpg)](https://github.com/baska-pro/griya-kas/blob/main/assets/screenshots/catat.jpg) |
| Manage accounts/wallets, income/expense categories, and family members. | Record income, expenses, transfers, categories, notes, and receipt photos. |

All full-resolution screenshots are stored in [`assets/screenshots/`](assets/screenshots/).

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
