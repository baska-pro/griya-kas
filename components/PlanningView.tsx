import React, { useState } from 'react';
import { 
  Target, 
  CreditCard, 
  PiggyBank, 
  Clock, 
  Calculator, 
  Plus, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calendar, 
  Check, 
  Sparkles,
  TrendingUp,
  Percent,
  Coins,
  ShieldAlert,
  ChevronRight,
  Layers
} from 'lucide-react';
import { 
  Budget, 
  Debt, 
  SavingsGoal, 
  RecurringBill, 
  Transaction, 
  Account, 
  ThemeColor 
} from '../types';
import { formatIDR, parseNumber } from '../services/storageService';
import { DebtPaymentModal } from './DebtPaymentModal';

interface PlanningViewProps {
  budgets: Budget[];
  debts: Debt[];
  goals: SavingsGoal[];
  bills: RecurringBill[];
  transactions: Transaction[];
  accounts: Account[];
  expenseCategories: string[];
  hideBalance: boolean;
  themeColor: ThemeColor;
  onSaveBudget: (budget: Budget) => void;
  onDeleteBudget: (id: string) => void;
  onSaveDebt: (debt: Debt) => void;
  onDeleteDebt: (id: string) => void;
  onPayDebtInstallment: (debtId: string, amount: number, accountId: string) => void;
  onBatchPayDebts?: (payments: { debtId: string; payAmount: number }[], accountId: string) => void;
  onSaveGoal: (goal: SavingsGoal) => void;
  onDeleteGoal: (id: string) => void;
  onAddGoalDeposit: (goalId: string, amount: number, accountId: string) => void;
  onSaveBill: (bill: RecurringBill) => void;
  onDeleteBill: (id: string) => void;
  onToggleBillPaid: (billId: string, monthKey: string, accountId?: string) => void;
}

