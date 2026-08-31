# Security Policy

## Data model

GriyaKas is local-first. Financial data is stored in browser storage unless cloud sync is enabled.

## PIN

The local 4-digit PIN is PBKDF2-HMAC-SHA256 derived with a random salt. It is an application UI lock, not disk/database encryption. Anyone with control of the browser profile or device may still be able to inspect browser storage.

## Cloud sync

- **Google Apps Script:** the Web App must normally be reachable as `Anyone`. Configure the optional `GRIYAKAS_ACCESS_KEY` Script Property and append `?key=...` to the Web App URL used by GriyaKas. This does not make the endpoint equivalent to a full authentication system, but it prevents an exposed deployment URL alone from granting read/write access.
- **Supabase:** `anon` keys are public client keys. The bundled template intentionally uses a permissive policy for a dedicated personal project. Anyone with the project URL and anon key can access the GriyaKas vault. Do not use that template in a shared/public database; use Supabase Auth and per-user RLS for multi-user/public deployments.
- Cloud sync credentials/configuration are stored locally in the browser when configured by the user. Treat the browser profile and device as sensitive.

## Repository hygiene

Never commit real financial exports, receipts, database URLs, access keys, tokens, anon keys tied to private projects, private GAS URLs, or `.env` files.

## Reporting a vulnerability

When reporting a security issue, avoid posting real financial data, cloud credentials, deployment URLs, or reproducible secrets in a public issue. Provide a minimal sanitized reproduction instead.
