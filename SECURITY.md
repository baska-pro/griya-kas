# Security Policy

GriyaKas v1 adalah aplikasi local-first dan tidak memiliki backend akun/database.

## Data lokal

Transaksi dan foto tersimpan di browser. LocalStorage tidak dienkripsi oleh GriyaKas. Jangan simpan password, token, private key, atau credential pada catatan transaksi.

## PIN Admin

PIN admin hanya berfungsi sebagai penghalang akses kasual pada perangkat yang sudah terbuka. PIN diturunkan dengan PBKDF2-SHA-256 dan salt acak, tetapi bukan pengganti keamanan perangkat/browser.

## Reporting

Jangan mengirim data keuangan asli, file backup produksi, atau screenshot yang memuat informasi pribadi melalui public issue.
