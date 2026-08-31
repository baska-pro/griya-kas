# Cloud Sync

Cloud sync bersifat opsional. Selalu buat backup JSON lokal sebelum mengubah konfigurasi database.

## Google Sheets
Gunakan `code.gs` pada Spreadsheet milik sendiri. URL Web App yang bisa membaca/menulis data sebaiknya diperlakukan sebagai endpoint sensitif dan tidak dipublikasikan.

## Supabase
Gunakan project Supabase pribadi. `anon key` bukan secret; keamanan harus berasal dari RLS/policy dan isolasi project. Template SQL di aplikasi bersifat sederhana untuk penggunaan personal. Jangan gunakan policy permisif tersebut pada project bersama yang berisi data lain.

## Merge
GriyaKas menggabungkan record berdasarkan ID dan mempertahankan beberapa progress field seperti cicilan/paid months. Ini mengurangi risiko overwrite, tetapi bukan pengganti backup/version history. Konflik edit pada record ID yang sama tetap dapat menghasilkan salah satu versi menjadi dominan.
