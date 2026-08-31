import React, { useState } from 'react';
import { 
  Cloud, 
  Database, 
  FileSpreadsheet, 
  Palette, 
  Lock, 
  Download, 
  Upload, 
  Trash2, 
  ShieldCheck, 
  FileText, 
  ChevronRight, 
  Eye, 
  EyeOff, 
  Moon, 
  Sun, 
  Users, 
  RefreshCw, 
  HelpCircle,
  ExternalLink,
  Layers,
  Check
} from 'lucide-react';
import { ThemeColor, CloudSyncConfig, GriyaKasExportData } from '../types';
import { THEME_OPTIONS } from '../config';
import { LEGAL_CONTENT } from '../legal';
import { ConfirmDialog } from './ConfirmDialog';
import { 
  downloadJSONBackup, 
  downloadCSVTransactions, 
  restoreFullAppData,
  normalizeBackupPayload
} from '../services/storageService';

interface SettingsViewProps {
  cloudSyncConfig: CloudSyncConfig;
  onOpenCloudSyncModal: () => void;
  onOpenMasterDataModal: () => void;
  themeColor: ThemeColor;
  onChangeThemeColor: (color: ThemeColor) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  hideBalance: boolean;
  onToggleHideBalance: () => void;
  hasPin: boolean;
  onOpenPinSetup: () => void;
  onRemovePin: () => void;
  transactionsCount: number;
  onTriggerSync: () => void;
  isSyncing: boolean;
  onDataRestored: () => void;
  onClearAllData: () => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onDownloadCSV: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  cloudSyncConfig,
  onOpenCloudSyncModal,
  onOpenMasterDataModal,
  themeColor,
  onChangeThemeColor,
  darkMode,
  onToggleDarkMode,
  hideBalance,
  onToggleHideBalance,
  hasPin,
  onOpenPinSetup,
  onRemovePin,
  transactionsCount,
  onTriggerSync,
  isSyncing,
  onDataRestored,
  onClearAllData,
  onShowToast,
  onDownloadCSV
}) => {
  const [legalModalKey, setLegalModalKey] = useState<'PRIVACY' | 'TERMS' | 'DISCLAIMER' | null>(null);
  const [restorePendingData, setRestorePendingData] = useState<GriyaKasExportData | null>(null);

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed: unknown = JSON.parse(String(event.target?.result || ''));
        const normalized = normalizeBackupPayload(parsed);
        if (!normalized) throw new Error('Format berkas backup tidak sesuai.');
        setRestorePendingData(normalized);
      } catch (err: any) {
        onShowToast(`Berkas tidak valid: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmRestore = () => {
    if (!restorePendingData) return;
    const success = restoreFullAppData(restorePendingData);
    if (success) {
      onShowToast("Data berhasil dipulihkan dari berkas JSON!", 'success');
      onDataRestored();
    } else {
      onShowToast("Gagal memulihkan data.", 'error');
    }
    setRestorePendingData(null);
  };

  const isCloudActive = cloudSyncConfig.googleSheets.enabled || cloudSyncConfig.supabase.enabled;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-24">
      {/* 1. CLOUD SYNC & DATABASE BANNER */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 text-white shadow-xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Cloud size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">Database Cloud Mandiri</h3>
              <p className="text-[11px] text-slate-400">
                {isCloudActive 
                  ? (cloudSyncConfig.googleSheets.enabled ? 'Google Sheets Aktif' : 'Supabase Aktif') 
                  : 'Penyimpanan Lokal (Belum Terhubung Cloud)'}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenCloudSyncModal}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
          >
            Setup Cloud
          </button>
        </div>

        {isCloudActive && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
            <span className="text-slate-400">
              Last Sync: {cloudSyncConfig.googleSheets.lastSync || cloudSyncConfig.supabase.lastSync 
                ? new Date(cloudSyncConfig.googleSheets.lastSync || cloudSyncConfig.supabase.lastSync!).toLocaleTimeString('id-ID')
                : 'Belum pernah'}
            </span>
            <button
              onClick={onTriggerSync}
              disabled={isSyncing}
              className="text-emerald-400 hover:underline flex items-center gap-1 font-bold"
            >
              <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
              {isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}
            </button>
          </div>
        )}
      </div>

      {/* 2. MASTER DATA SETTINGS */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-800/40">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Master Data & Akun
          </span>
        </div>

        <div
          onClick={onOpenMasterDataModal}
          className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Kelola Rekening & Kategori</h4>
              <p className="text-[11px] text-slate-400">Tambah/edit akun bank, pos kategori, dan anggota keluarga</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-400" />
        </div>
      </div>

      {/* 3. APPEARANCE & THEME */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-800/40">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Tampilan & Personalisasi
          </span>
        </div>

        {/* Theme Palette Chooser */}
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-white">
            <Palette size={16} className="text-emerald-600" />
            <span>Warna Aksen Aplikasi</span>
          </div>
          <div className="flex gap-2.5 overflow-x-auto pt-1 pb-1 no-scrollbar">
            {THEME_OPTIONS.map(t => {
              const isSelected = themeColor === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => onChangeThemeColor(t.id)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-2xl border transition-all ${
                    isSelected
                      ? 'border-slate-900 dark:border-white bg-slate-100 dark:bg-slate-800'
                      : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl ${t.badgeClass} flex items-center justify-center text-white shadow-xs`}>
                    {isSelected && <Check size={16} strokeWidth={3} />}
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dark Mode Toggle */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              {darkMode ? <Moon size={18} /> : <Sun size={18} />}
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Mode Gelap (Dark Mode)</h4>
              <p className="text-[11px] text-slate-400">Hemat baterai dan nyaman untuk mata</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={darkMode}
              onChange={onToggleDarkMode}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>
      </div>

      {/* 4. PRIVACY & SECURITY */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-800/40">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Privasi & Keamanan
          </span>
        </div>

        {/* Hide Balance Toggle */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              {hideBalance ? <EyeOff size={18} /> : <Eye size={18} />}
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Sembunyikan Saldo (Mode Privasi)</h4>
              <p className="text-[11px] text-slate-400">Samarkan nominal di tempat umum</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={hideBalance}
              onChange={onToggleHideBalance}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {/* PIN Lock Setup */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Lock size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Kunci PIN Aplikasi</h4>
              <p className="text-[11px] text-slate-400">
                {hasPin ? 'PIN 4-digit aktif' : 'Belum memasang PIN keamanan'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasPin && (
              <button
                onClick={onRemovePin}
                className="text-xs text-rose-500 font-bold hover:underline"
              >
                Hapus PIN
              </button>
            )}
            <button
              onClick={onOpenPinSetup}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors"
            >
              {hasPin ? 'Ganti PIN' : 'Pasang PIN'}
            </button>
          </div>
        </div>
      </div>

      {/* 5. BACKUP & EXPORT */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-800/40">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Cadangan & Ekspor Berkas
          </span>
        </div>

        {/* CSV Export */}
        <div 
          onClick={onDownloadCSV}
          className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Unduh Data Excel (CSV)</h4>
              <p className="text-[11px] text-slate-400">Ekspor mutasi transaksi untuk dibuka di Microsoft Excel</p>
            </div>
          </div>
          <Download size={16} className="text-slate-400" />
        </div>

        {/* JSON Backup */}
        <div 
          onClick={downloadJSONBackup}
          className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Download size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Cadangkan File JSON (Full Backup)</h4>
              <p className="text-[11px] text-slate-400">Simpan semua akun, anggaran, dan hutang ke berkas</p>
            </div>
          </div>
          <Download size={16} className="text-slate-400" />
        </div>

        {/* Restore JSON */}
        <label className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Upload size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Pulihkan dari Berkas JSON</h4>
              <p className="text-[11px] text-slate-400">Muat kembali cadangan data dari ponsel lain</p>
            </div>
          </div>
          <Upload size={16} className="text-slate-400" />
          <input
            type="file"
            accept=".json"
            onChange={handleRestoreFile}
            className="hidden"
          />
        </label>
      </div>

      {/* 6. LEGAL & ABOUT */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-800/40">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Legalitas & Ketentuan
          </span>
        </div>

        <div
          onClick={() => setLegalModalKey('PRIVACY')}
          className="p-3.5 px-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-200"
        >
          <span>Kebijakan Privasi Data</span>
          <ChevronRight size={14} className="text-slate-400" />
        </div>

        <div
          onClick={() => setLegalModalKey('TERMS')}
          className="p-3.5 px-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-200"
        >
          <span>Syarat & Ketentuan Penggunaan</span>
          <ChevronRight size={14} className="text-slate-400" />
        </div>

        <div
          onClick={() => setLegalModalKey('DISCLAIMER')}
          className="p-3.5 px-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-200"
        >
          <span>Penafian (Disclaimer)</span>
          <ChevronRight size={14} className="text-slate-400" />
        </div>
      </div>

      {/* 7. DANGER ZONE: CLEAR ALL DATA */}
      <div className="p-4 rounded-3xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-2">
        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-extrabold text-xs">
          <Trash2 size={16} />
          <span>Zona Bahaya: Reset Total</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Menghapus semua transaksi ({transactionsCount} data), rekening, dan rencana yang tersimpan di perangkat ini.
        </p>
        <button
          onClick={onClearAllData}
          className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
        >
          Reset Semua Data Aplikasi
        </button>
      </div>

      {/* LEGAL VIEWER MODAL */}
      {legalModalKey && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg max-h-[85vh] rounded-3xl p-6 shadow-2xl flex flex-col border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {LEGAL_CONTENT[legalModalKey].title}
                </h3>
                <span className="text-[10px] text-slate-400">{LEGAL_CONTENT[legalModalKey].date}</span>
              </div>
              <button
                onClick={() => setLegalModalKey(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                Tutup
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {LEGAL_CONTENT[legalModalKey].sections.map((sec, idx) => (
                <div key={idx} className="space-y-1">
                  <h4 className="font-bold text-slate-800 dark:text-white">{sec.heading}</h4>
                  <p>{sec.content}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setLegalModalKey(null)}
              className="w-full py-3 bg-slate-100 dark:bg-slate-800 font-bold rounded-xl text-xs"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}

      {/* RESTORE CONFIRMATION DIALOG */}
      <ConfirmDialog
        isOpen={!!restorePendingData}
        title="Pulihkan Cadangan Data?"
        type="warning"
        confirmText="Ya, Terapkan Cadangan"
        cancelText="Batal"
        message={
          <div className="space-y-2">
            <p>
              Ditemukan data cadangan dengan rincian:
            </p>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Jumlah Transaksi:</span>
                <span className="font-extrabold text-slate-900 dark:text-white">
                  {restorePendingData?.transactions?.length || 0} data
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jumlah Rekening:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {restorePendingData?.accounts?.length || 0} akun
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Waktu Cadangan:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {restorePendingData?.exportedAt ? new Date(restorePendingData.exportedAt).toLocaleString('id-ID') : '-'}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              Catatan: Data saat ini akan ditimpa dengan berkas cadangan yang dipilih.
            </p>
          </div>
        }
        onConfirm={handleConfirmRestore}
        onCancel={() => setRestorePendingData(null)}
      />

    </div>
  );
};
