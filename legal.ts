export const LEGAL_CONTENT = {
  PRIVACY: {
    title: "Kebijakan Privasi",
    date: "Versi 1.0.0",
    sections: [
      { heading: "1. Prinsip Local-First", content: "GriyaKas menyimpan data transaksi, pengaturan, master data, dan foto bukti secara lokal di browser perangkat Anda. Versi ini tidak memiliki server database aplikasi untuk menerima data keuangan Anda." },
      { heading: "2. Penyimpanan Data", content: "Data menggunakan penyimpanan browser (LocalStorage). GriyaKas tidak mengenkripsi isi transaksi secara terpisah. Keamanan data tetap bergantung pada keamanan perangkat, browser, dan akun sistem operasi yang Anda gunakan." },
      { heading: "3. Foto Bukti", content: "Foto yang dipilih dikompresi di perangkat sebelum disimpan sebagai bagian dari data lokal. Jangan menyimpan foto yang berisi informasi sensitif jika perangkat digunakan bersama." },
      { heading: "4. Backup", content: "Backup JSON dan CSV dibuat langsung di perangkat. Simpan file backup di lokasi yang aman dan lakukan backup berkala sebelum membersihkan data browser atau mengganti perangkat." }
    ]
  },
  TERMS: {
    title: "Syarat & Ketentuan",
    date: "Versi 1.0.0",
    sections: [
      { heading: "1. Penggunaan", content: "GriyaKas ditujukan sebagai alat bantu pencatatan keuangan pribadi atau keluarga. Pengguna bertanggung jawab atas data dan keputusan yang dibuat berdasarkan catatan di aplikasi." },
      { heading: "2. Keakuratan Data", content: "Saldo, grafik, rekap, anggaran, hutang/piutang, dan target tabungan dihitung dari data yang Anda masukkan. Pastikan transaksi dicatat dengan benar dan lakukan pemeriksaan berkala." },
      { heading: "3. Lisensi", content: "Kode sumber dan distribusi aplikasi mengikuti lisensi yang tercantum pada file LICENSE repository GriyaKas." }
    ]
  },
  DISCLAIMER: {
    title: "Disclaimer (Penafian)",
    date: "Versi 1.0.0",
    sections: [
      { heading: "1. Bukan Nasihat Keuangan", content: "GriyaKas adalah alat pencatatan dan visualisasi data. Informasi yang ditampilkan bukan nasihat keuangan, investasi, pajak, atau hukum profesional." },
      { heading: "2. Risiko Kehilangan Data", content: "Menghapus data situs/browser, membersihkan storage aplikasi, reset perangkat, atau kerusakan perangkat dapat menghapus data lokal. Pengembang tidak dapat memulihkan data yang tidak pernah dibackup." },
      { heading: "3. Ketersediaan", content: "Aplikasi disediakan sebagaimana adanya. Fitur browser, PWA, dan penyimpanan lokal dapat berperilaku berbeda tergantung browser serta perangkat." }
    ]
  }
};
