# Security Policy

## Data model
GriyaKas is local-first. Financial data is stored in browser storage unless cloud sync is enabled.

## PIN
The local 4-digit PIN is PBKDF2-HMAC-SHA256 derived with a random salt. It is an application UI lock, not disk/database encryption. Anyone with control of the browser profile or device may still be able to inspect browser storage.

## Cloud sync
- Supabase `anon` keys are designed to be public client keys. Security must come from project isolation, RLS/policies, and access configuration.
- The bundled simple Supabase template is intended for a private personal project, not a shared public database.
- Google Apps Script Web App URLs can grant access to the backing spreadsheet; treat the URL as sensitive and do not publish it.

## Repository hygiene
Never commit real financial exports, receipts, database URLs, tokens, anon keys tied to private projects, private GAS URLs, or `.env` files.

