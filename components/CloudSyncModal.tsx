import React, { useState } from 'react';
import { 
  X, 
  Cloud, 
  FileSpreadsheet, 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  RefreshCw, 
  UploadCloud, 
  DownloadCloud, 
  ExternalLink, 
  ShieldCheck, 
  HelpCircle,
  GitMerge,
  Sparkles,
  Users
} from 'lucide-react';
import { CloudSyncConfig, ThemeColor } from '../types';
import { GAS_SCRIPT_TEMPLATE, SUPABASE_SCHEMA_SQL } from '../config';
import { 
  testGoogleAppsScript, 
  pushToGoogleAppsScript, 
  pullFromGoogleAppsScript, 
  testSupabase, 
  pushToSupabase, 
  pullFromSupabase,
  smartSyncCloud
} from '../services/cloudSyncService';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: CloudSyncConfig;
  onSaveConfig: (cfg: CloudSyncConfig) => void;
  onDataRestored: () => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  themeColor: ThemeColor;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onDataRestored,
  onShowToast,
  themeColor
}) => {
  const [activeProvider, setActiveProvider] = useState<'GOOGLE_SHEETS' | 'SUPABASE'>('GOOGLE_SHEETS');
  
  // Google Sheets states
  const [gasEnabled, setGasEnabled] = useState(config.googleSheets.enabled);
  const [gasUrl, setGasUrl] = useState(config.googleSheets.webAppUrl);
  const [gasAutoSync, setGasAutoSync] = useState(config.googleSheets.autoSync);
  
  // Supabase states
  const [supaEnabled, setSupaEnabled] = useState(config.supabase.enabled);
  const [supaUrl, setSupaUrl] = useState(config.supabase.projectUrl);
  const [supaKey, setSupaKey] = useState(config.supabase.anonKey);
  const [supaAutoSync, setSupaAutoSync] = useState(config.supabase.autoSync);

  // Status & loading
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [testStatus, setTestStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Copied states
  const [copiedGas, setCopiedGas] = useState(false);
  const [copiedSupa, setCopiedSupa] = useState(false);

  if (!isOpen) return null;

  const handleCopyGas = () => {
    navigator.clipboard.writeText(GAS_SCRIPT_TEMPLATE);
    setCopiedGas(true);
    setTimeout(() => setCopiedGas(false), 2500);
    onShowToast("Kode Google Apps Script berhasil disalin!", 'success');
  };

  const handleCopySupa = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopiedSupa(true);
    setTimeout(() => setCopiedSupa(false), 2500);
    onShowToast("Kode SQL Supabase berhasil disalin!", 'success');
  };

  const handleSmartSyncNow = async (cfgToUse?: CloudSyncConfig) => {
    const currentCfg: CloudSyncConfig = cfgToUse || {
      googleSheets: {
        enabled: gasEnabled,
        webAppUrl: gasUrl.trim(),
        autoSync: gasAutoSync,
        lastSync: config.googleSheets.lastSync
      },
      supabase: {
        enabled: supaEnabled,
        projectUrl: supaUrl.trim(),
        anonKey: supaKey.trim(),
        autoSync: supaAutoSync,
        lastSync: config.supabase.lastSync
      }
    };

    setIsSyncing(true);
    try {
      const res = await smartSyncCloud(currentCfg);
      setIsSyncing(false);
      if (res.success) {
        onShowToast(res.message, 'success');
        onDataRestored();
      } else {
        onShowToast(res.message, 'error');
      }
    } catch (err: any) {
      setIsSyncing(false);
      onShowToast(`Gagal sinkronisasi: ${err.message}`, 'error');
    }
  };

  const handleSave = async () => {
    const newCfg: CloudSyncConfig = {
      googleSheets: {
        enabled: gasEnabled,
        webAppUrl: gasUrl.trim(),
        autoSync: gasAutoSync,
        lastSync: config.googleSheets.lastSync
      },
      supabase: {
        enabled: supaEnabled,
        projectUrl: supaUrl.trim(),
        anonKey: supaKey.trim(),
        autoSync: supaAutoSync,
        lastSync: config.supabase.lastSync
      }
    };
    onSaveConfig(newCfg);

    // If a provider is active, automatically perform initial smart sync & merge
    if ((gasEnabled && gasUrl.trim()) || (supaEnabled && supaUrl.trim() && supaKey.trim())) {
      onShowToast("Menyimpan & melakukan sinkronisasi awal...", 'info');
      await handleSmartSyncNow(newCfg);
    } else {
      onShowToast("Konfigurasi Cloud Sync tersimpan.", 'success');
    }

    onClose();
  };

  const handleTestGasConnection = async () => {
    setIsTesting(true);
    setTestStatus(null);
    const res = await testGoogleAppsScript(gasUrl);
    setTestStatus({ success: res.success, message: res.message });
    setIsTesting(false);
    if (res.success) {
      onShowToast("Koneksi ke Google Sheets berhasil!", 'success');
    }
  };

  const handleTestSupabaseConnection = async () => {
    setIsTesting(true);
    setTestStatus(null);
    const res = await testSupabase(supaUrl, supaKey);
    setTestStatus({ success: res.success, message: res.message });
    setIsTesting(false);
    if (res.success) {
      onShowToast("Koneksi ke Supabase berhasil!", 'success');
    }
  };

  return (
    <div className="fixed inset-0 z-[140] flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg max-h-[92vh] rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200/80 dark:border-slate-800">
        
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Cloud size={20} strokeWidth={2.4} />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-slate-900 dark:text-white">
                Setup Database Cloud Mandiri
              </h2>
              <p className="text-xs text-slate-400">Sinkronisasi multi-perangkat dengan kontrol konflik data</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3">
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <button
              onClick={() => {
                setActiveProvider('GOOGLE_SHEETS');
                setTestStatus(null);
              }}
              className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                activeProvider === 'GOOGLE_SHEETS'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <FileSpreadsheet size={15} /> Google Spreadsheet (GAS)
            </button>
            <button
              onClick={() => {
                setActiveProvider('SUPABASE');
                setTestStatus(null);
              }}
              className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                activeProvider === 'SUPABASE'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Database size={15} /> Supabase (PostgreSQL)
            </button>
          </div>
        </div>

        {/* Feature Highlights Banner */}
        <div className="mx-5 mt-2.5 p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 flex items-start gap-2.5 text-xs text-indigo-900 dark:text-indigo-200">
          <Sparkles size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <b>Sinkronisasi Cerdas 2-Arah:</b> Data lokal otomatis masuk ke database, data di database otomatis memperbarui aplikasi, dan jika keduanya ada data maka digabungkan tanpa ada yang hilang agar seluruh keluarga memiliki data kas yang sama!
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* PROVIDER 1: GOOGLE SHEETS */}
          {activeProvider === 'GOOGLE_SHEETS' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                    Status Google Spreadsheet Sync
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gasEnabled}
                      onChange={(e) => setGasEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Menyimpan otomatis transaksi ke dalam sheet Google Spreadsheet Anda melalui Webhook Apps Script gratis.
                </p>
              </div>

              {/* Web App URL Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                  Web App Deployment URL (Google Apps Script)
                </label>
                <input
                  type="url"
                  value={gasUrl}
                  onChange={(e) => setGasUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/XXXXX/exec"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:border-emerald-500"
                />
              </div>

              {/* Auto Sync Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-white block">Auto-Sync Realtime</span>
                  <span className="text-[10px] text-slate-400">Sinkronkan otomatis setiap ada transaksi atau perubahan data</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gasAutoSync}
                    onChange={(e) => setGasAutoSync(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Action Buttons: Test & Smart Sync */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleTestGasConnection}
                  disabled={isTesting || !gasUrl}
                  className="py-2.5 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={13} className={isTesting ? 'animate-spin' : ''} />
                  <span>{isTesting ? 'Menguji...' : 'Uji Koneksi'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSmartSyncNow()}
                  disabled={isSyncing || !gasUrl}
                  className="py-2.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 active:scale-95"
                >
                  <GitMerge size={14} className={isSyncing ? 'animate-spin' : ''} />
                  <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkron 2-Arah Sekarang'}</span>
                </button>
              </div>

              {/* Test Status Banner */}
              {testStatus && (
                <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  testStatus.success 
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' 
                    : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                }`}>
                  {testStatus.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  <span>{testStatus.message}</span>
                </div>
              )}

              {/* Quick Setup Instructions & Script Code */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-800 dark:text-white">
                    Panduan 3 Langkah Setup GAS
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyGas}
                    className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shadow-xs transition-colors"
                  >
                    {copiedGas ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedGas ? 'Tersalin!' : 'Salin Kode GAS'}</span>
                  </button>
                </div>

                <ol className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed">
                  <li>Buat Sheet baru di <b>sheets.new</b> &rarr; klik <b>Extensions</b> &rarr; <b>Apps Script</b>.</li>
                  <li>Paste kode GAS yang disalin di atas ke editor Apps Script.</li>
                  <li>Klik <b>Deploy</b> &rarr; <b>New deployment</b> &rarr; Pilih <b>Web app</b> &rarr; Ubah <i>Who has access</i>: <b>Anyone</b> &rarr; Salin URL hasil deploy ke kolom di atas.</li>
                </ol>
              </div>
            </div>
          )}

          {/* PROVIDER 2: SUPABASE */}
          {activeProvider === 'SUPABASE' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                    Status Supabase Database Sync
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={supaEnabled}
                      onChange={(e) => setSupaEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Penyimpanan berbasis PostgreSQL/REST pada project Supabase milik Anda. Keamanan akses mengikuti konfigurasi RLS dan policy project.
                </p>
              </div>

              {/* Supabase URL */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                  Project URL Supabase
                </label>
                <input
                  type="url"
                  value={supaUrl}
                  onChange={(e) => setSupaUrl(e.target.value)}
                  placeholder="https://xyzabcdefg.supabase.co"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:border-emerald-500"
                />
              </div>

              {/* Supabase Anon Key */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                  Anon Public API Key
                </label>
                <input
                  type="password"
                  value={supaKey}
                  onChange={(e) => setSupaKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:border-emerald-500"
                />
              </div>

              {/* Auto Sync Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-white block">Auto-Sync Realtime</span>
                  <span className="text-[10px] text-slate-400">Sinkronkan ke Supabase otomatis setiap ada transaksi baru</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={supaAutoSync}
                    onChange={(e) => setSupaAutoSync(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Action Buttons: Test & Smart Sync */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleTestSupabaseConnection}
                  disabled={isTesting || !supaUrl || !supaKey}
                  className="py-2.5 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={13} className={isTesting ? 'animate-spin' : ''} />
                  <span>{isTesting ? 'Menguji...' : 'Uji Koneksi'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSmartSyncNow()}
                  disabled={isSyncing || !supaUrl || !supaKey}
                  className="py-2.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 active:scale-95"
                >
                  <GitMerge size={14} className={isSyncing ? 'animate-spin' : ''} />
                  <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkron 2-Arah Sekarang'}</span>
                </button>
              </div>

              {/* Test Status */}
              {testStatus && (
                <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  testStatus.success 
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' 
                    : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                }`}>
                  {testStatus.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  <span>{testStatus.message}</span>
                </div>
              )}

              {/* Supabase SQL Setup instructions */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-800 dark:text-white">
                    Skrip Pembuatan Tabel SQL
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySupa}
                    className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shadow-xs transition-colors"
                  >
                    {copiedSupa ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedSupa ? 'Tersalin!' : 'Salin SQL'}</span>
                  </button>
                </div>

                <ol className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed">
                  <li>Buka dashboard <b>supabase.com</b> &rarr; klik menu <b>SQL Editor</b>.</li>
                  <li>Paste kode SQL di atas lalu klik tombol <b>RUN</b>.</li>
                  <li>Buka <b>Project Settings &gt; API</b> lalu salin <i>URL</i> & <i>anon key</i> ke form di atas.</li>
                </ol>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-xs transition-colors"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSyncing}
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl text-xs shadow-lg shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {isSyncing ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Menyinkronkan...</span>
              </>
            ) : (
              <span>Simpan & Sinkronkan</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
