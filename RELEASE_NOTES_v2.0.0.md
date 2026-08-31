# GriyaKas v2.0.0

Major upgrade from the v1 baseline.

## Highlights
- New modular interface for dashboard, transactions, planning, analytics, settings, and cloud sync.
- Budgets, debt/receivable installments, savings goals, recurring bills, richer accounts, and receipt attachments.
- Optional two-way Google Sheets and Supabase synchronization.
- Automatic localStorage migration from GriyaKas v1.
- Restore compatibility for recognized v1 backup structures.
- PWA/offline packaging improved with local assets and runtime cache.
- PIN storage hardened with PBKDF2 hashing and safe migration of prior PIN formats.
- Legacy generated scaffolding and unused external runtime imports removed.
- Local Vite/Tailwind build replaces CDN/import-map dependencies.

## Upgrade recommendation
Create a JSON backup in v1 before opening v2 for the first time. v2 performs a one-time non-destructive copy of recognized v1 browser data into v2 storage keys.

## Requirements
- Node.js 20.19+
- Modern Chromium, Firefox, or Safari-class browser

## License
BASKA-PRO PERSONAL USE LICENSE Version 1.0.
