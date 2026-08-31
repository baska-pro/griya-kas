import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ArrowRightLeft, 
  Calendar, 
  Wallet, 
  Tag, 
  User, 
  FileText, 
  Camera, 
  Image as ImageIcon, 
  Trash2, 
  Check, 
  Sparkles 
} from 'lucide-react';
import { 
  Transaction, 
  TransactionType, 
  Account, 
  ThemeColor, 
  SavingsGoal, 
  Debt 
} from '../types';
import { compressImageToBase64, formatIDR, parseNumber } from '../services/storageService';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Partial<Transaction>) => void;
  initialData?: Transaction | null;
  presetType?: TransactionType;
  presetPerson?: string;
  accounts: Account[];
  incomeCategories: string[];
  expenseCategories: string[];
  persons: { id: string; label: string }[];
  goals: SavingsGoal[];
  debts: Debt[];
  themeColor: ThemeColor;
}

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  presetType = 'EXPENSE',
  presetPerson,
  accounts,
  incomeCategories,
  expenseCategories,
  persons,
  goals,
  debts,
  themeColor
}) => {
  const [type, setType] = useState<TransactionType>(presetType);
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [accountId, setAccountId] = useState<string>('');
  const [targetAccountId, setTargetAccountId] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [person, setPerson] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [attachmentImage, setAttachmentImage] = useState<string | undefined>(undefined);
  const [isProcessingImage, setIsProcessingImage] = useState<boolean>(false);
  const [linkedGoalId, setLinkedGoalId] = useState<string>('');
  const [linkedDebtId, setLinkedDebtId] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setType(initialData.type);
        setAmount(String(initialData.amount || ''));
        setDate(initialData.date || new Date().toISOString().slice(0, 10));
        setAccountId(initialData.accountId || (accounts[0]?.id || ''));
        setTargetAccountId(initialData.targetAccountId || (accounts[1]?.id || ''));
        setCategory(initialData.category || '');
        setPerson(initialData.person || (persons[0]?.label || ''));
        setNotes(initialData.notes || '');
        setAttachmentImage(initialData.attachmentImage);
        setLinkedGoalId(initialData.relatedId || '');
        setLinkedDebtId(initialData.relatedId || '');
      } else {
        setType(presetType);
        setAmount('');
        setDate(new Date().toISOString().slice(0, 10));
        setAccountId(accounts[0]?.id || '');
        setTargetAccountId(accounts.length > 1 ? accounts[1].id : '');
        setCategory(presetType === 'INCOME' ? (incomeCategories[0] || 'Gaji Pokok') : (expenseCategories[0] || 'Makanan & Minuman'));
        setPerson(presetPerson || persons[0]?.label || 'Ayah / Suami');
        setNotes('');
        setAttachmentImage(undefined);
        setLinkedGoalId('');
        setLinkedDebtId('');
      }
    }
  }, [isOpen, initialData, presetType, presetPerson, accounts, incomeCategories, expenseCategories, persons]);

  if (!isOpen) return null;

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'INCOME') {
      setCategory(incomeCategories[0] || 'Gaji Pokok');
    } else if (newType === 'EXPENSE') {
      setCategory(expenseCategories[0] || 'Makanan & Minuman');
    } else {
      setCategory('Transfer Antar Akun');
    }
  };

  const handleQuickAddAmount = (addValue: number) => {
    const current = parseNumber(amount);
    setAmount(String(current + addValue));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingImage(true);
      const base64 = await compressImageToBase64(file);
      setAttachmentImage(base64);
    } catch (err) {
      console.error('Failed to process image:', err);
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseNumber(amount);
    if (parsedAmount <= 0) {
      alert("Harap masukkan nominal transaksi yang valid.");
      return;
    }

    if (!accountId) {
      alert("Pilih akun / dompet sumber.");
      return;
    }

    if (type === 'TRANSFER' && (!targetAccountId || targetAccountId === accountId)) {
      alert("Pilih akun tujuan transfer yang berbeda dari akun sumber.");
      return;
    }

    const txData: Partial<Transaction> = {
      ...(initialData?.id ? { id: initialData.id } : {}),
      date,
      type,
      category: type === 'TRANSFER' ? 'Transfer Antar Akun' : (category || 'Lainnya'),
      amount: parsedAmount,
      accountId,
      targetAccountId: type === 'TRANSFER' ? targetAccountId : undefined,
      person: person || (persons[0]?.label || ''),
      notes: notes.trim(),
      attachmentImage,
      relatedId: linkedGoalId || linkedDebtId || undefined
    };

    onSave(txData);
    onClose();
  };

  const currentCategories = type === 'INCOME' ? incomeCategories : expenseCategories;

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg max-h-[92vh] rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200/80 dark:border-slate-800 animate-in slide-in-from-bottom duration-300">
        
        {/* Modal Header */}
        <div className="p-4 px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-extrabold text-lg text-slate-900 dark:text-white">
              {initialData ? 'Edit Transaksi' : 'Catat Transaksi'}
            </h2>
            <p className="text-xs text-slate-400">Kelola keuangan Anda dengan akurat</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* 1. TYPE SELECTOR (INCOME / EXPENSE / TRANSFER) */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => handleTypeChange('EXPENSE')}
              className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                type === 'EXPENSE'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight size={15} strokeWidth={2.4} /> Pengeluaran
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('INCOME')}
              className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                type === 'INCOME'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ArrowDownLeft size={15} strokeWidth={2.4} /> Pemasukan
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('TRANSFER')}
              className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                type === 'TRANSFER'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ArrowRightLeft size={15} strokeWidth={2.4} /> Transfer
            </button>
          </div>

          {/* 2. AMOUNT INPUT & PRESETS */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Nominal (Rupiah)
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
                autoFocus
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-2xl text-xl sm:text-2xl font-black text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Quick Add Pills */}
            <div className="flex gap-1.5 overflow-x-auto pt-1 no-scrollbar">
              {[10000, 20000, 50000, 100000, 250000, 500000, 1000000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAddAmount(val)}
                  className="shrink-0 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[11px] font-bold transition-colors"
                >
                  +{val >= 1000000 ? `${val / 1000000}jt` : `${val / 1000}rb`}
                </button>
              ))}
            </div>
          </div>

          {/* 3. DATE & PERSON */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                Tanggal
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                Anggota Keluarga
              </label>
              <select
                value={person}
                onChange={(e) => setPerson(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none"
              >
                {persons.map(p => (
                  <option key={p.id} value={p.label}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. ACCOUNTS (SOURCE & TARGET) */}
          {type === 'TRANSFER' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  Dari Akun
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none truncate"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  Ke Akun Tujuan
                </label>
                <select
                  value={targetAccountId}
                  onChange={(e) => setTargetAccountId(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none truncate"
                >
                  {accounts.filter(a => a.id !== accountId).map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                Akun / Dompet
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                ))}
              </select>
            </div>
          )}

          {/* 5. CATEGORY SELECTION */}
          {type !== 'TRANSFER' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
                Kategori
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 border border-slate-100 dark:border-slate-800 rounded-xl">
                {currentCategories.map(cat => {
                  const isSelected = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        isSelected
                          ? type === 'INCOME'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-rose-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 6. NOTES / KETERANGAN */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
              Catatan / Keterangan (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Makan siang di warung, Beli pulsa, dll"
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white outline-none focus:border-emerald-500"
            />
          </div>

          {/* 7. RECEIPT PHOTO ATTACHMENT */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
              Foto Struk / Nota Pembayaran
            </label>
            
            {attachmentImage ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-48 bg-black/10">
                <img 
                  src={attachmentImage} 
                  alt="Bukti Struk" 
                  className="w-full h-40 object-cover" 
                />
                <button
                  type="button"
                  onClick={() => setAttachmentImage(undefined)}
                  className="absolute top-2 right-2 p-2 bg-rose-600 text-white rounded-xl shadow-md hover:bg-rose-700 transition-colors"
                  title="Hapus Foto"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 p-3.5 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-emerald-500 rounded-2xl cursor-pointer bg-slate-50/50 dark:bg-slate-800/40 text-slate-500 hover:text-emerald-600 transition-all">
                <Camera size={18} />
                <span className="text-xs font-bold">
                  {isProcessingImage ? 'Memproses Foto...' : 'Unggah / Ambil Foto Struk'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className={`w-full py-4 rounded-2xl text-white font-extrabold text-sm shadow-lg transition-all active:scale-[0.98] ${
                type === 'INCOME'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                  : type === 'EXPENSE'
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30'
              }`}
            >
              {initialData ? 'Simpan Perubahan' : 'Simpan Transaksi'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
