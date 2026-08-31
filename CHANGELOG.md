# Changelog

## 1.0.0 - 2026-08-31

### Changed
- Nama aplikasi distandardisasi menjadi **GriyaKas**.
- PWA assets dipindahkan ke `public/` agar ikut masuk ke build Vite.
- Tailwind dipaketkan melalui Vite, tidak lagi bergantung pada runtime CDN/import map.
- Namespace storage baru menggunakan `griyakas_*` dengan kompatibilitas migrasi data lama.
- Backup JSON diberi `schemaVersion: 1` untuk mempermudah migrasi ke versi berikutnya.

### Fixed
- Menghapus PIN admin hardcoded dan menggantinya dengan PIN buatan pengguna berbasis PBKDF2.
- Factory reset hanya menghapus data GriyaKas, bukan seluruh LocalStorage origin.
- Rekap anggaran bulanan sekarang juga memeriksa tahun.
- Pembayaran hutang dan penarikan target dibatasi pada saldo/nilai yang tersedia.
- Import backup divalidasi dan merge mencegah duplikasi ID utama.
- CSV menggunakan escaping yang benar dan BOM UTF-8.
- `index.html` tidak lagi memiliki entry script ganda.
- Tipe `PersonType` disesuaikan dengan fitur anggota keluarga dinamis.
