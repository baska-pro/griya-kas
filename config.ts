import { Account, ThemeOption, ThemeColor } from './types';

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
  "Gaji Pokok / Upah",
  "Tunjangan & Lembur",
  "THR & Bonus",
  "Usaha / Dagang",
  "Freelance & Proyek",
  "Dividen & Investasi",
  "Bunga Tabungan / Deposito",
  "Sewa Properti / Kost",
  "Hadiah / Hibah",
  "Cashback & Refund",
  "Penjualan Barang Bekas",
  "Pemasukan Lainnya"
];

// 4. KATEGORI PENGELUARAN
export const DEFAULT_EXPENSE_CATEGORIES: string[] = [
  "Makanan & Minuman",
  "Belanja Sembako",
  "Listrik, Air & Gas",
  "Sewa / Cicilan Rumah",
  "Internet & Pulsa",
  "BBM & Tol",
  "Transportasi Umum & Ojol",
  "Servis Kendaraan",
  "Kesehatan & Obat",
  "Pendidikan & SPP",
  "Hiburan & Rekreasi",
  "Belanja Pakaian & Pribadi",
  "Kirim Uang Orang Tua / Keluarga",
  "Sedekah, Zakat & Donasi",
  "Cicilan Utang & Pinjaman",
  "Iuran & Pajak",
  "Tabungan & Investasi",
  "Perawatan Rumah",
  "Pengeluaran Lainnya"
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
export const GAS_SCRIPT_TEMPLATE = `/**
 * =========================================================================
 * GRIYAKAS - GOOGLE APPS SCRIPT (GAS) SYNC ENGINE
 * =========================================================================
 * Cara Pasang:
 * 1. Buat Google Sheet baru (misal: "GriyaKas Database").
 * 2. Klik menu 'Extensions' (Ekstensi) > 'Apps Script'.
 * 3. Hapus kode bawaan, lalu paste seluruh script ini.
 * 4. Klik 'Deploy' (Terapkan) > 'New deployment' (Penerapan baru).
 * 5. Pilih jenis: 'Web app' (Aplikasi web).
 * 6. Execute as: 'Me' (Saya).
 * 7. Who has access: 'Anyone' (Siapa saja).
 * 8. Klik 'Deploy', izinkan akses (Authorize access), lalu copy URL Web App.
 * 9. Masukkan Web App URL tersebut ke menu Pengaturan Cloud Sync di GriyaKas!
 * =========================================================================
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000);
  
  try {
    var contents = e.postData ? e.postData.contents : null;
    if (!contents) {
      return responseJSON({ success: false, message: "No data payload received" });
    }
    
    var payload = JSON.parse(contents);
    var action = payload.action || 'syncAll';
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (action === 'test') {
      return responseJSON({ 
        success: true, 
        message: "Koneksi Google Spreadsheet GriyaKas Berhasil Terhubung!",
        sheetTitle: ss.getName(),
        timestamp: new Date().toISOString()
      });
    }
    
    if (action === 'syncAll') {
      var data = payload.data;
      if (!data) return responseJSON({ success: false, message: "Data kosong" });
      
      // 1. Simpan Data Raw ke Sheet Backup
      var rawSheet = getOrCreateSheet(ss, "_RAW_BACKUP");
      rawSheet.clearContents();
      rawSheet.appendRow(["KEY", "VALUE", "UPDATED_AT"]);
      rawSheet.appendRow(["GRIYAKAS_DATA", JSON.stringify(data), new Date().toISOString()]);
      
      // 2. Tulis Transaksi ke Sheet 'Transaksi' agar rapi terbaca
      if (data.transactions && Array.isArray(data.transactions)) {
        var txSheet = getOrCreateSheet(ss, "Transaksi");
        txSheet.clearContents();
        txSheet.appendRow(["ID", "Tanggal", "Tipe", "Kategori", "Akun Sumber", "Akun Tujuan", "Anggota", "Nominal", "Keterangan", "Dibuat Pada"]);
        
        var rows = data.transactions.map(function(t) {
          return [
            t.id,
            t.date,
            t.type,
            t.category,
            t.accountId,
            t.targetAccountId || "-",
            t.person,
            t.amount,
            t.notes || "",
            t.createdAt ? new Date(t.createdAt).toISOString() : ""
          ];
        });
        
        if (rows.length > 0) {
          txSheet.getRange(2, 1, rows.length, 10).setValues(rows);
        }
      }
      
      // 3. Tulis Target Anggaran & Hutang
      if (data.debts && Array.isArray(data.debts)) {
        var debtSheet = getOrCreateSheet(ss, "Hutang_Piutang");
        debtSheet.clearContents();
        debtSheet.appendRow(["ID", "Nama/Kontak", "Tipe", "Nominal", "Status Lunas", "Jatuh Tempo", "Catatan"]);
        var dRows = data.debts.map(function(d) {
          return [d.id, d.name, d.type, d.amount, d.isPaid ? "LUNAS" : "BELUM LUNAS", d.dueDate || "-", d.notes || ""];
        });
        if (dRows.length > 0) {
          debtSheet.getRange(2, 1, dRows.length, 7).setValues(dRows);
        }
      }
      
      return responseJSON({ 
        success: true, 
        message: "Data berhasil disimpan ke Google Sheets!", 
        timestamp: new Date().toISOString(),
        totalTransactions: data.transactions ? data.transactions.length : 0
      });
    }
    
    if (action === 'fetchAll') {
      var rawSheet = ss.getSheetByName("_RAW_BACKUP");
      if (!rawSheet) {
        return responseJSON({ success: false, message: "Belum ada backup data di Spreadsheet ini." });
      }
      var rawVal = rawSheet.getRange(2, 2).getValue();
      if (!rawVal) {
        return responseJSON({ success: false, message: "Data backup kosong di sheet." });
      }
      
      var parsed = JSON.parse(rawVal);
      return responseJSON({ 
        success: true, 
        data: parsed,
        message: "Data berhasil diambil dari Google Sheets!"
      });
    }
    
    return responseJSON({ success: false, message: "Action tidak dikenal" });
  } catch (err) {
    return responseJSON({ success: false, message: "Error GAS: " + err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return responseJSON({ 
    status: "GriyaKas GAS Sync Webhook Active", 
    time: new Date().toISOString() 
  });
}

function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function responseJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

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
-- =========================================================================

-- Buat tabel penyimpanan data GriyaKas (Single-user atau Multi-device)
CREATE TABLE IF NOT EXISTS public.griyakas_storage (
    id TEXT PRIMARY KEY DEFAULT 'primary_vault',
    vault_name TEXT DEFAULT 'Brankas Utama GriyaKas',
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Aktifkan RLS (Row Level Security)
ALTER TABLE public.griyakas_storage ENABLE ROW LEVEL SECURITY;

-- Buat policy agar pengguna dengan anon key dapat membaca & menulis ke tabel ini
CREATE POLICY "Allow public anon access to griyakas_storage"
ON public.griyakas_storage
FOR ALL
USING (true)
WITH CHECK (true);

-- Buat index agar query responsif
CREATE INDEX IF NOT EXISTS idx_griyakas_storage_id ON public.griyakas_storage(id);

-- Insert record awal jika belum ada
INSERT INTO public.griyakas_storage (id, vault_name, payload)
VALUES ('primary_vault', 'Brankas Utama GriyaKas', '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;
`;

export const SUPABASE_SQL_SCHEMA_TEMPLATE = SUPABASE_SCHEMA_SQL;
