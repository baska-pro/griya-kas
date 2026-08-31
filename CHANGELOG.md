# Changelog

## 2.0.0 - 2026-08-31

### Added
- Modular dashboard, transaction, planning, analytics, settings, and cloud sync experience.
- Recurring bills, richer debt/payment flows, richer account metadata, and cloud sync providers.
- PWA manifest/service worker with same-origin runtime caching.
- Automatic GriyaKas v1 localStorage migration and v1-compatible backup normalization.
- Official v2 interface screenshot gallery under `assets/screenshots/` and in both README files.

### Security & reliability
- Replaced plaintext v2 preview PIN storage with PBKDF2 hashing and legacy PIN migration.
- Removed legacy generator/import-map scaffolding and unused external service metadata.
- Removed external Tailwind CDN/import-map runtime dependencies; CSS is built locally by Vite.
- Removed fake sample debt and recurring-bill records from production defaults.
- Added image type/size validation before receipt compression.
- Restore now validates/normalizes supported backup structures and restores settings.
- Reset now clears app settings, cloud config, PIN data, and recognized legacy keys.
- Repaired GitHub Actions workflow syntax and expanded version, repository-hygiene, credential, AI-removal, and screenshot checks.

## 1.0.0
- First GriyaKas baseline release.
