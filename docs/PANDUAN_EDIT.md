# Panduan Edit Data Default GriyaKas v1

Data bawaan dapat diubah melalui `config.ts`:

- `THEMES`: pilihan tema warna.
- `ACCOUNTS`: akun/dompet default.
- `INCOME_CATEGORIES`: kategori pemasukan.
- `EXPENSE_CATEGORIES`: kategori pengeluaran.
- `PERSONS`: anggota keluarga default.

Setelah aplikasi pernah digunakan, perubahan data default tidak otomatis menimpa data yang sudah tersimpan di browser. Gunakan menu **Pengaturan → Kelola Data & Master** untuk mengelola data aktif.

Jangan mengubah `id` akun yang sudah pernah dipakai transaksi tanpa melakukan migrasi data karena transaksi menyimpan referensi berdasarkan `accountId`.
