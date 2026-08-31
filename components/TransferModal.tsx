import React, { useState } from 'react';
import { X, ArrowRightLeft, Wallet, AlertCircle } from 'lucide-react';
import { Account, ThemeColor } from '../types';
import { parseNumber } from '../services/storageService';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  onTransfer: (fromAccountId: string, toAccountId: string, amount: number, notes?: string) => void;
  themeColor: ThemeColor;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onTransfer,
  themeColor
}) => {
  const [fromAccountId, setFromAccountId] = useState<string>(accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState<string>(accounts.length > 1 ? accounts[1].id : '');
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseNumber(amount);
    if (parsedAmount <= 0) {
      alert("Harap masukkan nominal transfer yang valid.");
      return;
    }

    if (!fromAccountId || !toAccountId) {
      alert("Pilih akun sumber dan akun tujuan.");
      return;
    }

    if (fromAccountId === toAccountId) {
      alert("Akun sumber dan akun tujuan tidak boleh sama.");
      return;
    }

    onTransfer(fromAccountId, toAccountId, parsedAmount, notes.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[125] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl p-6 border border-slate-200/80 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ArrowRightLeft size={20} strokeWidth={2.4} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Transfer Antar Akun</h3>
              <p className="text-xs text-slate-400">Pindahkan saldo antar rekening atau dompet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Source & Destination */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                Dari Akun (Sumber)
              </label>
              <select
                value={fromAccountId}
                onChange={(e) => setFromAccountId(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                Ke Akun (Tujuan)
              </label>
              <select
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none"
              >
                {accounts.filter(a => a.id !== fromAccountId).map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
              Nominal Transfer
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-extrabold text-slate-400">
                Rp
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={amount ? new Intl.NumberFormat('id-ID').format(parseNumber(amount)) : ''}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="0"
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-lg font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
              Catatan / Alasan Transfer
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Isi saldo e-wallet, tarik tunai, dll"
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all active:scale-95"
            >
              Kirim Transfer Saldo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
