import React from 'react';
import { 
  Eye, 
  EyeOff, 
  Cloud, 
  CloudCheck, 
  CloudOff, 
  RefreshCw, 
  Moon, 
  Sun, 
  Bell, 
  Wallet,
  CheckCircle2
} from 'lucide-react';
import { ThemeColor, CloudSyncConfig } from '../types';

interface HeaderProps {
  appName?: string;
  hideBalance: boolean;
  onToggleHideBalance: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  cloudSyncConfig: CloudSyncConfig;
  onTriggerSync: () => void;
  isSyncing: boolean;
  onOpenSyncModal: () => void;
  overdueCount: number;
  onOpenPlanning: () => void;
  themeColor: ThemeColor;
}

export const Header: React.FC<HeaderProps> = ({
  appName = "GriyaKas",
  hideBalance,
  onToggleHideBalance,
  darkMode,
  onToggleDarkMode,
  cloudSyncConfig,
  onTriggerSync,
  isSyncing,
  onOpenSyncModal,
  overdueCount,
  onOpenPlanning,
  themeColor
}) => {
  const isCloudEnabled = cloudSyncConfig.googleSheets.enabled || cloudSyncConfig.supabase.enabled;

  const getBrandAccent = () => {
    switch (themeColor) {
      case 'emerald': return 'from-emerald-600 to-teal-600';
      case 'blue': return 'from-blue-600 to-indigo-600';
      case 'violet': return 'from-violet-600 to-purple-600';
      case 'rose': return 'from-rose-600 to-pink-600';
      case 'amber': return 'from-amber-600 to-orange-600';
      case 'cyan': return 'from-cyan-600 to-blue-600';
      case 'slate': return 'from-slate-700 to-slate-900';
      default: return 'from-emerald-600 to-teal-600';
    }
  };

  return (
    <header className="shrink-0 px-4 py-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 z-30">
      <div className="flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-2xl bg-gradient-to-tr ${getBrandAccent()} flex items-center justify-center text-white shadow-md shadow-emerald-950/10`}>
            <Wallet size={18} strokeWidth={2.4} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                {appName}
              </h1>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Manajemen Keuangan Mandiri</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Cloud Sync Indicator Button */}
          <button
            onClick={isCloudEnabled ? onTriggerSync : onOpenSyncModal}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              isCloudEnabled
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 hover:bg-emerald-100'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
            title={isCloudEnabled ? "Sinkronkan Sekarang" : "Setup Cloud Sync (Spreadsheet/Supabase)"}
          >
            <RefreshCw 
              size={13} 
              className={`${isSyncing ? 'animate-spin text-emerald-600' : ''}`} 
            />
            <span className="text-[11px] hidden sm:inline">
              {isCloudEnabled ? (isSyncing ? 'Menyinkronkan...' : 'Cloud Aktif') : 'Setup Cloud'}
            </span>
          </button>

          {/* Overdue Reminder Alert */}
          {overdueCount > 0 && (
            <button
              onClick={onOpenPlanning}
              className="relative p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 hover:bg-amber-100 transition-colors"
              title={`${overdueCount} tagihan/hutang jatuh tempo`}
            >
              <Bell size={16} />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
                {overdueCount}
              </span>
            </button>
          )}

          {/* Privacy Toggle (Hide/Show Balance) */}
          <button
            onClick={onToggleHideBalance}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={hideBalance ? "Tampilkan Saldo" : "Sembunyikan Saldo"}
          >
            {hideBalance ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={darkMode ? "Mode Terang" : "Mode Gelap"}
          >
            {darkMode ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </div>
    </header>
  );
};
