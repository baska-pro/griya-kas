# GriyaKas v1.0.0

Baseline public release of GriyaKas before the v2 migration.

## Highlights

- Local-first personal/family finance tracking.
- Multi-account and multi-person transactions.
- Monthly reports, budgets, debt/receivable tracking, and savings goals.
- Local receipt-photo storage with compression.
- JSON backup with `schemaVersion: 1` and CSV export.
- PWA/offline support.
- User-configured local admin PIN.
- Legacy v1 storage migration.

## Cleanup and hardening

- Fixed PWA build structure and duplicate script entry.
- Scoped factory reset to GriyaKas data only.
- Improved import validation, CSV generation, budget period calculation, and action amount bounds.

See `CHANGELOG.md` for details.
