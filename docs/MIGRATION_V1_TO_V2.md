# Migrasi GriyaKas v1 ke v2

1. Di v1, buat backup JSON terlebih dahulu.
2. Deploy/buka v2 pada origin/domain yang sama bila ingin migrasi localStorage otomatis.
3. Saat pertama dibuka, v2 menyalin key v1 yang dikenali ke key v2 apabila key v2 belum ada.
4. Data v1 tidak dihapus pada migrasi normal.
5. PIN v1 diverifikasi dengan hash lama lalu dipromosikan ke key PIN v2 setelah login berhasil.
6. Jika origin/domain berubah, gunakan menu Restore dan pilih backup JSON v1.

Migrasi otomatis mencakup transaksi, rekening, kategori, anggota, budget, hutang/piutang, target tabungan, dan preferensi tema/saldo yang tersedia di v1. Tagihan rutin adalah fitur v2 dan mulai kosong bila tidak terdapat data v2.
