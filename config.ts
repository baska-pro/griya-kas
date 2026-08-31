import GAS_SCRIPT_TEMPLATE_SOURCE from './code.gs?raw';
import { Account, ThemeColor } from './types';

// ============================================================================
// KONFIGURASI APLIKASI GRIYAKAS
// ============================================================================

export interface ThemeOptionItem {
  id: ThemeColor;
  name: string;
  label: string;
  value: ThemeColor;
  class: string;
  badgeClass: string;
  accent: string;
}

// 1. TEMA WARNA APLIKASI
export const THEMES: ThemeOptionItem[] = [
  { id: 'emerald', value: 'emerald', name: 'Hijau Zamrud', label: 'Emerald', class: 'bg-emerald-600', badgeClass: 'bg-emerald-600', accent: '#059669' },
  { id: 'blue', value: 'blue', name: 'Biru Samudra', label: 'Ocean Blue', class: 'bg-blue-600', badgeClass: 'bg-blue-600', accent: '#2563eb' },
  { id: 'rose', value: 'rose', name: 'Merah Cerise', label: 'Rose Pink', class: 'bg-rose-600', badgeClass: 'bg-rose-600', accent: '#e11d48' },
  { id: 'violet', value: 'violet', name: 'Ungu Bangsawan', label: 'Royal Violet', class: 'bg-violet-600', badgeClass: 'bg-violet-600', accent: '#7c3aed' },
  { id: 'amber', value: 'amber', name: 'Kuning Emas', label: 'Golden Amber', class: 'bg-amber-600', badgeClass: 'bg-amber-600', accent: '#d97706' },
  { id: 'cyan', value: 'cyan', name: 'Cyan Tropis', label: 'Tropical Cyan', class: 'bg-cyan-600', badgeClass: 'bg-cyan-600', accent: '#0891b2' },
  { id: 'slate', value: 'slate', name: 'Slate Minimalis', label: 'Dark Slate', class: 'bg-slate-700', badgeClass: 'bg-slate-700', accent: '#334155' },
];

export const THEME_OPTIONS = THEMES;

// 2. DAFTAR REKENING / DOMPET AWAL
export const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'acc_cash', name: 'Dompet Tunai (Cash)', type: 'Cash', icon: 'Wallet', color: 'bg-emerald-500', initialBalance: 0 },
  { id: 'acc_bca', name: 'Rekening Utama (Bank)', type: 'Rekening', icon: 'CreditCard', color: 'bg-blue-600', initialBalance: 0 },
  { id: 'acc_jago', name: 'Bank Jago (Kantong)', type: 'Rekening', icon: 'CreditCard', color: 'bg-amber-500', initialBalance: 0 },
  { id: 'acc_gopay', name: 'GoPay', type: 'E-money', icon: 'Smartphone', color: 'bg-sky-500', initialBalance: 0 },
  { id: 'acc_dana', name: 'DANA', type: 'E-money', icon: 'WalletCards', color: 'bg-blue-500', initialBalance: 0 },
  { id: 'acc_shopee', name: 'ShopeePay', type: 'E-money', icon: 'ShoppingBag', color: 'bg-orange-500', initialBalance: 0 },
  { id: 'acc_darurat', name: 'Dana Darurat', type: 'Dana Darurat', icon: 'ShieldCheck', color: 'bg-indigo-600', initialBalance: 0 },
  { id: 'acc_emas', name: 'Tabungan Investasi', type: 'Investasi', icon: 'TrendingUp', color: 'bg-teal-600', initialBalance: 0 },
];

// 3. KATEGORI PEMASUKAN
export const DEFAULT_INCOME_CATEGORIES: string[] = [
  'Gaji Pokok / Upah',
  'Tunjangan & Lembur',
  'THR & Bonus',
  'Usaha / Dagang',
  'Freelance & Proyek',
  'Dividen & Investasi',
  'Bunga Tabungan / Deposito',
  'Sewa Properti / Kost',
  'Hadiah / Hibah',
  'Cashback & Refund',
  'Penjualan Barang Bekas',
  'Pemasukan Lainnya',
];

// 4. KATEGORI PENGELUARAN
export const DEFAULT_EXPENSE_CATEGORIES: string[] = [
  'Makanan & Minuman',
  'Belanja Sembako',
  'Listrik, Air & Gas',
  'Sewa / Cicilan Rumah',
  'Internet & Pulsa',
  'BBM & Tol',
  'Transportasi Umum & Ojol',
  'Servis Kendaraan',
  'Kesehatan & Obat',
  'Pendidikan & SPP',
  'Hiburan & Rekreasi',
  'Belanja Pakaian & Pribadi',
  'Kirim Uang Orang Tua / Keluarga',
  'Sedekah, Zakat & Donasi',
  'Cicilan Utang & Pinjaman',
  'Iuran & Pajak',
  'Tabungan & Investasi',
  'Perawatan Rumah',
  'Pengeluaran Lainnya',
];

// 5. ANGGOTA KELUARGA / PENGGUNA
export const DEFAULT_PERSONS: { id: string; label: string }[] = [
  { id: 'AYAH', label: 'Ayah / Suami' },
  { id: 'IBU', label: 'Ibu / Istri' },
  { id: 'ANAK1', label: 'Anak 1' },
  { id: 'ANAK2', label: 'Anak 2' },
  { id: 'KELUARGA', label: 'Kas Bersama' },
];

// 6. SCRIPT GOOGLE APPS SCRIPT (GAS)
// Satu sumber kebenaran: tombol "Salin Kode GAS" memakai file code.gs langsung.
export const GAS_SCRIPT_TEMPLATE = GAS_SCRIPT_TEMPLATE_SOURCE;
export const GOOGLE_APPS_SCRIPT_TEMPLATE = GAS_SCRIPT_TEMPLATE;

// 7. SQL SCHEMA SIAP COPY UNTUK SUPABASE
export const SUPABASE_SCHEMA_SQL = `-- =========================================================================
-- GRIYAKAS - SUPABASE SQL SCHEMA
-- =========================================================================
-- Cara Pasang di Supabase:
-- 1. Buka dashboard Supabase Anda (https://supabase.com/dashboard).
-- 2. Pilih Project Anda, lalu buka menu 'SQL Editor'.
-- 3. Paste seluruh skrip SQL di bawah ini dan klik 'Run'.
-- 4. Buka Project Settings > API > Ambil Project URL dan 'anon' public key.
-- 5. Masukkan ke menu Pengaturan GriyaKas!
--
-- PERINGATAN KEAMANAN:
-- Policy di bawah memang permisif agar aplikasi personal tanpa login dapat bekerja.
-- Gunakan hanya pada project Supabase pribadi/dedicated untuk GriyaKas.
-- Jangan gunakan template ini pada project bersama atau database yang berisi data lain.
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.griyakas_storage (
    id TEXT PRIMARY KEY DEFAULT 'primary_vault',
    vault_name TEXT DEFAULT 'Brankas Utama GriyaKas',
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.griyakas_storage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public anon access to griyakas_storage" ON public.griyakas_storage;
CREATE POLICY "Allow public anon access to griyakas_storage"
ON public.griyakas_storage
FOR ALL
USING (true)
WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_griyakas_storage_id ON public.griyakas_storage(id);

INSERT INTO public.griyakas_storage (id, vault_name, payload)
VALUES ('primary_vault', 'Brankas Utama GriyaKas', '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;
`;

export const SUPABASE_SQL_SCHEMA_TEMPLATE = SUPABASE_SCHEMA_SQL;
