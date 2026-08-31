# GriyaKas

[![CI](https://github.com/baska-pro/griya-kas/actions/workflows/ci.yml/badge.svg)](https://github.com/baska-pro/griya-kas/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/baska-pro/griya-kas?style=flat-square)](https://github.com/baska-pro/griya-kas/releases/latest)
[![License: Baska-Pro Personal Use](https://img.shields.io/badge/License-Baska--Pro%20Personal%20Use%201.0-blue.svg?style=flat-square)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev/)

**GriyaKas v1.0.0** adalah aplikasi pencatatan keuangan pribadi dan keluarga berbasis browser dengan pendekatan **local-first**. Versi 1 ini menjadi baseline sebelum pengembangan GriyaKas v2.

## Fitur

- Pemasukan, pengeluaran, dan transfer antar akun.
- Multi akun/dompet dan multi anggota keluarga.
- Riwayat transaksi dan filter.
- Rekap bulanan dan visualisasi kategori.
- Anggaran kategori.
- Hutang dan piutang.
- Target tabungan.
- Foto bukti transaksi dengan kompresi lokal.
- Export JSON full backup dan CSV.
- Import/restore dengan validasi dasar dan deduplikasi ID.
- Tema warna dan dark mode.
- PWA/offline cache.
- PIN admin lokal berbasis PBKDF2 untuk pengelolaan master data.

## Privasi

Data keuangan disimpan di penyimpanan browser perangkat. Aplikasi tidak memiliki backend database untuk menerima data transaksi Anda.

> LocalStorage bukan brankas terenkripsi. Gunakan kunci layar perangkat, jangan menyimpan credential pada catatan transaksi, dan buat backup rutin.

## Menjalankan

Persyaratan: Node.js 20.19+

```bash
git clone https://github.com/baska-pro/griya-kas.git
cd griya-kas
npm install
npm run dev
```

Validasi dan build:

```bash
npm run typecheck
npm run build
```

## Data lama v1

Build ini dapat membaca key penyimpanan dari build awal dan memigrasikannya ke namespace `griyakas_*` agar data uji lama tidak langsung hilang setelah rename aplikasi.

## Backup

Gunakan menu backup di aplikasi sebelum:

- membersihkan data browser;
- mengganti perangkat;
- menguji versi baru;
- melakukan migrasi ke GriyaKas v2.

Format backup v1 menyertakan `schemaVersion: 1`, sehingga dapat dijadikan dasar migrasi ke versi berikutnya.

## Dokumentasi

- [Panduan instalasi](docs/INSTALLATION.md)
- [Panduan edit data default](docs/PANDUAN_EDIT.md)
- [Catatan migrasi v1](docs/MIGRATION_V1.md)
- [Security Policy](SECURITY.md)

## License

BASKA-PRO PERSONAL USE LICENSE Version 1.0. Lihat [LICENSE](LICENSE).
