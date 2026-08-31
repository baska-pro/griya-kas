
import { Account, PersonType, ThemeOption } from './types';

// ============================================================================
// PANDUAN SINGKAT:
// Ubah data di bawah ini untuk menyesuaikan aplikasi dengan kebutuhan Anda.
// ============================================================================

// 0. TEMA APLIKASI
export const THEMES: ThemeOption[] = [
  { name: 'Merah Putih', value: 'rose', class: 'bg-rose-600' }, // Default baru
  { name: 'Hijau Segar', value: 'emerald', class: 'bg-emerald-500' },
  { name: 'Biru Profesional', value: 'blue', class: 'bg-blue-500' },
  { name: 'Ungu Kreatif', value: 'violet', class: 'bg-violet-500' },
  { name: 'Kuning Ceria', value: 'amber', class: 'bg-amber-500' },
  { name: 'Cyan Modern', value: 'cyan', class: 'bg-cyan-500' },
  { name: 'Gelap Elegan', value: 'slate', class: 'bg-slate-600' },
];

// 1. DAFTAR AKUN / DOMPET
// Format: { id: 'unik', name: 'Nama Tampil', type: 'JENIS', icon: 'Ikon', color: 'Warna' }
export const ACCOUNTS: Account[] = [
  { id: 'acc_1', name: 'Dompet Tunai', type: 'Cash', icon: 'Wallet', color: 'bg-emerald-500' },
  { id: 'acc_2', name: 'Rekening Utama', type: 'Rekening', icon: 'CreditCard', color: 'bg-blue-600' },
  { id: 'acc_jago', name: 'Bank Jago', type: 'Rekening', icon: 'CreditCard', color: 'bg-orange-400' },
  { id: 'acc_sea', name: 'Seabank', type: 'Rekening', icon: 'CreditCard', color: 'bg-orange-600' },
  { id: 'acc_neo', name: 'NeoBank', type: 'Rekening', icon: 'CreditCard', color: 'bg-yellow-500' },
  { id: 'acc_4', name: 'GoPay', type: 'E-money', icon: 'Smartphone', color: 'bg-sky-400' },
  { id: 'acc_5', name: 'ShopeePay', type: 'E-money', icon: 'ShoppingBag', color: 'bg-orange-500' },
  { id: 'acc_6', name: 'OVO', type: 'E-money', icon: 'CircleDollarSign', color: 'bg-purple-500' },
  { id: 'acc_7', name: 'Dana', type: 'E-money', icon: 'WalletCards', color: 'bg-blue-400' },
];

// 2. KATEGORI PEMASUKAN
export const INCOME_CATEGORIES = [
  "Gaji / Upah",
  "Honor tetap",
  "Tunjangan",
  "THR / Bonus",
  "Freelance / Proyek",
  "Usaha Sampingan",
  "Komisi / Affiliate",
  "Jasa",
  "Penjualan Produk",
  "Laba Usaha",
  "Royalti",
  "Bunga Tabungan",
  "Dividen",
  "Capital Gain",
  "Sewa Properti",
  "Hadiah",
  "Hibah",
  "Warisan",
  "Undian",
  "Cashback",
  "Refund",
  "Jual Aset Pribadi"
];

// 3. KATEGORI PENGELUARAN
export const EXPENSE_CATEGORIES = [
  "Makanan & Minuman",
  "Sembako",
  "Air Minum & Gas",
  "Sewa / Cicilan Rumah",
  "Listrik & Air",
  "Internet & TV Kabel",
  "Iuran Lingkungan",
  "BBM",
  "Parkir & Tol",
  "Transport Umum",
  "Ojek Online",
  "Servis Kendaraan",
  "Pulsa & Data",
  "Langganan Aplikasi",
  "Obat-obatan",
  "Dokter / Klinik",
  "Asuransi Kesehatan",
  "SPP / Pendidikan",
  "Buku & Kursus",
  "Nongkrong / Hiburan",
  "Hobi",
  "Traveling",
  "Pakaian & Aksesoris",
  "Skincare & Grooming",
  "Kirim Orang Tua",
  "Arisan & Donasi",
  "Zakat / Sedekah",
  "Cicilan Utang",
  "Pajak & Admin Bank",
  "Tabungan / Investasi",
  "Perbaikan Mendadak",
  "Dana Darurat"
];

// 4. DAFTAR ORANG (PERSON)
// Digunakan untuk filter siapa yang melakukan transaksi
export const PERSONS: {id: PersonType, label: string}[] = [
  { id: 'SUAMI', label: 'Suami' },
  { id: 'ISTRI', label: 'Istri' },
  { id: 'ANAK1', label: 'Anak 1' },
  { id: 'ANAK2', label: 'Anak 2' },
];
