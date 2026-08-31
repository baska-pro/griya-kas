export const LEGAL_CONTENT = {
  PRIVACY: {
    title: "Kebijakan Privasi",
    date: "Update Terakhir: Agustus 2026",
    sections: [
      {
        heading: "1. Komitmen Privasi & Kedaulatan Data",
        content: "GriyaKas dibangun dengan filosofi 'Local-First & User-Owned'. Semua data keuangan, nominal uang, mutasi rekening, dan foto bukti transaksi Anda 100% adalah milik Anda pribadi."
      },
      {
        heading: "2. Penyimpanan Lokal di Perangkat",
        content: "Secara default, data Anda disimpan langsung di memori browser / perangkat HP Anda (LocalStorage). Tidak ada pelacakan rahasia, tidak ada server pihak ketiga tersembunyi, dan tidak ada data yang dijual."
      },
      {
        heading: "3. Sinkronisasi Database Mandiri (BYOD)",
        content: "Fitur sinkronisasi cloud menggunakan konsep Bring Your Own Database (BYOD). Anda menghubungkan aplikasi secara langsung ke Google Spreadsheet pribadi Anda via Google Apps Script atau database Supabase pribadi Anda menggunakan kunci API Anda sendiri."
      },
      {
        heading: "4. Penggunaan Izin Perangkat",
        content: "Aplikasi hanya meminta izin kamera/galeri saat Anda ingin mengambil foto struk atau nota pembayaran sebagai lampiran transaksi secara sukarela."
      }
    ]
  },
  TERMS: {
    title: "Syarat & Ketentuan",
    date: "Berlaku Efektif: Agustus 2026",
    sections: [
      {
        heading: "1. Lisensi Penggunaan",
        content: "GriyaKas memberikan kebebasan penuh untuk menggunakan aplikasi ini demi keperluan pencatatan dan pengelolaan keuangan pribadi, rumah tangga, keluarga, maupun usaha mikro tanpa biaya tersembunyi."
      },
      {
        heading: "2. Cadangan & Keamanan Data",
        content: "Karena aplikasi ini berorientasi privasi mandiri, Anda disarankan untuk melakukan Ekspor Backup JSON secara berkala atau mengaktifkan fitur Cloud Sync ke Google Spreadsheet / Supabase agar data Anda tetap aman saat berganti perangkat."
      },
      {
        heading: "3. Tanggung Jawab Pengguna",
        content: "Kerahasiaan data di perangkat Anda dilindungi dengan fitur PIN Keamanan dan mode privasi. Pastikan perangkat Anda terkunci dengan baik saat tidak digunakan."
      }
    ]
  },
  DISCLAIMER: {
    title: "Penafian (Disclaimer)",
    date: "Harap Dibaca Dengan Seksama",
    sections: [
      {
        heading: "1. Alat Bantu Pencatatan Mandiri",
        content: "GriyaKas adalah alat bantu pencatatan, kalkulasi, dan visualisasi arus kas. Hasil analisa grafik, rasio tabungan, dan kalkulator disajikan berdasarkan input data Anda sendiri dan bukan merupakan nasihat investasi formal."
      },
      {
        heading: "2. Pembersihan Cache Browser",
        content: "Jika Anda melakukan pembersihan total data browser ('Clear All Data') pada ponsel tanpa cadangan Cloud Sync atau file JSON, data lokal dapat terhapus. Gunakan tombol 'Backup JSON' atau 'Sync Spreadsheet' untuk kenyamanan jangka panjang."
      }
    ]
  }
};
