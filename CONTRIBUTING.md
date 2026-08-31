# Contributing

## Local validation

Before submitting changes:

```bash
npm install
npm run check
```

`npm run check` runs TypeScript validation followed by the production Vite build. Keep Node.js at **20.19+** as required by `package.json`.

## Repository rules

- Do not commit real financial records, receipts, private cloud endpoints, API credentials, access keys, or generated build folders.
- Keep the app local-first and keep third-party runtime dependencies intentional and documented.
- Keep `VERSION`, `package.json`, `CHANGELOG.md`, release notes, and release tags consistent when publishing a release.
- `code.gs` is the canonical Google Apps Script source. The in-app **Salin Kode GAS** action imports that file directly through Vite `?raw`; do not create a second embedded copy.
- Run the same validation used by CI before pushing substantial changes.
