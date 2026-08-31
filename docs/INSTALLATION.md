# Instalasi GriyaKas v1

```bash
npm install
npm run dev
```

Build produksi:

```bash
npm run check
```

Output berada pada folder `dist/`. Konfigurasi Vite memakai `base: './'` agar hasil build lebih mudah dipasang pada subpath/static hosting.

Untuk PWA/offline, service worker hanya didaftarkan pada build produksi.
