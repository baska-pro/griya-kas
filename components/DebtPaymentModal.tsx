import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  CreditCard, 
  Layers, 
  AlertCircle, 
  ArrowDownLeft, 
  ArrowUpRight, 
  CheckSquare, 
  Square,
  Sparkles,
  Calculator
} from 'lucide-react';
import { Debt, Account } from '../types';
import { formatIDR, parseNumber } from '../services/storageService';

interface DebtPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  debts: Debt[];
  initialSelectedDebtId?: string;
  initialDebtId?: string;
  initialMode?: 'SINGLE' | 'BATCH';
  accounts: Account[];
  hideBalance?: boolean;
  onSinglePay?: (debtId: string, amount: number, accountId: string) => void;
  onPaySingle?: (debtId: string, amount: number, accountId: string) => void;
  onBatchPay?: (payments: { debtId: string; payAmount: number }[], accountId: string) => void;
  onPayBatch?: (payments: { debtId: string; payAmount: number }[], accountId: string) => void;
}

export const DebtPaymentModal: React.FC<DebtPaymentModalProps> = ({
  isOpen,
  onClose,
  debts,
  initialSelectedDebtId,
  initialDebtId,
  initialMode = 'SINGLE',
  accounts,
  hideBalance = false,
  onSinglePay,
  onPaySingle,
  onBatchPay,
  onPayBatch
}) => {
  const unpaidDebts = debts.filter(d => !d.isPaid);
  const effectiveInitialId = initialDebtId || initialSelectedDebtId;

  const [mode, setMode] = useState<'SINGLE' | 'BATCH'>(initialMode);
  const [selectedDebtId, setSelectedDebtId] = useState<string>('');
  const [payAmount, setPayAmount] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  
  // Batch selection states
  const [batchSelections, setBatchSelections] = useState<Record<string, { selected: boolean; amount: number }>>({});

  const executeSinglePay = (dId: string, amt: number, accId: string) => {
    if (typeof onSinglePay === 'function') {
      onSinglePay(dId, amt, accId);
    } else if (typeof onPaySingle === 'function') {
      onPaySingle(dId, amt, accId);
    }
  };

  const executeBatchPay = (payments: { debtId: string; payAmount: number }[], accId: string) => {
    if (typeof onBatchPay === 'function') {
      onBatchPay(payments, accId);
    } else if (typeof onPayBatch === 'function') {
      onPayBatch(payments, accId);
    } else {
      payments.forEach(item => {
        executeSinglePay(item.debtId, item.payAmount, accId);
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      const activeId = effectiveInitialId && unpaidDebts.some(d => d.id === effectiveInitialId)
        ? effectiveInitialId
        : unpaidDebts[0]?.id || '';
      
      setSelectedDebtId(activeId);
      setMode(initialMode);
      setSelectedAccountId(accounts[0]?.id || '');

      const targetDebt = unpaidDebts.find(d => d.id === activeId);
      if (targetDebt) {
        const remaining = Math.max(0, targetDebt.amount - (targetDebt.paidAmount || 0));
        setPayAmount(String(remaining));
      } else {
        setPayAmount('');
      }

      // Initialize batch map
      const initialBatch: Record<string, { selected: boolean; amount: number }> = {};
      unpaidDebts.forEach(d => {
        const rem = Math.max(0, d.amount - (d.paidAmount || 0));
        initialBatch[d.id] = { selected: d.id === activeId, amount: rem };
      });
      setBatchSelections(initialBatch);
    }
  }, [isOpen, effectiveInitialId, initialMode, debts]);

  if (!isOpen) return null;

  const currentDebt = unpaidDebts.find(d => d.id === selectedDebtId);
  const currentRemaining = currentDebt ? Math.max(0, currentDebt.amount - (currentDebt.paidAmount || 0)) : 0;
  const isHutang = currentDebt ? (currentDebt.type === 'HUTANG_SAYA' || currentDebt.type === 'HUTANG') : true;

  // Percentage quick actions for single debt
  const handleSetPercent = (pct: number) => {
    if (!currentDebt) return;
    const calc = Math.round((currentRemaining * pct) / 100);
    setPayAmount(String(calc));
  };

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseNumber(payAmount);
    if (!currentDebt || num <= 0) {
      alert("Nominal pembayaran harus lebih dari 0.");
      return;
    }
    if (num > currentRemaining) {
      alert(`Nominal pembayaran melebihi sisa pinjaman (${formatIDR(currentRemaining, hideBalance)})`);
      return;
    }
    executeSinglePay(currentDebt.id, num, selectedAccountId);
    onClose();
  };

  // Batch submit
  const handleBatchToggle = (debtId: string) => {
    setBatchSelections(prev => {
      const current = prev[debtId] || { selected: false, amount: 0 };
      return {
        ...prev,
        [debtId]: { ...current, selected: !current.selected }
      };
    });
  };

  const handleBatchAmountChange = (debtId: string, val: string) => {
    const num = parseNumber(val);
    setBatchSelections(prev => {
      const current = prev[debtId] || { selected: true, amount: 0 };
      return {
        ...prev,
        [debtId]: { ...current, amount: num }
      };
    });
  };

  const selectedBatchItems = Object.entries(batchSelections)
    .filter(([_, val]) => val.selected && val.amount > 0)
    .map(([id, val]) => ({ debtId: id, payAmount: val.amount }));

  const totalBatchAmount = selectedBatchItems.reduce((sum, item) => sum + item.payAmount, 0);

  const handleBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBatchItems.length === 0) {
      alert("Pilih minimal satu pinjaman untuk dibayar.");
      return;
    }
    executeBatchPay(selectedBatchItems, selectedAccountId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <CreditCard size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Pembayaran Hutang &amp; Piutang
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pilih opsi pembayaran sebagian, lunas, atau beberapa item
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode Selector Tabs (Single / Batch) */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800">
          <div className="grid grid-cols-2 p-1 bg-slate-200/80 dark:bg-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => setMode('SINGLE')}
              className={`py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                mode === 'SINGLE'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CreditCard size={14} /> Satu Pinjaman (Sebagian / Full)
            </button>
            <button
              type="button"
              onClick={() => setMode('BATCH')}
              className={`py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                mode === 'BATCH'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers size={14} /> Bayar Beberapa Sekaligus ({unpaidDebts.length})
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {unpaidDebts.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Check size={40} className="mx-auto text-emerald-500" />
              <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                Semua Pinjaman Telah Lunas!
              </p>
              <p className="text-xs text-slate-400">
                Tidak ada hutang atau piutang aktif yang tertunda saat ini.
              </p>
            </div>
          ) : mode === 'SINGLE' ? (
            <form id="single-debt-form" onSubmit={handleSingleSubmit} className="space-y-4">
              {/* Select Target Debt */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                  Pilih Catatan Pinjaman
                </label>
                <select
                  value={selectedDebtId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedDebtId(id);
                    const d = unpaidDebts.find(item => item.id === id);
                    if (d) {
                      const rem = Math.max(0, d.amount - (d.paidAmount || 0));
                      setPayAmount(String(rem));
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {unpaidDebts.map(d => {
                    const rem = Math.max(0, d.amount - (d.paidAmount || 0));
                    const isHt = d.type === 'HUTANG_SAYA' || d.type === 'HUTANG';
                    return (
                      <option key={d.id} value={d.id}>
                        [{isHt ? 'HUTANG' : 'PIUTANG'}] {d.personName || d.name} - Sisa {formatIDR(rem, false)}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Debt Detail Card */}
              {currentDebt && (
                <div className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
                  isHutang 
                    ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/70 dark:border-rose-900/40' 
                    : 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/70 dark:border-blue-900/40'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-800 dark:text-slate-200">
                      {isHutang ? 'Hutang ke' : 'Piutang dari'}: {currentDebt.personName || currentDebt.name}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      isHutang ? 'bg-rose-200 text-rose-800 dark:bg-rose-900 dark:text-rose-200' : 'bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                      {isHutang ? 'Hutang Saya' : 'Piutang Orang'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800 text-[11px]">
                    <div>
                      <span className="text-slate-500 block">Total Pokok:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{formatIDR(currentDebt.amount, hideBalance)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Sisa Belum Dibayar:</span>
                      <span className="font-black text-rose-600 dark:text-rose-400">{formatIDR(currentRemaining, hideBalance)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Amount Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                    Nominal Pembayaran
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Sisa: {formatIDR(currentRemaining, hideBalance)}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    min="1"
                    max={currentRemaining}
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="0"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-black focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                </div>

                {/* Quick Presets: 25%, 50%, 75%, FULL */}
                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSetPercent(25)}
                    className="flex-1 py-1 px-2 rounded-xl text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    25% (Cicil)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetPercent(50)}
                    className="flex-1 py-1 px-2 rounded-xl text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    50% (Setengah)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetPercent(75)}
                    className="flex-1 py-1 px-2 rounded-xl text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    75%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetPercent(100)}
                    className="flex-1 py-1 px-2 rounded-xl text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/70 hover:bg-emerald-200 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40 transition-colors"
                  >
                    Full Lunas (100%)
                  </button>
                </div>
              </div>

              {/* Account Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                  {isHutang ? 'Bayar dari Rekening' : 'Terima ke Rekening'}
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.type})
                    </option>
                  ))}
                </select>
              </div>
            </form>
          ) : (
            /* BATCH MULTI-SELECT MODE */
            <form id="batch-debt-form" onSubmit={handleBatchSubmit} className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                  Pilih Pinjaman yang Ingin Diselesaikan
                </span>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  {selectedBatchItems.length} Dipilih
                </span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {unpaidDebts.map(d => {
                  const rem = Math.max(0, d.amount - (d.paidAmount || 0));
                  const isSelected = !!batchSelections[d.id]?.selected;
                  const curAmt = batchSelections[d.id]?.amount ?? rem;
                  const isHt = d.type === 'HUTANG_SAYA' || d.type === 'HUTANG';

                  return (
                    <div
                      key={d.id}
                      className={`p-3 rounded-2xl border transition-all text-xs space-y-2 ${
                        isSelected 
                          ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs' 
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 opacity-70'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleBatchToggle(d.id)}
                          className="flex items-center gap-2.5 min-w-0 text-left"
                        >
                          {isSelected ? (
                            <CheckSquare size={18} className="text-emerald-600 shrink-0" />
                          ) : (
                            <Square size={18} className="text-slate-400 shrink-0" />
                          )}
                          <div className="truncate">
                            <span className="font-black text-slate-900 dark:text-white block truncate">
                              {d.personName || d.name}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {isHt ? 'Hutang Saya' : 'Piutang'} • Sisa {formatIDR(rem, hideBalance)}
                            </span>
                          </div>
                        </button>

                        <span className="font-extrabold text-slate-900 dark:text-white shrink-0">
                          {formatIDR(curAmt, hideBalance)}
                        </span>
                      </div>

                      {isSelected && (
                        <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                          <span className="text-[10px] text-slate-500 shrink-0">Nominal:</span>
                          <input
                            type="number"
                            min="1"
                            max={rem}
                            value={curAmt || ''}
                            onChange={(e) => handleBatchAmountChange(d.id, e.target.value)}
                            className="flex-1 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-1 focus:ring-emerald-500 outline-none"
                            placeholder="Nominal"
                          />
                          <button
                            type="button"
                            onClick={() => handleBatchAmountChange(d.id, String(rem))}
                            className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-extrabold shrink-0"
                          >
                            Full
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Account Selection for Batch */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                  Rekening Transaksi Kas
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Total Summary */}
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs">
                <span className="font-extrabold text-emerald-950 dark:text-emerald-200">
                  Total {selectedBatchItems.length} Pinjaman:
                </span>
                <span className="font-black text-sm text-emerald-600 dark:text-emerald-400">
                  {formatIDR(totalBatchAmount, hideBalance)}
                </span>
              </div>
            </form>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-xs transition-colors"
          >
            Batal
          </button>

          {unpaidDebts.length > 0 && (
            <button
              type="submit"
              form={mode === 'SINGLE' ? 'single-debt-form' : 'batch-debt-form'}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl text-xs shadow-lg shadow-emerald-600/30 transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Check size={15} strokeWidth={3} />
              {mode === 'SINGLE' ? 'Proses Pembayaran' : `Bayar ${selectedBatchItems.length} Item`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
