import React, { useState, useMemo } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowRightLeft, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Wallet, 
  Image as ImageIcon, 
  Trash2, 
  Edit2, 
  FileText,
  ChevronDown,
  Download,
  X
} from 'lucide-react';
import { Transaction, Account, ThemeColor, TransactionType } from '../types';
import { formatIDR } from '../services/storageService';

interface TransactionsViewProps {
  transactions: Transaction[];
  accounts: Account[];
  persons: { id: string; label: string }[];
  hideBalance: boolean;
  themeColor: ThemeColor;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onViewReceipt: (imageUrl: string) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  accounts,
  persons,
  hideBalance,
  themeColor,
  onEditTransaction,
  onDeleteTransaction,
  onViewReceipt
}) => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedAccount, setSelectedAccount] = useState<string>('ALL');
  const [selectedPerson, setSelectedPerson] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const years = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

  // Filtering Logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      // Month & Year Filter
      if (selectedMonth !== -1 && d.getMonth() !== selectedMonth) return false;
      if (selectedYear !== -1 && d.getFullYear() !== selectedYear) return false;

      // Type Filter
      if (selectedType !== 'ALL' && t.type !== selectedType) return false;

      // Account Filter
      if (selectedAccount !== 'ALL' && t.accountId !== selectedAccount && t.targetAccountId !== selectedAccount) return false;

      // Person Filter
      if (selectedPerson !== 'ALL' && t.person !== selectedPerson) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNote = (t.notes || '').toLowerCase().includes(q);
        const matchCategory = (t.category || '').toLowerCase().includes(q);
        const matchAmount = String(t.amount).includes(q);
        const matchPerson = (t.person || '').toLowerCase().includes(q);
        if (!matchNote && !matchCategory && !matchAmount && !matchPerson) return false;
      }

      return true;
    });
  }, [transactions, selectedMonth, selectedYear, selectedType, selectedAccount, selectedPerson, searchQuery]);

  // Financial Totals for Filtered View
  const filteredIncome = filteredTransactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const filteredExpense = filteredTransactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const filteredNet = filteredIncome - filteredExpense;

  // Group by Date
  const groupedByDate = useMemo(() => {
    const map: Record<string, Transaction[]> = {};
    filteredTransactions.forEach(t => {
      if (!map[t.date]) {
        map[t.date] = [];
      }
      map[t.date].push(t);
    });

    // Sort dates descending
    const sortedDates = Object.keys(map).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    return sortedDates.map(date => ({
      date,
      items: map[date]
    }));
  }, [filteredTransactions]);

  const formatDateHeader = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    let prefix = '';
    if (dateStr === today) prefix = 'Hari Ini - ';
    else if (dateStr === yesterday) prefix = 'Kemarin - ';

    return prefix + d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;
    const headers = ['ID Transaksi', 'Tanggal', 'Tipe', 'Kategori', 'Nominal (Rp)', 'Akun/Dompet', 'Anggota Keluarga', 'Catatan'];
    const rows = filteredTransactions.map(t => {
      const acc = accounts.find(a => a.id === t.accountId);
      return [
        `"${t.id}"`,
        `"${t.date}"`,
        `"${t.type}"`,
        `"${t.category || ''}"`,
        t.amount,
        `"${acc ? acc.name : t.accountId}"`,
        `"${t.person || 'Keluarga'}"`,
        `"${(t.notes || '').replace(/"/g, '""')}"`
      ];
    });
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GriyaKas_Transaksi_${selectedYear}_${selectedMonth === -1 ? 'Semua' : selectedMonth + 1}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 pb-24">
      {/* 1. HEADER FILTERS (MONTH, YEAR, SEARCH) */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {/* Month Select */}
          <div className="relative flex-1">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full pl-3 pr-8 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-bold appearance-none outline-none focus:border-emerald-500 transition-colors"
            >
              <option value={-1}>Semua Bulan</option>
              {months.map((m, idx) => (
                <option key={m} value={idx}>{m}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Year Select */}
          <div className="relative w-28">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full pl-3 pr-8 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-bold appearance-none outline-none focus:border-emerald-500 transition-colors"
            >
              <option value={-1}>Semua</option>
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredTransactions.length === 0}
            className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/50 transition-all disabled:opacity-40"
            title="Download Data Transaksi (CSV / Excel)"
          >
            <Download size={16} />
          </button>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-xl border transition-all ${
              showFilters || selectedType !== 'ALL' || selectedAccount !== 'ALL' || selectedPerson !== 'ALL'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-500'
            }`}
            title="Filter Lengkap"
          >
            <Filter size={16} />
          </button>
        </div>

        {/* Fast Family Member Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-0.5">
          <button
            onClick={() => setSelectedPerson('ALL')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              selectedPerson === 'ALL'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800'
            }`}
          >
            Semua ({transactions.length})
          </button>
          {persons.map(p => {
            const count = transactions.filter(t => t.person === p.label).length;
            const isSelected = selectedPerson === p.label;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPerson(p.label)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <span>{p.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari transaksi, kategori, catatan, nominal..."
            className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs outline-none focus:border-emerald-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Extended Filters Drawer */}
        {showFilters && (
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-md space-y-2.5 animate-in slide-in-from-top-2 duration-200">
            <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-300">
              <span>Filter Tambahan</span>
              <button 
                onClick={() => {
                  setSelectedType('ALL');
                  setSelectedAccount('ALL');
                  setSelectedPerson('ALL');
                }}
                className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
              >
                Reset Filter
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Type Filter */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Tipe</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold outline-none"
                >
                  <option value="ALL">Semua Tipe</option>
                  <option value="INCOME">Pemasukan</option>
                  <option value="EXPENSE">Pengeluaran</option>
                  <option value="TRANSFER">Transfer</option>
                </select>
              </div>

              {/* Account Filter */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Akun/Dompet</label>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold outline-none truncate"
                >
                  <option value="ALL">Semua Akun</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>

              {/* Person Filter */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Anggota</label>
                <select
                  value={selectedPerson}
                  onChange={(e) => setSelectedPerson(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold outline-none"
                >
                  <option value="ALL">Semua Orang</option>
                  {persons.map(p => (
                    <option key={p.id} value={p.label}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. REKAP SUMMARY BANNER FOR FILTERED DATA */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm grid grid-cols-3 gap-2 text-center">
        <div>
          <span className="text-[10px] font-bold text-slate-400 block">Total Pemasukan</span>
          <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 truncate block">
            {formatIDR(filteredIncome, hideBalance)}
          </span>
        </div>
        <div className="border-x border-slate-100 dark:border-slate-800 px-1">
          <span className="text-[10px] font-bold text-slate-400 block">Total Pengeluaran</span>
          <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400 truncate block">
            {formatIDR(filteredExpense, hideBalance)}
          </span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 block">Arus Bersih</span>
          <span className={`text-xs font-extrabold truncate block ${
            filteredNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {formatIDR(filteredNet, hideBalance)}
          </span>
        </div>
      </div>

      {/* 3. GROUPED TRANSACTIONS LIST */}
      {groupedByDate.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-10 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-2 mt-4">
          <FileText className="mx-auto text-slate-300 dark:text-slate-600" size={36} />
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Tidak ada transaksi ditemukan</p>
          <p className="text-[11px] text-slate-400">Coba ubah filter bulan, tahun, atau kata kunci pencarian.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByDate.map(group => {
            const groupTotal = group.items.reduce((sum, item) => {
              if (item.type === 'INCOME') return sum + item.amount;
              if (item.type === 'EXPENSE') return sum - item.amount;
              return sum;
            }, 0);

            return (
              <div key={group.date} className="space-y-1.5">
                {/* Date Header */}
                <div className="flex items-center justify-between px-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                  <span>{formatDateHeader(group.date)}</span>
                  <span className={`text-[11px] font-extrabold ${groupTotal >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {groupTotal >= 0 ? '+' : ''}{formatIDR(groupTotal, hideBalance)}
                  </span>
                </div>

                {/* Items in this date */}
                <div className="space-y-2">
                  {group.items.map(t => {
                    const sourceAcc = accounts.find(a => a.id === t.accountId);
                    const targetAcc = t.targetAccountId ? accounts.find(a => a.id === t.targetAccountId) : null;

                    return (
                      <div
                        key={t.id}
                        className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between group hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            t.type === 'INCOME' 
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' 
                              : t.type === 'EXPENSE'
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                              : 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                          }`}>
                            {t.type === 'INCOME' ? (
                              <ArrowDownLeft size={18} strokeWidth={2.4} />
                            ) : t.type === 'EXPENSE' ? (
                              <ArrowUpRight size={18} strokeWidth={2.4} />
                            ) : (
                              <ArrowRightLeft size={18} strokeWidth={2.4} />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {t.category}
                              </span>
                              {t.person && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                                  {t.person}
                                </span>
                              )}
                              {t.attachmentImage && (
                                <button
                                  onClick={() => onViewReceipt(t.attachmentImage!)}
                                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 flex items-center gap-0.5"
                                  title="Lihat Foto Bukti Struk"
                                >
                                  <ImageIcon size={10} /> Foto
                                </button>
                              )}
                            </div>

                            <div className="text-[11px] text-slate-400 truncate">
                              {t.notes ? (
                                <span>{t.notes} &bull; <span className="text-slate-500">{sourceAcc?.name}</span></span>
                              ) : (
                                <span>
                                  {t.type === 'TRANSFER' 
                                    ? `${sourceAcc?.name} \u2192 ${targetAcc?.name}`
                                    : sourceAcc?.name
                                  }
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Amount & Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <div className={`text-xs font-extrabold ${
                              t.type === 'INCOME' 
                                ? 'text-emerald-600 dark:text-emerald-400' 
                                : t.type === 'EXPENSE' 
                                ? 'text-rose-600 dark:text-rose-400' 
                                : 'text-blue-600 dark:text-blue-400'
                            }`}>
                              {t.type === 'INCOME' ? '+' : t.type === 'EXPENSE' ? '-' : ''} {formatIDR(t.amount, hideBalance)}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {sourceAcc?.name}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => onEditTransaction(t)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Edit Transaksi"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => onDeleteTransaction(t.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="Hapus Transaksi"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