export const PlanningView: React.FC<PlanningViewProps> = ({
  budgets,
  debts,
  goals,
  bills,
  transactions,
  accounts,
  expenseCategories,
  hideBalance,
  themeColor,
  onSaveBudget,
  onDeleteBudget,
  onSaveDebt,
  onDeleteDebt,
  onPayDebtInstallment,
  onBatchPayDebts,
  onSaveGoal,
  onDeleteGoal,
  onAddGoalDeposit,
  onSaveBill,
  onDeleteBill,
  onToggleBillPaid
}) => {
  const [subTab, setSubTab] = useState<'BUDGET' | 'DEBTS' | 'GOALS' | 'BILLS' | 'CALCULATOR'>('BUDGET');

  // Month references
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Modals inside planning
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [budgetCategory, setBudgetCategory] = useState(expenseCategories[0] || '');
  const [budgetLimit, setBudgetLimit] = useState('');

  const [debtModalOpen, setDebtModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [debtType, setDebtType] = useState<'HUTANG_SAYA' | 'PIUTANG_ORANG'>('HUTANG_SAYA');
  const [debtPerson, setDebtPerson] = useState('');
  const [debtAmount, setDebtAmount] = useState('');
  const [debtDueDate, setDebtDueDate] = useState('');
  const [debtNotes, setDebtNotes] = useState('');

  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [goalName, setGoalName] = useState('');
  const [goalTargetAmount, setGoalTargetAmount] = useState('');
  const [goalTargetDate, setGoalTargetDate] = useState('');
  const [goalColor, setGoalColor] = useState('bg-emerald-500');

  const [billModalOpen, setBillModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<RecurringBill | null>(null);
  const [billName, setBillName] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billDueDay, setBillDueDay] = useState('5');
  const [billCategory, setBillCategory] = useState(expenseCategories[0] || 'Tagihan & Utilitas');

  // Quick Installment / Deposit modals
  const [quickActionModal, setQuickActionModal] = useState<{
    type: 'DEBT_PAY' | 'GOAL_ADD';
    id: string;
    title: string;
    maxAmount?: number;
  } | null>(null);
  const [actionAmount, setActionAmount] = useState('');
  const [actionAccountId, setActionAccountId] = useState(accounts[0]?.id || '');

  // Debt Payment Modal State (Supports Partial, Full, or Batch Payments)
  const [debtPaymentModalState, setDebtPaymentModalState] = useState<{
    isOpen: boolean;
    initialDebtId?: string;
    mode: 'SINGLE' | 'BATCH';
  }>({ isOpen: false, mode: 'SINGLE' });

  // =========================================================================
  // CALCULATOR STATES
  // =========================================================================
  const [calcType, setCalcType] = useState<'EMERGENCY' | 'ZAKAT' | 'INVESTMENT'>('EMERGENCY');
  
  // Emergency Fund
  const [monthlyExpenseCalc, setMonthlyExpenseCalc] = useState('5000000');
  const [maritalStatus, setMaritalStatus] = useState<'SINGLE' | 'MARRIED' | 'MARRIED_KIDS'>('MARRIED_KIDS');

  // Zakat Maal
  const [goldPricePerGram, setGoldPricePerGram] = useState('1450000');
  const [totalAssetCalc, setTotalAssetCalc] = useState('150000000');

  // Investment / Future Savings
  const [initialCapital, setInitialCapital] = useState('10000000');
  const [monthlyDeposit, setMonthlyDeposit] = useState('1500000');
  const [annualReturn, setAnnualReturn] = useState('8');
  const [durationYears, setDurationYears] = useState('5');

  // Current Month Category Spends for Budgeting
  const currentMonthTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });

  const categorySpends: Record<string, number> = {};
  currentMonthTransactions.forEach(t => {
    if (t.type === 'EXPENSE') {
      categorySpends[t.category] = (categorySpends[t.category] || 0) + t.amount;
    }
  });

  // Open Handlers
  const handleOpenBudgetModal = (b?: Budget) => {
    if (b) {
      setEditingBudget(b);
      setBudgetCategory(b.category);
      setBudgetLimit(String(b.limit));
    } else {
      setEditingBudget(null);
      setBudgetCategory(expenseCategories[0] || '');
      setBudgetLimit('');
    }
    setBudgetModalOpen(true);
  };

  const handleSaveBudgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseNumber(budgetLimit);
    if (limit <= 0) {
      alert("Harap masukkan batas anggaran yang valid.");
      return;
    }
    onSaveBudget({
      id: editingBudget?.id || `b_${Date.now()}`,
      category: budgetCategory,
      limit,
      period: 'MONTHLY'
    });
    setBudgetModalOpen(false);
  };

  const handleOpenDebtModal = (d?: Debt) => {
    if (d) {
      setEditingDebt(d);
      setDebtType(d.type === 'HUTANG' || d.type === 'HUTANG_SAYA' ? 'HUTANG_SAYA' : 'PIUTANG_ORANG');
      setDebtPerson(d.personName || d.name || '');
      setDebtAmount(String(d.amount));
      setDebtDueDate(d.dueDate || '');
      setDebtNotes(d.notes || '');
    } else {
      setEditingDebt(null);
      setDebtType('HUTANG_SAYA');
      setDebtPerson('');
      setDebtAmount('');
      setDebtDueDate('');
      setDebtNotes('');
    }
    setDebtModalOpen(true);
  };

  const handleSaveDebtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseNumber(debtAmount);
    if (amt <= 0 || !debtPerson.trim()) {
      alert("Harap lengkapi nama pihak & nominal hutang/piutang.");
      return;
    }
    onSaveDebt({
      id: editingDebt?.id || `d_${Date.now()}`,
      type: debtType,
      personName: debtPerson.trim(),
      amount: amt,
      paidAmount: editingDebt ? editingDebt.paidAmount : 0,
      dueDate: debtDueDate || undefined,
      notes: debtNotes.trim() || undefined,
      isPaid: editingDebt ? editingDebt.isPaid : false,
      createdAt: editingDebt?.createdAt || new Date().toISOString()
    });
    setDebtModalOpen(false);
  };

  const handleOpenGoalModal = (g?: SavingsGoal) => {
    if (g) {
      setEditingGoal(g);
      setGoalName(g.name);
      setGoalTargetAmount(String(g.targetAmount));
      setGoalTargetDate(g.targetDate || '');
      setGoalColor(g.color || 'bg-emerald-500');
    } else {
      setEditingGoal(null);
      setGoalName('');
      setGoalTargetAmount('');
      setGoalTargetDate('');
      setGoalColor('bg-emerald-500');
    }
    setGoalModalOpen(true);
  };

  const handleSaveGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseNumber(goalTargetAmount);
    if (target <= 0 || !goalName.trim()) {
      alert("Harap lengkapi nama impian & target nominal.");
      return;
    }
    onSaveGoal({
      id: editingGoal?.id || `g_${Date.now()}`,
      name: goalName.trim(),
      targetAmount: target,
      currentAmount: editingGoal ? editingGoal.currentAmount : 0,
      targetDate: goalTargetDate || undefined,
      color: goalColor
    });
    setGoalModalOpen(false);
  };

  const handleOpenBillModal = (b?: RecurringBill) => {
    if (b) {
      setEditingBill(b);
      setBillName(b.name);
      setBillAmount(String(b.amount));
      setBillDueDay(String(b.dueDay));
      setBillCategory(b.category);
    } else {
      setEditingBill(null);
      setBillName('');
      setBillAmount('');
      setBillDueDay('5');
      setBillCategory(expenseCategories[0] || 'Tagihan & Utilitas');
    }
    setBillModalOpen(true);
  };

  const handleSaveBillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseNumber(billAmount);
    const day = parseInt(billDueDay, 10);
    if (amt <= 0 || !billName.trim() || day < 1 || day > 31) {
      alert("Harap lengkapi nama tagihan, nominal, dan tanggal jatuh tempo (1-31).");
      return;
    }
    onSaveBill({
      id: editingBill?.id || `bill_${Date.now()}`,
      name: billName.trim(),
      amount: amt,
      dueDay: day,
      category: billCategory,
      paidMonths: editingBill?.paidMonths || []
    });
    setBillModalOpen(false);
  };

  const handleExecuteQuickAction = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseNumber(actionAmount);
    if (amt <= 0 || !actionAccountId) {
      alert("Harap masukkan nominal dan pilih akun.");
      return;
    }

    if (quickActionModal?.type === 'DEBT_PAY') {
      onPayDebtInstallment(quickActionModal.id, amt, actionAccountId);
    } else if (quickActionModal?.type === 'GOAL_ADD') {
      onAddGoalDeposit(quickActionModal.id, amt, actionAccountId);
    }

    setQuickActionModal(null);
    setActionAmount('');
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-24">
      {/* 1. SUB-TAB PILL SWITCHER */}
      <div className="flex gap-1.5 p-1 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-x-auto no-scrollbar shadow-xs">
        <button
          onClick={() => setSubTab('BUDGET')}
          className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shrink-0 transition-all ${
            subTab === 'BUDGET'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Target size={14} /> Anggaran
        </button>
        <button
          onClick={() => setSubTab('DEBTS')}
          className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shrink-0 transition-all ${
            subTab === 'DEBTS'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <CreditCard size={14} /> Hutang/Piutang
        </button>
        <button
          onClick={() => setSubTab('GOALS')}
          className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shrink-0 transition-all ${
            subTab === 'GOALS'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <PiggyBank size={14} /> Tabungan Impian
        </button>
        <button
          onClick={() => setSubTab('BILLS')}
          className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shrink-0 transition-all ${
            subTab === 'BILLS'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Clock size={14} /> Tagihan Rutin
        </button>
        <button
          onClick={() => setSubTab('CALCULATOR')}
          className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shrink-0 transition-all ${
            subTab === 'CALCULATOR'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Calculator size={14} /> Kalkulator
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. SUB-TAB: ANGGARAN (BUDGETS) */}
      {/* ========================================================================= */}
      {subTab === 'BUDGET' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Batas Anggaran Bulanan
              </h2>
              <p className="text-xs text-slate-400">Kendalikan pengeluaran per kategori agar tidak boros</p>
            </div>
            <button
              onClick={() => handleOpenBudgetModal()}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-95"
            >
              <Plus size={14} /> Pasang Target
            </button>
          </div>

          {budgets.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-2">
              <Target className="mx-auto text-slate-300 dark:text-slate-600" size={36} />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Belum ada anggaran yang diatur</p>
              <p className="text-[11px] text-slate-400">Atur batas belanja per kategori (misal: Makanan 2 Juta) untuk memantau keuangan.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {budgets.map(b => {
                const spent = categorySpends[b.category] || 0;
                const percent = Math.min(Math.round((spent / b.limit) * 100), 100);
                const isOver = spent > b.limit;
                const isWarning = percent >= 80 && !isOver;

                return (
                  <div
                    key={b.id}
                    className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-800 dark:text-white">
                          {b.category}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isOver 
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400' 
                            : isWarning 
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400' 
                            : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {isOver ? 'Melebihi Batas' : isWarning ? 'Mendekati Batas' : 'Aman'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenBudgetModal(b)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => onDeleteBudget(b.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">
                        Terpakai: <span className="font-bold text-slate-800 dark:text-white">{formatIDR(spent, hideBalance)}</span> ({percent}%)
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 font-medium">
                        Batas: <span className="font-bold text-slate-800 dark:text-white">{formatIDR(b.limit, hideBalance)}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SUB-TAB: HUTANG & PIUTANG (DEBTS) */}
      {/* ========================================================================= */}
      {subTab === 'DEBTS' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Buku Hutang & Piutang
              </h2>
              <p className="text-xs text-slate-400">Pantau pinjaman & piutang dengan pelunasan bertahap atau sekaligus</p>
            </div>
            <div className="flex items-center gap-1.5">
              {debts.filter(d => !d.isPaid).length > 1 && (
                <button
                  onClick={() => setDebtPaymentModalState({ isOpen: true, mode: 'BATCH' })}
                  className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold transition-all active:scale-95"
                >
                  <Layers size={13} /> Bayar Beberapa
                </button>
              )}
              <button
                onClick={() => handleOpenDebtModal()}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-95"
              >
                <Plus size={14} /> Catat Pinjaman
              </button>
            </div>
          </div>

          {debts.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-2">
              <CreditCard className="mx-auto text-slate-300 dark:text-slate-600" size={36} />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Tidak ada catatan hutang / piutang</p>
              <p className="text-[11px] text-slate-400">Tekan 'Catat Pinjaman' untuk mencatat hutang Anda atau piutang yang dipinjam teman.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {debts.map(d => {
                const remaining = Math.max(0, d.amount - (d.paidAmount || 0));
                const percent = d.amount > 0 ? Math.min(Math.round(((d.paidAmount || 0) / d.amount) * 100), 100) : 0;

                return (
                  <div
                    key={d.id}
                    className={`p-4 rounded-2xl border shadow-sm space-y-3 bg-white dark:bg-slate-900 ${
                      d.isPaid 
                        ? 'border-emerald-500/30 opacity-80' 
                        : 'border-slate-200/80 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs ${
                          d.type === 'HUTANG_SAYA' ? 'bg-rose-500' : 'bg-blue-500'
                        }`}>
                          {d.type === 'HUTANG_SAYA' ? 'HUTANG' : 'PIUTANG'}
                        </div>
                        <div>
                          <h3 className="text-xs font-extrabold text-slate-900 dark:text-white">
                            {d.personName || d.name}
                          </h3>
                          <p className="text-[11px] text-slate-400">
                            {d.dueDate ? `Jatuh tempo: ${d.dueDate}` : 'Tanpa batas waktu'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenDebtModal(d)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => onDeleteDebt(d.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {d.notes && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
                        "{d.notes}"
                      </p>
                    )}

                    {/* Amount & Progress */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-500">Terbayar: {formatIDR(d.paidAmount || 0, hideBalance)}</span>
                        <span className="text-slate-900 dark:text-white font-extrabold">Total: {formatIDR(d.amount, hideBalance)}</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    {/* Action */}
                    <div className="flex items-center justify-between pt-1">
                      <span className={`text-xs font-extrabold ${d.isPaid ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {d.isPaid ? '✓ LUNAS' : `Sisa: ${formatIDR(remaining, hideBalance)}`}
                      </span>

                      {!d.isPaid && (
                        <button
                          onClick={() => {
                            setDebtPaymentModalState({
                              isOpen: true,
                              initialDebtId: d.id,
                              mode: 'SINGLE'
                            });
                          }}
                          className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold border border-emerald-300/40 transition-colors flex items-center gap-1"
                        >
                          <Check size={12} strokeWidth={2.5} /> Catat Pembayaran &rarr;
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SUB-TAB: TARGET TABUNGAN (GOALS) */}
      {/* ========================================================================= */}
      {subTab === 'GOALS' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Target Tabungan Impian
              </h2>
              <p className="text-xs text-slate-400">Rencanakan dana masa depan (Rumah, Umroh, Liburan, Gadget)</p>
            </div>
            <button
              onClick={() => handleOpenGoalModal()}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-95"
            >
              <Plus size={14} /> Buat Target
            </button>
          </div>

          {goals.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-2">
              <PiggyBank className="mx-auto text-slate-300 dark:text-slate-600" size={36} />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Belum ada target tabungan</p>
              <p className="text-[11px] text-slate-400">Buat pos tabungan baru untuk mewujudkan impian Anda step-by-step.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {goals.map(g => {
                const percent = g.targetAmount > 0 ? Math.min(Math.round((g.currentAmount / g.targetAmount) * 100), 100) : 0;
                const isAchieved = g.currentAmount >= g.targetAmount;

                return (
                  <div
                    key={g.id}
                    className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-10 h-10 rounded-2xl ${g.color || 'bg-emerald-600'} text-white flex items-center justify-center shadow-sm`}>
                          <PiggyBank size={20} />
                        </div>
                        <div>
                          <h3 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{g.name}</span>
                            {isAchieved && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded">
                                Tercapai!
                              </span>
                            )}
                          </h3>
                          <p className="text-[11px] text-slate-400">
                            {g.targetDate ? `Target: ${g.targetDate}` : 'Fleksibel'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenGoalModal(g)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => onDeleteGoal(g.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-emerald-600 font-extrabold">Terkumpul: {formatIDR(g.currentAmount, hideBalance)}</span>
                        <span className="text-slate-500">Target: {formatIDR(g.targetAmount, hideBalance)}</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs font-bold text-slate-400">
                        {percent}% Tercapai
                      </span>
                      <button
                        onClick={() => {
                          setQuickActionModal({
                            type: 'GOAL_ADD',
                            id: g.id,
                            title: `Setor Tabungan: ${g.name}`
                          });
                          setActionAmount('');
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95"
                      >
                        + Setor Tabungan
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SUB-TAB: TAGIHAN RUTIN (BILLS) */}
      {/* ========================================================================= */}
      {subTab === 'BILLS' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Daftar Tagihan Bulanan
              </h2>
              <p className="text-xs text-slate-400">Listrik, Wifi, Air, BPJS, Streaming, SPP Sekolah</p>
            </div>
            <button
              onClick={() => handleOpenBillModal()}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-95"
            >
              <Plus size={14} /> Tambah Tagihan
            </button>
          </div>

          {bills.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-2">
              <Clock className="mx-auto text-slate-300 dark:text-slate-600" size={36} />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Belum ada tagihan rutin</p>
              <p className="text-[11px] text-slate-400">Daftarkan tagihan bulanan agar tidak telat bayar & kena denda.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {bills.map(bill => {
                const isPaidThisMonth = (bill.paidMonths || []).includes(currentMonthKey);

                return (
                  <div
                    key={bill.id}
                    className={`p-3.5 rounded-2xl border shadow-sm flex items-center justify-between transition-all ${
                      isPaidThisMonth
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500/30'
                        : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onToggleBillPaid(bill.id, currentMonthKey)}
                        className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                          isPaidThisMonth
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'border-2 border-slate-300 dark:border-slate-700 hover:border-emerald-500'
                        }`}
                        title={isPaidThisMonth ? "Tandai Belum Bayar" : "Tandai Sudah Bayar"}
                      >
                        {isPaidThisMonth && <Check size={16} strokeWidth={3} />}
                      </button>

                      <div>
                        <h3 className={`text-xs font-extrabold ${isPaidThisMonth ? 'text-slate-500 line-through' : 'text-slate-900 dark:text-white'}`}>
                          {bill.name}
                        </h3>
                        <p className="text-[10px] text-slate-400">
                          Jatuh tempo tgl {bill.dueDay} &bull; {bill.category}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className={`text-xs font-extrabold ${isPaidThisMonth ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                          {formatIDR(bill.amount, hideBalance)}
                        </div>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          isPaidThisMonth ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600' : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600'
                        }`}>
                          {isPaidThisMonth ? 'Lunas Bln Ini' : 'Belum Bayar'}
                        </span>
                      </div>

                      <div className="flex items-center">
                        <button
                          onClick={() => handleOpenBillModal(bill)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => onDeleteBill(bill.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. SUB-TAB: KALKULATOR FINANSIAL INTERAKTIF */}
      {/* ========================================================================= */}
      {subTab === 'CALCULATOR' && (
        <div className="space-y-4">
          {/* Calc Selector */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <button
              onClick={() => setCalcType('EMERGENCY')}
              className={`py-2 rounded-xl text-xs font-bold transition-all ${
                calcType === 'EMERGENCY' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500'
              }`}
            >
              Dana Darurat
            </button>
            <button
              onClick={() => setCalcType('ZAKAT')}
              className={`py-2 rounded-xl text-xs font-bold transition-all ${
                calcType === 'ZAKAT' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500'
              }`}
            >
              Zakat Maal
            </button>
            <button
              onClick={() => setCalcType('INVESTMENT')}
              className={`py-2 rounded-xl text-xs font-bold transition-all ${
                calcType === 'INVESTMENT' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500'
              }`}
            >
              Investasi / Tabungan
            </button>
          </div>

          {/* 1. Dana Darurat Calculator */}
          {calcType === 'EMERGENCY' && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="text-emerald-600" size={20} />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Kalkulator Kebutuhan Dana Darurat</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Rata-rata Pengeluaran Rutin per Bulan</label>
                  <input
                    type="text"
                    value={new Intl.NumberFormat('id-ID').format(parseNumber(monthlyExpenseCalc))}
                    onChange={(e) => setMonthlyExpenseCalc(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Status Tanggungan Keluarga</label>
                  <select
                    value={maritalStatus}
                    onChange={(e) => setMaritalStatus(e.target.value as any)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none"
                  >
                    <option value="SINGLE">Lajang / Belum Menikah (Standar 3 - 6x Pengeluaran)</option>
                    <option value="MARRIED">Menikah Tanpa Anak (Standar 6 - 9x Pengeluaran)</option>
                    <option value="MARRIED_KIDS">Menikah + Punya Anak / Tanggungan (Standar 12x Pengeluaran)</option>
                  </select>
                </div>

                {/* Calculation Result */}
                {(() => {
                  const exp = parseNumber(monthlyExpenseCalc);
                  const multiplier = maritalStatus === 'SINGLE' ? 6 : maritalStatus === 'MARRIED' ? 9 : 12;
                  const idealAmount = exp * multiplier;

                  return (
                    <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-center space-y-1">
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Target Ideal Dana Darurat Anda ({multiplier} Bulan):</span>
                      <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                        {formatIDR(idealAmount)}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Simpan dana ini di rekening terpisah atau instrumen likuid (Deposito/Pasar Uang) yang aman dari risiko.
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* 2. Zakat Maal Calculator */}
          {calcType === 'ZAKAT' && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Coins className="text-amber-500" size={20} />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Kalkulator Zakat Maal (Simpanan & Harta)</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Harga Emas Murni Saat Ini per Gram</label>
                  <input
                    type="text"
                    value={new Intl.NumberFormat('id-ID').format(parseNumber(goldPricePerGram))}
                    onChange={(e) => setGoldPricePerGram(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Total Harta Tabungan, Emas, & Surat Berharga (&gt; 1 Tahun)</label>
                  <input
                    type="text"
                    value={new Intl.NumberFormat('id-ID').format(parseNumber(totalAssetCalc))}
                    onChange={(e) => setTotalAssetCalc(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none"
                  />
                </div>

                {/* Zakat Result */}
                {(() => {
                  const goldPrice = parseNumber(goldPricePerGram);
                  const assets = parseNumber(totalAssetCalc);
                  const nisab = 85 * goldPrice; // Nisab 85 gram emas
                  const isWajib = assets >= nisab;
                  const zakatAmount = isWajib ? assets * 0.025 : 0;

                  return (
                    <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-500/30 text-center space-y-1.5">
                      <div className="text-xs font-bold text-amber-900 dark:text-amber-300">
                        Nisab Standar (85 gr Emas): <span className="font-extrabold">{formatIDR(nisab)}</span>
                      </div>
                      <div className={`text-xl font-black ${isWajib ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                        {isWajib ? `Zakat Wajib: ${formatIDR(zakatAmount)}` : 'Belum Mencapai Batas Nisab'}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {isWajib 
                          ? 'Harta Anda telah melampaui nisab. Zakat maal sebesar 2.5% disalurkan kepada 8 asnaf penerima.' 
                          : 'Harta Anda belum wajib zakat maal, namun sangat dianjurkan untuk memperbanyak sedekah sukarela.'}
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* 3. Investment Growth Calculator */}
          {calcType === 'INVESTMENT' && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="text-emerald-600" size={20} />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Simulasi Akumulasi Investasi Masa Depan</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Modal Awal</label>
                  <input
                    type="text"
                    value={new Intl.NumberFormat('id-ID').format(parseNumber(initialCapital))}
                    onChange={(e) => setInitialCapital(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Setoran Bulanan</label>
                  <input
                    type="text"
                    value={new Intl.NumberFormat('id-ID').format(parseNumber(monthlyDeposit))}
                    onChange={(e) => setMonthlyDeposit(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Estimasi Return (%/Thn)</label>
                  <input
                    type="number"
                    value={annualReturn}
                    onChange={(e) => setAnnualReturn(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Jangka Waktu (Tahun)</label>
                  <input
                    type="number"
                    value={durationYears}
                    onChange={(e) => setDurationYears(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold outline-none"
                  />
                </div>
              </div>

              {/* Investment Projection */}
              {(() => {
                const P = parseNumber(initialCapital);
                const PMT = parseNumber(monthlyDeposit);
                const r = (parseFloat(annualReturn) || 0) / 100 / 12;
                const n = (parseInt(durationYears, 10) || 1) * 12;

                let futureValue = P;
                if (r > 0) {
                  futureValue = P * Math.pow(1 + r, n) + PMT * ((Math.pow(1 + r, n) - 1) / r);
                } else {
                  futureValue = P + PMT * n;
                }

                const totalPrincipal = P + PMT * n;
                const totalInterest = Math.max(0, futureValue - totalPrincipal);

                return (
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 space-y-2">
                    <div className="text-center">
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Estimasi Total Nilai di Akhir Periode:</span>
                      <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                        {formatIDR(Math.round(futureValue))}
                      </div>
                    </div>
                    <div className="flex justify-between text-xs pt-1 border-t border-emerald-200/60 dark:border-emerald-800/40">
                      <span>Total Modal Disetor: <b>{formatIDR(totalPrincipal)}</b></span>
                      <span className="text-emerald-700 dark:text-emerald-400">Keuntungan: <b>+{formatIDR(Math.round(totalInterest))}</b></span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: BUDGET FORM */}
      {/* ========================================================================= */}
      {budgetModalOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              {editingBudget ? 'Edit Anggaran' : 'Pasang Anggaran Baru'}
            </h3>
            <form onSubmit={handleSaveBudgetSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Kategori Pengeluaran</label>
                <select
                  value={budgetCategory}
                  onChange={(e) => setBudgetCategory(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold outline-none"
                >
                  {expenseCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Batas Maksimal Bulanan (Rp)</label>
                <input
                  type="text"
                  value={budgetLimit ? new Intl.NumberFormat('id-ID').format(parseNumber(budgetLimit)) : ''}
                  onChange={(e) => setBudgetLimit(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Contoh: 2000000"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm font-bold outline-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBudgetModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: DEBT FORM */}
      {/* ========================================================================= */}
      {debtModalOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              {editingDebt ? 'Edit Catatan Pinjaman' : 'Catat Pinjaman Baru'}
            </h3>
            <form onSubmit={handleSaveDebtSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setDebtType('HUTANG_SAYA')}
                  className={`py-2 rounded-lg text-xs font-bold ${debtType === 'HUTANG_SAYA' ? 'bg-rose-600 text-white' : 'text-slate-500'}`}
                >
                  Hutang Saya
                </button>
                <button
                  type="button"
                  onClick={() => setDebtType('PIUTANG_ORANG')}
                  className={`py-2 rounded-lg text-xs font-bold ${debtType === 'PIUTANG_ORANG' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}
                >
                  Piutang Orang
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">
                  {debtType === 'HUTANG_SAYA' ? 'Pemberi Pinjaman (Nama Orang/Bank)' : 'Peminjam (Nama Orang)'}
                </label>
                <input
                  type="text"
                  value={debtPerson}
                  onChange={(e) => setDebtPerson(e.target.value)}
                  placeholder="Contoh: Budi, Bank Mandiri, dll"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Total Nominal (Rp)</label>
                <input
                  type="text"
                  value={debtAmount ? new Intl.NumberFormat('id-ID').format(parseNumber(debtAmount)) : ''}
                  onChange={(e) => setDebtAmount(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="0"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm font-bold outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Tanggal Jatuh Tempo (Opsional)</label>
                <input
                  type="date"
                  value={debtDueDate}
                  onChange={(e) => setDebtDueDate(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  value={debtNotes}
                  onChange={(e) => setDebtNotes(e.target.value)}
                  placeholder="Contoh: Pinjam untuk renovasi, dll"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDebtModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: GOAL FORM */}
      {/* ========================================================================= */}
      {goalModalOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              {editingGoal ? 'Edit Target Impian' : 'Buat Target Impian Baru'}
            </h3>
            <form onSubmit={handleSaveGoalSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Nama Impian</label>
                <input
                  type="text"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  placeholder="Contoh: DP Rumah, Ibadah Umroh, Laptop Baru"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Target Dana yang Dibutuhkan (Rp)</label>
                <input
                  type="text"
                  value={goalTargetAmount ? new Intl.NumberFormat('id-ID').format(parseNumber(goalTargetAmount)) : ''}
                  onChange={(e) => setGoalTargetAmount(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="0"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm font-bold outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Target Waktu Tercapai (Opsional)</label>
                <input
                  type="date"
                  value={goalTargetDate}
                  onChange={(e) => setGoalTargetDate(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold outline-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setGoalModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: BILL FORM */}
      {/* ========================================================================= */}
      {billModalOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              {editingBill ? 'Edit Tagihan' : 'Tambah Tagihan Rutin'}
            </h3>
            <form onSubmit={handleSaveBillSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Nama Tagihan</label>
                <input
                  type="text"
                  value={billName}
                  onChange={(e) => setBillName(e.target.value)}
                  placeholder="Contoh: Tagihan Listrik PLN, Indihome, BPJS"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Estimasi Nominal (Rp)</label>
                <input
                  type="text"
                  value={billAmount ? new Intl.NumberFormat('id-ID').format(parseNumber(billAmount)) : ''}
                  onChange={(e) => setBillAmount(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="0"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm font-bold outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Jatuh Tempo (Tgl 1-31)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={billDueDay}
                    onChange={(e) => setBillDueDay(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Kategori</label>
                  <select
                    value={billCategory}
                    onChange={(e) => setBillCategory(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold outline-none truncate"
                  >
                    {expenseCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBillModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: QUICK ACTION MODAL (DEPOSIT GOAL / PAY DEBT) */}
      {/* ========================================================================= */}
      {quickActionModal && (
        <div className="fixed inset-0 z-[135] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              {quickActionModal.title}
            </h3>
            <form onSubmit={handleExecuteQuickAction} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Nominal (Rp)</label>
                <input
                  type="text"
                  value={actionAmount ? new Intl.NumberFormat('id-ID').format(parseNumber(actionAmount)) : ''}
                  onChange={(e) => setActionAmount(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="0"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm font-bold outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Sumber Rekening / Dompet</label>
                <select
                  value={actionAccountId}
                  onChange={(e) => setActionAccountId(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold outline-none"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickActionModal(null)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30"
                >
                  Konfirmasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Debt Payment Modal for Partial, Full, or Batch Payments */}
      <DebtPaymentModal
        isOpen={debtPaymentModalState.isOpen}
        onClose={() => setDebtPaymentModalState({ isOpen: false, mode: 'SINGLE' })}
        debts={debts}
        accounts={accounts}
        hideBalance={hideBalance}
        initialDebtId={debtPaymentModalState.initialDebtId}
        initialMode={debtPaymentModalState.mode}
        onPaySingle={(debtId, amount, accountId) => {
          onPayDebtInstallment(debtId, amount, accountId);
        }}
        onPayBatch={(payments, accountId) => {
          if (onBatchPayDebts) {
            onBatchPayDebts(payments, accountId);
          }
        }}
      />
    </div>
  );
};
