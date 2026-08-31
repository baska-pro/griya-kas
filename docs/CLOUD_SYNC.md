# Cloud Sync

Cloud sync bersifat opsional. Selalu buat backup JSON lokal sebelum mengubah konfigurasi database.

## Google Sheets

Gunakan `code.gs` pada Spreadsheet milik sendiri. Deployment Web App tetap membutuhkan **Who has access: Anyone** agar browser dapat mengaksesnya tanpa login Google, tetapi endpoint sebaiknya dilindungi dengan access key tambahan.

### Setup dasar

1. Buat Google Sheet baru, lalu buka **Extensions → Apps Script**.
2. Tempel seluruh isi `code.gs` dan deploy sebagai **Web app** dengan **Execute as: Me** serta **Who has access: Anyone**.
3. Salin URL `/exec` ke menu Cloud Sync GriyaKas.

### Proteksi access key yang disarankan

1. Di Apps Script buka **Project Settings → Script Properties**.
2. Tambahkan property bernama `GRIYAKAS_ACCESS_KEY`.
3. Isi dengan string acak panjang, disarankan minimal 32 karakter alfanumerik.
4. Tambahkan key ke URL Web App yang dimasukkan ke GriyaKas:

```text
https://script.google.com/macros/s/DEPLOYMENT_ID/exec?key=ACCESS_KEY_ANDA
```

Jika `GRIYAKAS_ACCESS_KEY` tidak dibuat, script tetap bekerja seperti versi lama untuk kompatibilitas. Namun URL `/exec` harus dianggap sensitif karena siapa pun yang mendapatkannya dapat mencoba mengakses endpoint. Jangan commit URL beserta key ke repository.

## Supabase

Gunakan project Supabase pribadi/dedicated. `anon key` bukan secret; keamanan harus berasal dari RLS/policy dan isolasi project. Template SQL bawaan sengaja menggunakan policy permisif supaya aplikasi personal tanpa sistem login dapat bekerja. Konsekuensinya, **siapa pun yang memiliki Project URL + anon key dapat membaca/menulis vault tersebut**.

Karena itu:

- gunakan project khusus GriyaKas, bukan database bersama;
- jangan menaruh Project URL dan anon key pribadi di repository atau screenshot;
- jangan menggunakan template policy permisif ini untuk aplikasi multi-user publik;
- untuk penggunaan publik/multi-user, tambahkan autentikasi Supabase dan policy per-user sebelum dipakai produksi.

## Merge

GriyaKas menggabungkan record berdasarkan ID dan mempertahankan beberapa progress field seperti cicilan/paid months. Ini mengurangi risiko overwrite, tetapi bukan pengganti backup/version history. Konflik edit pada record ID yang sama tetap dapat menghasilkan salah satu versi menjadi dominan.

## Pemulihan

Sebelum mengaktifkan cloud sync pada perangkat baru, buat backup JSON dari perangkat yang memiliki data paling lengkap. Setelah sinkronisasi pertama, periksa jumlah transaksi, rekening, hutang/piutang, target tabungan, dan tagihan sebelum menghapus backup lokal.
