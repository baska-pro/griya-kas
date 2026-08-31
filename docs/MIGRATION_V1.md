# Catatan Migrasi GriyaKas v1

Versi ini menggunakan `schemaVersion: 1` pada backup JSON dan namespace penyimpanan `griyakas_*`.

Saat GriyaKas v2 dikembangkan, pertahankan importer untuk format berikut:

```json
{
  "app": "GriyaKas",
  "schemaVersion": 1,
  "exportedAt": "ISO-8601",
  "transactions": [],
  "budgets": [],
  "debts": [],
  "goals": []
}
```

Versi 1 juga tetap dapat membaca key penyimpanan dari build sebelum rename dan memindahkan nilainya ke namespace GriyaKas.
