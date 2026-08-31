import React from 'react';
import { AlertTriangle, Info, CheckCircle2, HelpCircle, X, BellRing, Wallet } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  type?: 'confirm' | 'alert' | 'success' | 'warning';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Ya, Lanjutkan",
  cancelText = "Batal",
  isDestructive = false,
  type = 'confirm'
}) => {
  if (!isOpen) return null;

  const handleClose = () => {
    if (onCancel) onCancel();
    else onConfirm();
  };

  const getIconContainerStyle = () => {
    if (isDestructive) {
      return 'bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50';
    }
    if (type === 'success') {
      return 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50';
    }
    if (type === 'warning') {
      return 'bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50';
    }
    return 'bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50';
  };

  const renderIcon = () => {
    if (isDestructive) return <AlertTriangle size={24} />;
    if (type === 'success') return <CheckCircle2 size={24} />;
    if (type === 'warning') return <AlertTriangle size={24} />;
    return <Info size={24} />;
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm shadow-2xl p-6 border border-slate-200/80 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${getIconContainerStyle()}`}>
            {renderIcon()}
          </div>
          <button 
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <h3 className="font-black text-base text-slate-900 dark:text-white mb-2 leading-snug">{title}</h3>
        <div className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm mb-6 leading-relaxed font-normal">
          {message}
        </div>

        <div className="flex gap-2.5">
          {onCancel && (
            <button
              onClick={onCancel}
              className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-xs sm:text-sm transition-colors"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 font-extrabold rounded-2xl text-xs sm:text-sm text-white shadow-lg transition-all active:scale-95 ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                : type === 'warning'
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};


