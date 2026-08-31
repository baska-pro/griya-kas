import React, { useState } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowRightLeft, 
  Plus, 
  Wallet, 
  CreditCard, 
  Smartphone, 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  AlertCircle, 
  Target, 
  Receipt, 
  Clock, 
  Sparkles,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  User,
  Users,
  Bell,
  BellRing,
  Check,
  X
} from 'lucide-react';
import { 
  Transaction, 
  Account, 
  Budget, 
  Debt, 
  SavingsGoal, 
  RecurringBill, 
  ThemeColor, 
  MainTab 
} from '../types';
import { formatIDR } from '../services/storageService';
import { ConfirmDialog } from './ConfirmDialog';
import { DebtPaymentModal } from './DebtPaymentModal';

interface DashboardViewProps {
  transactions: Transaction[];
  accounts: Account[];
  persons: { id: string; label: string }[];
  budgets: Budget[];
  debts: Debt[];
  goals: SavingsGoal[];
  bills: RecurringBill[];
  hideBalance: boolean;
  themeColor: ThemeColor;
  onOpenNewTransaction: (presetType?: 'INCOME' | 'EXPENSE' | 'TRANSFER', presetPerson?: string) => void;
  onOpenTransfer: () => void;
  onNavigateTab: (tab: MainTab, filterPerson?: string) => void;
  onViewTransactionDetails: (transaction: Transaction) => void;
  onToggleBillPaid?: (billId: string, monthKey: string, accountId?: string) => void;
  onPayDebtInstallment?: (debtId: string, amount: number, accountId: string) => void;
  onBatchPayDebts?: (payments: { debtId: string; payAmount: number }[], accountId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  transactions,
  accounts,
  persons,
  budgets,
  debts,
  goals,
  bills,
  hideBalance,
  themeColor,
  onOpenNewTransaction,
  onOpenTransfer,
  onNavigateTab,
  onViewTransactionDetails,
  onToggleBillPaid,
  onPayDebtInstallment,
  onBatchPayDebts
}) => {
  const [selectedPerson, setSelectedPerson] = useState<string>('ALL');
  const [selectedAccountId, setSelectedAccountId] = useState<string | 'ALL'>('ALL');
  const [isBillAlertExpanded, setIsBillAlertExpanded] = useState<boolean>(true);
  const [isBillAlertDismissed, setIsBillAlertDismissed] = useState<boolean>(false);
  const [isDebtAlertExpanded, setIsDebtAlertExpanded] = useState<boolean>(true);
  const [isDebtAlertDismissed, setIsDebtAlertDismissed] = useState<boolean>(false);

  // Debt payment modal state
  const [debtModalState, setDebtModalState] = useState<{
    isOpen: boolean;
    initialDebtId?: string;
    mode: 'SINGLE' | 'BATCH';
  }>({ isOpen: false, mode: 'SINGLE' });

  // Confirmation dialog state for dismissing alerts via X icon
  const [confirmDismissAlert, setConfirmDismissAlert] = useState<{
    isOpen: boolean;
    type: 'BILL' | 'DEBT';
    title: string;
    message: string;
  } | null>(null);

  // Compute Account Balances
  const accountBalances: Record<string, number> = {};
  accounts.forEach(acc => {
    accountBalances[acc.id] = acc.initialBalance || 0;
  });

  transactions.forEach(t => {
    if (t.type === 'INCOME') {
      if (accountBalances[t.accountId] !== undefined) {
        accountBalances[t.accountId] += t.amount;
      }
    } else if (t.type === 'EXPENSE') {
      if (accountBalances[t.accountId] !== undefined) {
        accountBalances[t.accountId] -= t.amount;
      }
    } else if (t.type === 'TRANSFER' && t.targetAccountId) {
      if (accountBalances[t.accountId] !== undefined) {
        accountBalances[t.accountId] -= t.amount;
      }
      if (accountBalances[t.targetAccountId] !== undefined) {
        accountBalances[t.targetAccountId] += t.amount;
      }
    }
  });

  const totalBalance = Object.values(accountBalances).reduce((a, b) => a + b, 0);

  // Per-Person / Family Member Independent Financial Breakdown
  const personFinances = persons.map((p, idx) => {
    const personTxs = transactions.filter(t => t.person === p.label);
    const income = personTxs
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = personTxs
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);
    const personalBalance = income - expense;

    // Distinct modern gradients for member cards
    const cardGradients = [
      'from-emerald-700 via-emerald-800 to-teal-900',
      'from-rose-700 via-pink-800 to-rose-950',
      'from-blue-700 via-indigo-800 to-slate-900',
      'from-amber-700 via-orange-800 to-stone-900',
      'from-violet-700 via-purple-800 to-slate-900',
      'from-cyan-700 via-teal-800 to-slate-900'
    ];
    const gradient = cardGradients[idx % cardGradients.length];

    const initials = p.label
      .split(' ')
      .map(w => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'AK';

    return {
      ...p,
      income,
      expense,
      balance: personalBalance,
      txCount: personTxs.length,
      gradient,
      initials
    };
  });

  // Current Month Calculations
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-11

  const currentMonthTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  // Dynamic calculations based on selectedPerson
  const isAllSelected = selectedPerson === 'ALL';
  const activePersonData = !isAllSelected ? personFinances.find(p => p.label === selectedPerson) : null;

  const displayedTransactions = isAllSelected
    ? transactions
    : transactions.filter(t => t.person === selectedPerson);

  const displayedMonthTransactions = isAllSelected
    ? currentMonthTransactions
    : currentMonthTransactions.filter(t => t.person === selectedPerson);

  const displayedMonthIncome = displayedMonthTransactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const displayedMonthExpense = displayedMonthTransactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const displayedTotalBalance = isAllSelected
    ? totalBalance
    : (activePersonData ? activePersonData.balance : 0);

  // Monthly Budget Overview (scoped to displayed transactions if person selected)
  const totalBudgetLimit = budgets.reduce((sum, b) => sum + b.limit, 0);
  const totalBudgetSpent = budgets.reduce((sum, b) => {
    const spent = displayedMonthTransactions
      .filter(t => t.type === 'EXPENSE' && t.category === b.category)
      .reduce((s, t) => s + t.amount, 0);
    return sum + spent;
  }, 0);

  const budgetUsagePercent = totalBudgetLimit > 0 ? Math.min(Math.round((totalBudgetSpent / totalBudgetLimit) * 100), 100) : 0;

  // Overdue Debts & Unpaid Bills
  const todayDay = now.getDate();
  const todayStr = new Date().toISOString().slice(0, 10);
  const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  
  const unpaidBills = bills.filter(b => {
    return !(b.paidMonths || []).includes(currentMonthKey);
  });

  const overdueBills = unpaidBills.filter(b => b.dueDay < todayDay);
  const dueTodayBills = unpaidBills.filter(b => b.dueDay === todayDay);
  const upcomingBills = unpaidBills.filter(b => b.dueDay > todayDay);
  const totalUnpaidBillsAmount = unpaidBills.reduce((sum, b) => sum + b.amount, 0);

  // Debts and Receivables Pending Calculations
  const pendingDebts = debts.filter(d => !d.isPaid && (isAllSelected || d.person === selectedPerson));
  const myUnpaidDebts = pendingDebts.filter(d => d.type === 'HUTANG_SAYA' || d.type === 'HUTANG');
  const myUnpaidReceivables = pendingDebts.filter(d => d.type === 'PIUTANG_ORANG' || d.type === 'PIUTANG');

  const totalMyDebtRemaining = myUnpaidDebts.reduce((sum, d) => sum + Math.max(0, d.amount - (d.paidAmount || 0)), 0);
  const totalMyReceivableRemaining = myUnpaidReceivables.reduce((sum, d) => sum + Math.max(0, d.amount - (d.paidAmount || 0)), 0);

  const overdueDebts = pendingDebts.filter(d => d.dueDate && d.dueDate < todayStr);
  const dueTodayDebts = pendingDebts.filter(d => d.dueDate && d.dueDate === todayStr);
  const upcomingDebts = pendingDebts.filter(d => d.dueDate && d.dueDate > todayStr);

  const handleRequestDismissBillAlert = () => {
    setConfirmDismissAlert({
      isOpen: true,
      type: 'BILL',
      title: 'Sembunyikan Pengingat Tagihan?',
      message: 'Pengingat tagihan bulanan ini akan disembunyikan sementara dari layar dashboard selama sesi ini. Anda tetap dapat mengelolanya di menu Perencanaan.'
    });
  };

  const handleRequestDismissDebtAlert = () => {
    setConfirmDismissAlert({
      isOpen: true,
      type: 'DEBT',
      title: 'Sembunyikan Pengingat Hutang & Piutang?',
      message: 'Pengingat hutang & piutang ini akan disembunyikan sementara dari layar dashboard selama sesi ini. Anda tetap dapat memantau dan mencatatnya di menu Perencanaan.'
    });
  };

  const handleConfirmDismiss = () => {
    if (confirmDismissAlert?.type === 'BILL') {
      setIsBillAlertDismissed(true);
    } else if (confirmDismissAlert?.type === 'DEBT') {
      setIsDebtAlertDismissed(true);
    }
    setConfirmDismissAlert(null);
  };

  // Recent Transactions (Filtered dynamically)
  const recentTransactions = displayedTransactions.slice(0, 6);

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'Cash': return <Wallet size={16} />;
      case 'Rekening': return <CreditCard size={16} />;
      case 'E-money': return <Smartphone size={16} />;
      case 'Dana Darurat': return <ShieldCheck size={16} />;
      default: return <Wallet size={16} />;
    }
  };

  const getThemeGradient = () => {
    if (!isAllSelected && activePersonData) {
      return activePersonData.gradient;
    }
    switch (themeColor) {
      case 'emerald': return 'from-emerald-700 via-emerald-800 to-teal-950 text-white';
      case 'blue': return 'from-blue-700 via-blue-800 to-slate-950 text-white';
      case 'violet': return 'from-violet-700 via-purple-800 to-slate-950 text-white';
      case 'rose': return 'from-rose-700 via-pink-800 to-slate-950 text-white';
      case 'amber': return 'from-amber-700 via-orange-800 to-stone-950 text-white';
      case 'cyan': return 'from-cyan-700 via-teal-800 to-slate-950 text-white';
      case 'slate': return 'from-slate-700 via-slate-800 to-slate-950 text-white';
      default: return 'from-emerald-700 via-emerald-800 to-teal-950 text-white';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-24">
      {/* 1. HERO BALANCE CARD (Dinamis berubah sesuai anggota terpilih) */}
      <div className={`p-5 rounded-3xl bg-gradient-to-br ${getThemeGradient()} shadow-xl relative overflow-hidden transition-all duration-300`}>
        {/* Subtle geometric circles decoration */}
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/5 rounded-full blur-xl pointer-events-none" />
        <div className="absolute -left-6 -top-6 w-32 h-32 bg-white/5 rounded-full blur-lg pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-emerald-100/90 tracking-wide">
              {isAllSelected 
                ? 'Total Kekayaan Bersih (Semua Akun)' 
                : `Saldo Mandiri: ${selectedPerson}`}
            </span>
            <div className="flex items-center gap-1">
              {!isAllSelected && (
                <button
                  onClick={() => setSelectedPerson('ALL')}
                  className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                >
                  Semua Anggota &times;
                </button>
              )}
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/15 text-white backdrop-blur-sm">
                {isAllSelected ? `${accounts.length} Akun • ${persons.length} Anggota` : `${activePersonData?.txCount || 0} Transaksi`}
              </span>
            </div>
          </div>

          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4 text-white">
            {formatIDR(displayedTotalBalance, hideBalance)}
          </div>

          {/* Income vs Expense Pill stats */}
          <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-white/15">
            <div className="bg-black/20 backdrop-blur-sm p-3 rounded-2xl">
              <div className="flex items-center gap-1.5 text-emerald-300 text-xs font-semibold mb-1">
                <ArrowDownLeft size={14} className="bg-emerald-500/30 p-0.5 rounded-full" />
                <span>Pemasukan Bln Ini</span>
              </div>
              <div className="text-sm font-bold text-white">
                {formatIDR(displayedMonthIncome, hideBalance)}
              </div>
            </div>

            <div className="bg-black/20 backdrop-blur-sm p-3 rounded-2xl">
              <div className="flex items-center gap-1.5 text-rose-300 text-xs font-semibold mb-1">
                <ArrowUpRight size={14} className="bg-rose-500/30 p-0.5 rounded-full" />
                <span>Pengeluaran Bln Ini</span>
              </div>
              <div className="text-sm font-bold text-white">
                {formatIDR(displayedMonthExpense, hideBalance)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PENGINGAT TAGIHAN RUTIN (NOTIFICATION ALERT CARD) */}
      {unpaidBills.length > 0 && !isBillAlertDismissed && (
        <div className="rounded-3xl border border-amber-300/80 dark:border-amber-900/60 bg-gradient-to-br from-amber-50 via-orange-50/40 to-amber-50 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-amber-950/30 p-4 shadow-sm transition-all duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm relative">
                <BellRing size={18} className="animate-bounce" />
                {overdueBills.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 border-2 border-white dark:border-slate-900 rounded-full" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xs font-black text-amber-950 dark:text-amber-100 flex items-center gap-1.5">
                    Pengingat Tagihan Bulanan
                  </h3>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200">
                    {unpaidBills.length} Belum Dibayar
                  </span>
                </div>
                <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 mt-0.5">
                  Ada tagihan rutin keluarga yang perlu diselesaikan. Total: <strong className="font-extrabold text-amber-950 dark:text-amber-100">{formatIDR(totalUnpaidBillsAmount, hideBalance)}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setIsBillAlertExpanded(!isBillAlertExpanded)}
                className="p-1.5 rounded-xl text-amber-700 dark:text-amber-300 hover:bg-amber-200/60 dark:hover:bg-amber-900/50 transition-colors"
                title={isBillAlertExpanded ? "Sembunyikan rincian" : "Tampilkan rincian"}
              >
                {isBillAlertExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              <button
                onClick={handleRequestDismissBillAlert}
                className="p-1.5 rounded-xl text-amber-500 hover:text-amber-800 dark:hover:text-amber-200 hover:bg-amber-200/60 dark:hover:bg-amber-900/50 transition-colors"
                title="Tutup pengingat sementara"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Status chips badges */}
          <div className="flex items-center gap-1.5 flex-wrap mt-2.5 pt-2.5 border-t border-amber-200/60 dark:border-amber-900/50">
            {overdueBills.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                <AlertTriangle size={11} /> {overdueBills.length} Lewat Jatuh Tempo
              </span>
            )}
            {dueTodayBills.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-900">
                <Clock size={11} /> {dueTodayBills.length} Jatuh Tempo Hari Ini
              </span>
            )}
            {upcomingBills.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-900">
                <Calendar size={11} /> {upcomingBills.length} Mendatang
              </span>
            )}
          </div>

          {/* Expanded List with Direct 1-Click Pay or Planning Link */}
          {isBillAlertExpanded && (
            <div className="mt-3 space-y-2 pt-1">
              {unpaidBills.map(bill => {
                const isOverdue = bill.dueDay < todayDay;
                const isToday = bill.dueDay === todayDay;

                return (
                  <div
                    key={bill.id}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-amber-200/70 dark:border-amber-900/40 text-xs shadow-xs hover:border-amber-300 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        isOverdue ? 'bg-rose-500 animate-pulse' : isToday ? 'bg-amber-500' : 'bg-blue-500'
                      }`} />
                      <div className="truncate">
                        <span className="font-extrabold text-slate-900 dark:text-white block truncate">
                          {bill.name}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          {isOverdue 
                            ? `Lewat jatuh tempo (Tgl ${bill.dueDay})` 
                            : isToday 
                              ? 'Jatuh tempo hari ini' 
                              : `Jatuh tempo tgl ${bill.dueDay} (sisa ${bill.dueDay - todayDay} hari)`}
                          {bill.category ? ` • ${bill.category}` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="font-black text-rose-600 dark:text-rose-400 text-xs">
                        {formatIDR(bill.amount, hideBalance)}
                      </span>

                      {onToggleBillPaid && (
                        <button
                          onClick={() => onToggleBillPaid(bill.id, currentMonthKey)}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-extrabold shadow-xs flex items-center gap-1 transition-all active:scale-95"
                          title="Tandai lunas & catat pengeluaran"
                        >
                          <Check size={12} strokeWidth={3} /> Bayar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-amber-800/80 dark:text-amber-400/80">
                  Pembayaran otomatis mencatat transaksi pengeluaran.
                </span>
                <button
                  onClick={() => onNavigateTab('PLANNING')}
                  className="text-[11px] font-extrabold text-amber-900 dark:text-amber-200 hover:underline flex items-center gap-1"
                >
                  Kelola di Perencanaan &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PENGINGAT HUTANG & PIUTANG (DEBT & RECEIVABLE ALERT CARD) */}
      {pendingDebts.length > 0 && !isDebtAlertDismissed && (
        <div className="rounded-3xl border border-indigo-300/80 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/90 via-blue-50/40 to-slate-50 dark:from-indigo-950/30 dark:via-blue-950/20 dark:to-slate-950/30 p-4 shadow-sm transition-all duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm relative">
                <CreditCard size={18} />
                {overdueDebts.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 border-2 border-white dark:border-slate-900 rounded-full" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xs font-black text-indigo-950 dark:text-indigo-100 flex items-center gap-1.5">
                    Pengingat Hutang &amp; Piutang
                  </h3>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-200/80 dark:bg-indigo-900/80 text-indigo-900 dark:text-indigo-200">
                    {pendingDebts.length} Pinjaman Aktif
                  </span>
                </div>
                <p className="text-[11px] text-indigo-900/90 dark:text-indigo-300/90 mt-0.5">
                  {myUnpaidDebts.length > 0 && (
                    <span>Hutang Saya: <strong className="font-extrabold text-rose-600 dark:text-rose-400">{formatIDR(totalMyDebtRemaining, hideBalance)}</strong></span>
                  )}
                  {myUnpaidDebts.length > 0 && myUnpaidReceivables.length > 0 && <span> • </span>}
                  {myUnpaidReceivables.length > 0 && (
                    <span>Piutang: <strong className="font-extrabold text-blue-600 dark:text-blue-400">{formatIDR(totalMyReceivableRemaining, hideBalance)}</strong></span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {pendingDebts.length > 1 && (
                <button
                  onClick={() => setDebtModalState({ isOpen: true, mode: 'BATCH' })}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-extrabold shadow-xs flex items-center gap-1 transition-all active:scale-95"
                  title="Bayar beberapa pinjaman sekaligus"
                >
                  <Layers size={12} /> Bayar Beberapa
                </button>
              )}
              <button
                onClick={() => setIsDebtAlertExpanded(!isDebtAlertExpanded)}
                className="p-1.5 rounded-xl text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200/60 dark:hover:bg-indigo-900/50 transition-colors"
                title={isDebtAlertExpanded ? "Sembunyikan rincian" : "Tampilkan rincian"}
              >
                {isDebtAlertExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              <button
                onClick={handleRequestDismissDebtAlert}
                className="p-1.5 rounded-xl text-indigo-500 hover:text-indigo-800 dark:hover:text-indigo-200 hover:bg-indigo-200/60 dark:hover:bg-indigo-900/50 transition-colors"
                title="Tutup pengingat sementara"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Status chips badges */}
          <div className="flex items-center gap-1.5 flex-wrap mt-2.5 pt-2.5 border-t border-indigo-200/60 dark:border-indigo-900/50">
            {overdueDebts.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                <AlertTriangle size={11} /> {overdueDebts.length} Lewat Jatuh Tempo
              </span>
            )}
            {dueTodayDebts.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-900">
                <Clock size={11} /> {dueTodayDebts.length} Jatuh Tempo Hari Ini
              </span>
            )}
            {upcomingDebts.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-900">
                <Calendar size={11} /> {upcomingDebts.length} Mendatang
              </span>
            )}
            {myUnpaidDebts.length > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                {myUnpaidDebts.length} Hutang
              </span>
            )}
            {myUnpaidReceivables.length > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                {myUnpaidReceivables.length} Piutang
              </span>
            )}
          </div>

          {/* Expanded List with Direct Action */}
          {isDebtAlertExpanded && (
            <div className="mt-3 space-y-2 pt-1">
              {pendingDebts.map(debt => {
                const rem = Math.max(0, debt.amount - (debt.paidAmount || 0));
                const isHt = debt.type === 'HUTANG_SAYA' || debt.type === 'HUTANG';
                const isOverdue = debt.dueDate && debt.dueDate < todayStr;
                const isToday = debt.dueDate && debt.dueDate === todayStr;

                return (
                  <div
                    key={debt.id}
                    className="p-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-indigo-200/70 dark:border-indigo-900/40 text-xs shadow-xs space-y-2 hover:border-indigo-300 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          isOverdue ? 'bg-rose-500 animate-pulse' : isToday ? 'bg-amber-500' : isHt ? 'bg-rose-400' : 'bg-blue-400'
                        }`} />
                        <div className="truncate">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-slate-900 dark:text-white truncate">
                              {debt.personName || debt.name}
                            </span>
                            <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${
                              isHt 
                                ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300' 
                                : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                            }`}>
                              {isHt ? 'HUTANG' : 'PIUTANG'}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                            {debt.dueDate 
                              ? (isOverdue 
                                  ? `Lewat tempo (${debt.dueDate})` 
                                  : isToday 
                                    ? 'Jatuh tempo hari ini' 
                                    : `Jatuh tempo: ${debt.dueDate}`)
                              : 'Tanpa batas tempo'}
                            {debt.notes ? ` • "${debt.notes}"` : ''}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-black text-slate-900 dark:text-white block text-xs">
                          {formatIDR(rem, hideBalance)}
                        </span>
                        <span className="text-[9px] text-slate-400">
                          dari {formatIDR(debt.amount, hideBalance)}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400">
                        Terbayar: {formatIDR(debt.paidAmount || 0, hideBalance)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setDebtModalState({ isOpen: true, initialDebtId: debt.id, mode: 'SINGLE' })}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-extrabold shadow-xs flex items-center gap-1 transition-all active:scale-95"
                        >
                          <Check size={11} strokeWidth={3} /> {isHt ? 'Bayar / Cicil' : 'Terima Cicilan'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="flex items-center justify-between pt-1">
                {pendingDebts.length > 1 ? (
                  <button
                    onClick={() => setDebtModalState({ isOpen: true, mode: 'BATCH' })}
                    className="text-[11px] font-extrabold text-indigo-700 dark:text-indigo-300 hover:underline flex items-center gap-1"
                  >
                    <Layers size={13} /> Bayar Beberapa Sekaligus &rarr;
                  </button>
                ) : (
                  <span className="text-[10px] text-indigo-800/80 dark:text-indigo-400/80">
                    Pilihan bayar sebagian (cicil) atau full lunas.
                  </span>
                )}
                <button
                  onClick={() => onNavigateTab('PLANNING')}
                  className="text-[11px] font-extrabold text-indigo-900 dark:text-indigo-200 hover:underline flex items-center gap-1"
                >
                  Kelola di Perencanaan &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. CARD SALDO / DOMPET MANDIRI PER ANGGOTA KELUARGA (HORIZONTAL SCROLL / CAROUSEL) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Users size={15} className="text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">
              Dompet Mandiri Anggota
            </h2>
          </div>
          <span className="text-[10px] font-semibold text-slate-400">
            Geser &amp; Ketuk Kartu
          </span>
        </div>

        {/* Horizontal Carousel */}
        <div className="flex gap-3 overflow-x-auto pb-2 pt-1 no-scrollbar scroll-smooth snap-x">
          {/* "Semua Anggota" Card */}
          <div
            onClick={() => setSelectedPerson('ALL')}
            className={`shrink-0 w-44 sm:w-48 rounded-2xl p-3.5 border cursor-pointer snap-start transition-all flex flex-col justify-between ${
              isAllSelected
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900 dark:border-white shadow-md ring-2 ring-emerald-500/40'
                : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-xs shadow-xs ${
                  isAllSelected ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}>
                  <Users size={16} />
                </div>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  isAllSelected
                    ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  {isAllSelected ? 'Aktif' : 'Semua'}
                </span>
              </div>
              <h3 className="text-xs font-extrabold truncate mb-0.5">
                Semua Anggota
              </h3>
              <p className={`text-[10px] mb-2 ${isAllSelected ? 'text-slate-300 dark:text-slate-600' : 'text-slate-400'}`}>
                {transactions.length} Total Transaksi
              </p>
            </div>
            <div className={`text-xs font-black pt-2 border-t ${
              isAllSelected ? 'border-white/15 dark:border-slate-300 text-emerald-400 dark:text-emerald-700' : 'border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white'
            }`}>
              {formatIDR(totalBalance, hideBalance)}
            </div>
          </div>

          {/* Member Cards */}
          {personFinances.map(pf => {
            const isSelected = selectedPerson === pf.label;
            const isPositive = pf.balance >= 0;

            return (
              <div
                key={pf.id}
                onClick={() => setSelectedPerson(isSelected ? 'ALL' : pf.label)}
                className={`shrink-0 w-64 sm:w-72 rounded-2xl p-3.5 border cursor-pointer snap-start transition-all flex flex-col justify-between relative overflow-hidden ${
                  isSelected
                    ? 'bg-white dark:bg-slate-900 border-emerald-500 shadow-md ring-2 ring-emerald-500/50'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${pf.gradient} text-white flex items-center justify-center font-extrabold text-xs shadow-xs`}>
                        {pf.initials}
                      </div>
                      <div>
                        <h3 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
                          <span>{pf.label}</span>
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          )}
                        </h3>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {pf.txCount} Transaksi
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => onOpenNewTransaction('INCOME', pf.label)}
                        className="p-1 px-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900 flex items-center gap-0.5 transition-colors"
                        title={`Catat Pemasukan ${pf.label}`}
                      >
                        <Plus size={10} /> Masuk
                      </button>
                      <button
                        onClick={() => onOpenNewTransaction('EXPENSE', pf.label)}
                        className="p-1 px-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-[10px] font-bold hover:bg-rose-100 dark:hover:bg-rose-900 flex items-center gap-0.5 transition-colors"
                        title={`Catat Pengeluaran ${pf.label}`}
                      >
                        <Plus size={10} /> Keluar
                      </button>
                    </div>
                  </div>

                  {/* Personal Net Balance Display */}
                  <div className={`rounded-xl p-2.5 mb-2 border transition-colors ${
                    isSelected 
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-700/60'
                  }`}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-bold text-slate-400">
                        Saldo Mandiri
                      </span>
                      {isSelected && (
                        <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                          Laporan Aktif
                        </span>
                      )}
                    </div>
                    <span className={`text-base font-black tracking-tight block ${
                      isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {formatIDR(pf.balance, hideBalance)}
                    </span>
                  </div>
                </div>

                {/* Sub Inflow / Outflow Breakdown */}
                <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold pt-1.5 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-emerald-600 dark:text-emerald-400 truncate">
                    <span className="text-slate-400 block font-normal">Pemasukan:</span>
                    +{formatIDR(pf.income, hideBalance)}
                  </div>
                  <div className="text-rose-600 dark:text-rose-400 truncate text-right">
                    <span className="text-slate-400 block font-normal">Pengeluaran:</span>
                    -{formatIDR(pf.expense, hideBalance)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. QUICK ACTIONS BAR */}
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={() => onOpenNewTransaction('INCOME', isAllSelected ? undefined : selectedPerson)}
          className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all active:scale-95 group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
            <ArrowDownLeft size={18} strokeWidth={2.5} />
          </div>
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate max-w-full">
            {isAllSelected ? 'Pemasukan' : `+ ${selectedPerson.split(' ')[0]}`}
          </span>
        </button>

        <button
          onClick={() => onOpenNewTransaction('EXPENSE', isAllSelected ? undefined : selectedPerson)}
          className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all active:scale-95 group"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
            <ArrowUpRight size={18} strokeWidth={2.5} />
          </div>
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate max-w-full">
            {isAllSelected ? 'Pengeluaran' : `- ${selectedPerson.split(' ')[0]}`}
          </span>
        </button>

        <button
          onClick={onOpenTransfer}
          className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all active:scale-95 group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
            <ArrowRightLeft size={18} strokeWidth={2.5} />
          </div>
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">Transfer</span>
        </button>

        <button
          onClick={() => onNavigateTab('PLANNING')}
          className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-900 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all active:scale-95 group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
            <Target size={18} strokeWidth={2.5} />
          </div>
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">Rencana</span>
        </button>
      </div>

      {/* 4. DAFTAR REKENING / DOMPET HORIZONTAL CAROUSEL */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Daftar Rekening & Dompet
          </h2>
          <button
            onClick={onOpenTransfer}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <ArrowRightLeft size={12} /> Transfer Saldo
          </button>
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1 no-scrollbar">
          {accounts.map(acc => {
            const bal = accountBalances[acc.id] || 0;
            return (
              <div
                key={acc.id}
                className="shrink-0 w-38 sm:w-44 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 truncate max-w-[90px]">
                    {acc.type}
                  </span>
                  <div className={`w-6 h-6 rounded-lg ${acc.color} text-white flex items-center justify-center shadow-xs`}>
                    {getAccountIcon(acc.type)}
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-white truncate mb-1">
                    {acc.name}
                  </h3>
                  <p className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                    {formatIDR(bal, hideBalance)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. BUDGET PROGRESS WIDGET & BILL REMINDER */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Anggaran Widget */}
        <div 
          onClick={() => onNavigateTab('PLANNING')}
          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm cursor-pointer hover:border-emerald-500/50 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Target size={14} className="text-emerald-600 dark:text-emerald-400" />
              {isAllSelected ? 'Anggaran Bulan Ini' : `Anggaran Terpakai (${selectedPerson})`}
            </span>
            <ChevronRight size={14} className="text-slate-400" />
          </div>

          {totalBudgetLimit > 0 ? (
            <div>
              <div className="flex items-baseline justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-500 dark:text-slate-400">
                  {formatIDR(totalBudgetSpent, hideBalance)}
                </span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">
                  {formatIDR(totalBudgetLimit, hideBalance)}
                </span>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    budgetUsagePercent > 90 ? 'bg-rose-500' : budgetUsagePercent > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${budgetUsagePercent}%` }}
                />
              </div>
              <div className="flex justify-between items-center mt-1.5 text-[10px]">
                <span className="text-slate-400">Terpakai {budgetUsagePercent}%</span>
                <span className={totalBudgetSpent > totalBudgetLimit ? 'text-rose-500 font-bold' : 'text-emerald-600 font-bold'}>
                  {totalBudgetSpent > totalBudgetLimit ? 'Over Budget' : `Sisa ${formatIDR(Math.max(0, totalBudgetLimit - totalBudgetSpent), hideBalance)}`}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 py-1">
              Belum ada batas anggaran. Klik untuk pasang target hemat!
            </div>
          )}
        </div>

        {/* Tagihan & Hutang Alert */}
        <div 
          onClick={() => onNavigateTab('PLANNING')}
          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm cursor-pointer hover:border-amber-500/50 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Clock size={14} className="text-amber-500" />
              Tagihan & Kewajiban
            </span>
            <ChevronRight size={14} className="text-slate-400" />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Tagihan Rutin Belum Bayar:</span>
              <span className="font-bold text-slate-800 dark:text-white">
                {unpaidBills.length} Item
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                {isAllSelected ? 'Catatan Hutang Aktif:' : `Hutang/Piutang (${selectedPerson}):`}
              </span>
              <span className="font-bold text-slate-800 dark:text-white">
                {pendingDebts.length} Catatan
              </span>
            </div>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold pt-0.5">
              Kelola di menu Rencana &rarr;
            </p>
          </div>
        </div>
      </div>

      {/* 6. TRANSAKSI TERAKHIR (Dinamis berubah sesuai anggota terpilih) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isAllSelected ? 'Transaksi Terkini' : `Transaksi Terkini • ${selectedPerson}`}
            </h2>
            {!isAllSelected && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                {displayedTransactions.length} Total
              </span>
            )}
          </div>
          <button
            onClick={() => onNavigateTab('TRANSACTIONS', isAllSelected ? undefined : selectedPerson)}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            Lihat Semua ({displayedTransactions.length}) &rarr;
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-2">
            <Receipt className="mx-auto text-slate-300 dark:text-slate-600" size={32} />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
              {isAllSelected ? 'Belum ada transaksi' : `Belum ada transaksi untuk ${selectedPerson}`}
            </p>
            <p className="text-[11px] text-slate-400">
              Tekan tombol (+) di bawah untuk mencatat transaksi untuk {isAllSelected ? 'keluarga' : selectedPerson}.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTransactions.map(t => {
              const account = accounts.find(a => a.id === t.accountId);
              const targetAccount = t.targetAccountId ? accounts.find(a => a.id === t.targetAccountId) : null;

              return (
                <div
                  key={t.id}
                  onClick={() => onViewTransactionDetails(t)}
                  className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-all active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
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

                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{t.category}</span>
                        {t.person && (
                          <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded ${
                            t.person === selectedPerson
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}>
                            {t.person}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium truncate max-w-[150px] sm:max-w-xs">
                        {t.notes || (t.type === 'TRANSFER' ? `Transfer: ${account?.name} \u2192 ${targetAccount?.name}` : account?.name)}
                      </div>
                    </div>
                  </div>

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
                      {new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Debt Payment Modal for Partial, Full, or Batch Payments */}
      <DebtPaymentModal
        isOpen={debtModalState.isOpen}
        onClose={() => setDebtModalState({ isOpen: false, mode: 'SINGLE' })}
        debts={debts}
        accounts={accounts}
        hideBalance={hideBalance}
        initialDebtId={debtModalState.initialDebtId}
        initialMode={debtModalState.mode}
        onPaySingle={(debtId, amount, accountId) => {
          if (onPayDebtInstallment) {
            onPayDebtInstallment(debtId, amount, accountId);
          }
        }}
        onPayBatch={(payments, accountId) => {
          if (onBatchPayDebts) {
            onBatchPayDebts(payments, accountId);
          }
        }}
      />

      {/* Confirmation Dialog for Dismissing Alerts */}
      <ConfirmDialog
        isOpen={!!confirmDismissAlert?.isOpen}
        title={confirmDismissAlert?.title || 'Konfirmasi Tindakan'}
        message={confirmDismissAlert?.message || 'Apakah Anda yakin ingin menyembunyikan pengingat ini?'}
        confirmText="Ya, Sembunyikan"
        cancelText="Batal"
        type="warning"
        onConfirm={handleConfirmDismiss}
        onCancel={() => setConfirmDismissAlert(null)}
      />
    </div>
  );
};
