import React from 'react';
import { 
  Home, 
  ReceiptText, 
  Plus, 
  Target, 
  BarChart3, 
  Settings 
} from 'lucide-react';
import { MainTab, ThemeColor } from '../types';

interface NavbarProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  onOpenNewTransaction: () => void;
  themeColor: ThemeColor;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onOpenNewTransaction,
  themeColor
}) => {
  const getThemeClass = (isActive: boolean) => {
    if (!isActive) return 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300';
    
    switch (themeColor) {
      case 'emerald': return 'text-emerald-600 dark:text-emerald-400 font-bold';
      case 'blue': return 'text-blue-600 dark:text-blue-400 font-bold';
      case 'violet': return 'text-violet-600 dark:text-violet-400 font-bold';
      case 'rose': return 'text-rose-600 dark:text-rose-400 font-bold';
      case 'amber': return 'text-amber-600 dark:text-amber-400 font-bold';
      case 'cyan': return 'text-cyan-600 dark:text-cyan-400 font-bold';
      case 'slate': return 'text-slate-800 dark:text-slate-200 font-bold';
      default: return 'text-emerald-600 dark:text-emerald-400 font-bold';
    }
  };

  const getAddButtonBg = () => {
    switch (themeColor) {
      case 'emerald': return 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/40';
      case 'blue': return 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/40';
      case 'violet': return 'bg-violet-600 hover:bg-violet-700 shadow-violet-600/40';
      case 'rose': return 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/40';
      case 'amber': return 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/40';
      case 'cyan': return 'bg-cyan-600 hover:bg-cyan-700 shadow-cyan-600/40';
      case 'slate': return 'bg-slate-700 hover:bg-slate-800 shadow-slate-700/40';
      default: return 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/40';
    }
  };

  return (
    <nav className="shrink-0 sticky bottom-0 left-0 right-0 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 px-3 pt-1.5 pb-2.5 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-around relative max-w-md mx-auto">
        {/* Beranda */}
        <button
          onClick={() => onTabChange('DASHBOARD')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all ${getThemeClass(activeTab === 'DASHBOARD')}`}
        >
          <Home size={20} strokeWidth={activeTab === 'DASHBOARD' ? 2.5 : 1.8} />
          <span className="text-[10px] tracking-tight">Beranda</span>
        </button>

        {/* Transaksi */}
        <button
          onClick={() => onTabChange('TRANSACTIONS')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all ${getThemeClass(activeTab === 'TRANSACTIONS')}`}
        >
          <ReceiptText size={20} strokeWidth={activeTab === 'TRANSACTIONS' ? 2.5 : 1.8} />
          <span className="text-[10px] tracking-tight">Transaksi</span>
        </button>

        {/* Center '+' Catat Button */}
        <div className="relative -top-5 flex flex-col items-center">
          <button
            onClick={onOpenNewTransaction}
            className={`w-13 h-13 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform active:scale-90 hover:scale-105 ${getAddButtonBg()}`}
            title="Catat Transaksi Baru"
          >
            <Plus size={28} strokeWidth={2.6} />
          </button>
          <span className="text-[9px] font-bold mt-1 text-slate-500 dark:text-slate-400">Catat</span>
        </div>

        {/* Rencana */}
        <button
          onClick={() => onTabChange('PLANNING')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all ${getThemeClass(activeTab === 'PLANNING')}`}
        >
          <Target size={20} strokeWidth={activeTab === 'PLANNING' ? 2.5 : 1.8} />
          <span className="text-[10px] tracking-tight">Rencana</span>
        </button>

        {/* Laporan / Analisis */}
        <button
          onClick={() => onTabChange('ANALYTICS')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all ${getThemeClass(activeTab === 'ANALYTICS')}`}
        >
          <BarChart3 size={20} strokeWidth={activeTab === 'ANALYTICS' ? 2.5 : 1.8} />
          <span className="text-[10px] tracking-tight">Laporan</span>
        </button>

        {/* Pengaturan */}
        <button
          onClick={() => onTabChange('SETTINGS')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all ${getThemeClass(activeTab === 'SETTINGS')}`}
        >
          <Settings size={20} strokeWidth={activeTab === 'SETTINGS' ? 2.5 : 1.8} />
          <span className="text-[10px] tracking-tight">Opsi</span>
        </button>
      </div>
    </nav>
  );
};
