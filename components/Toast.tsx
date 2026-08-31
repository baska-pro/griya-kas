import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => onClose(), 3500);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const bgStyles = {
    success: 'bg-emerald-900/95 text-emerald-100 border-emerald-500/40 shadow-emerald-950/50',
    error: 'bg-rose-900/95 text-rose-100 border-rose-500/40 shadow-rose-950/50',
    info: 'bg-slate-900/95 text-slate-100 border-slate-600/40 shadow-slate-950/50'
  };

  const IconComponent = {
    success: CheckCircle2,
    error: AlertTriangle,
    info: Info
  }[type];

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[200] max-w-[90vw] sm:max-w-md pointer-events-auto">
      <div 
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 transform scale-100 ${bgStyles[type]}`}
      >
        <IconComponent size={18} className="shrink-0" />
        <span className="text-xs font-semibold leading-tight flex-1">{message}</span>
        <button 
          onClick={onClose}
          className="p-1 rounded-lg opacity-70 hover:opacity-100 hover:bg-white/10 transition-opacity"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
