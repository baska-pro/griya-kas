import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  PieChart as PieIcon, 
  BarChart3, 
  Award, 
  Users, 
  ShieldCheck, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calendar,
  Sparkles,
  Printer
} from 'lucide-react';
import { Transaction, Account, Budget, Debt, ThemeColor } from '../types';
import { formatIDR } from '../services/storageService';

interface AnalyticsViewProps {
  transactions: Transaction[];
  accounts: Account[];
  persons?: { id: string; label: string }[];
  budgets: Budget[];
  debts: Debt[];
  hideBalance: boolean;
  themeColor: ThemeColor;
}

const PIE_COLORS = [
  '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#EC4899', '#06B6D4', '#6366F1', '#14B8A6', '#F97316',
  '#84CC16', '#64748B'
];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  transactions,
  accounts,
  persons = [],
  budgets,
  debts,
  hideBalance,
  themeColor
}) => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Filtered month transactions
  const monthTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [transactions, selectedMonth, selectedYear]);

  const monthIncome = monthTransactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthExpense = monthTransactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthNet = monthIncome - monthExpense;

  // 1. Category Expense Breakdown
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    monthTransactions
      .filter(t => t.type === 'EXPENSE')
      .forEach(t => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });

    return Object.keys(map)
      .map(name => ({
        name,
        value: map[name]
      }))
      .sort((a, b) => b.value - a.value);
  }, [monthTransactions]);

  // 2. Family Member Detailed Report (Income, Expense, Net, and Top Category)
  const memberDetailedData = useMemo(() => {
    // List all unique persons from master data or transactions
    const allPersonLabels = Array.from(new Set([
      ...persons.map(p => p.label),
      ...monthTransactions.map(t => t.person).filter(Boolean)
    ]));

    return allPersonLabels.map((personName, idx) => {
      const pTxs = monthTransactions.filter(t => (t.person || 'Keluarga') === personName);
      const inc = pTxs.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
      const exp = pTxs.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
      const net = inc - exp;

      // Top expense category for this person
      const catMap: Record<string, number> = {};
      pTxs.filter(t => t.type === 'EXPENSE').forEach(t => {
        catMap[t.category] = (catMap[t.category] || 0) + t.amount;
      });
      const topCatEntry = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];

      return {
        name: personName,
        income: inc,
        expense: exp,
        net,
        topCategory: topCatEntry ? `${topCatEntry[0]} (${formatIDR(topCatEntry[1], hideBalance)})` : '-',
        txCount: pTxs.length
      };
    }).sort((a, b) => b.expense - a.expense);
  }, [monthTransactions, persons, hideBalance]);

  // 3. 6-Month Cashflow Trend
  const monthlyTrendData = useMemo(() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(selectedYear, selectedMonth - i, 1);
      const m = targetDate.getMonth();
      const y = targetDate.getFullYear();
      const mName = months[m].slice(0, 3);

      const txs = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === m && d.getFullYear() === y;
      });

      const inc = txs.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
      const exp = txs.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);

      data.push({
        name: `${mName} '${String(y).slice(2)}`,
        Pemasukan: inc,
        Pengeluaran: exp,
      });
    }
    return data;
  }, [transactions, selectedMonth, selectedYear]);

  // 4. Financial Health Score (0 - 100)
  const healthScore = useMemo(() => {
    let score = 50; // Baseline

    // Saving ratio: (Income - Expense) / Income >= 20%
    if (monthIncome > 0) {
      const savingRatio = (monthIncome - monthExpense) / monthIncome;
      if (savingRatio >= 0.3) score += 25;
      else if (savingRatio >= 0.2) score += 18;
      else if (savingRatio >= 0.1) score += 10;
      else if (savingRatio < 0) score -= 20; // Deficit
    }

    // Budget Adherence
    const totalBudgetLimit = budgets.reduce((sum, b) => sum + b.limit, 0);
    if (totalBudgetLimit > 0) {
      if (monthExpense <= totalBudgetLimit) score += 15;
      else score -= 15;
    } else {
      score += 5;
    }

    // Active unpaid debt burden
    const activeDebts = debts.filter(d => !d.isPaid && d.type === 'HUTANG_SAYA');
    if (activeDebts.length === 0) score += 10;
    else if (activeDebts.length > 3) score -= 10;

    return Math.max(10, Math.min(100, score));
  }, [monthIncome, monthExpense, budgets, debts]);

  const getScoreGrade = (score: number) => {
    if (score >= 85) return { text: 'Sangat Prima (A+)', color: 'text-emerald-600 dark:text-emerald-400', desc: 'Arus kas sehat, rasio tabungan optimal.' };
    if (score >= 70) return { text: 'Sehat & Terkendali (B+)', color: 'text-teal-600 dark:text-teal-400', desc: 'Keuangan stabil dengan ruang perbaikan tabungan.' };
    if (score >= 50) return { text: 'Cukup / Waspada (C)', color: 'text-amber-600 dark:text-amber-400', desc: 'Perhatikan pos pengeluaran yang mendekati batas.' };
    return { text: 'Kritis / Defisit (D)', color: 'text-rose-600 dark:text-rose-400', desc: 'Pengeluaran melebihi pemasukan. Kurangi pos tersier.' };
  };

  const grade = getScoreGrade(healthScore);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-24">
      {/* 1. MONTH SELECTOR */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
            Laporan & Analisis Keuangan
          </h2>
          <p className="text-xs text-slate-400">Evaluasi visual arus kas dan rasio kesehatan finansial</p>
        </div>

        <div className="flex gap-1.5">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="p-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-bold outline-none"
          >
            {months.map((m, idx) => (
              <option key={m} value={idx}>{m}</option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="p-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-bold outline-none"
          >
            {[2024, 2025, 2026, 2027, 2028].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. FINANCIAL HEALTH SCORE CARD */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 text-white shadow-xl border border-slate-800 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span>Skor Kesehatan Finansial</span>
          </div>
          <h3 className={`text-base font-extrabold ${grade.color}`}>
            {grade.text}
          </h3>
          <p className="text-[11px] text-slate-300 max-w-[200px] sm:max-w-xs">
            {grade.desc}
          </p>
        </div>

        <div className="relative w-18 h-18 rounded-full border-4 border-emerald-500/30 flex items-center justify-center bg-slate-800/80">
          <div className="text-center">
            <span className="text-xl font-black text-white">{healthScore}</span>
            <span className="text-[9px] text-slate-400 block -mt-1">/100</span>
          </div>
        </div>
      </div>

      {/* 3. MONTHLY SUMMARY STATS */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm text-center">
          <span className="text-[10px] font-bold text-slate-400 block">Pemasukan</span>
          <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 block truncate">
            {formatIDR(monthIncome, hideBalance)}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm text-center">
          <span className="text-[10px] font-bold text-slate-400 block">Pengeluaran</span>
          <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400 block truncate">
            {formatIDR(monthExpense, hideBalance)}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm text-center">
          <span className="text-[10px] font-bold text-slate-400 block">Selisih Bersih</span>
          <span className={`text-xs font-extrabold block truncate ${monthNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
            {formatIDR(monthNet, hideBalance)}
          </span>
        </div>
      </div>

      {/* 4. 6-MONTH TREND BAR CHART */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-emerald-600" />
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white">
              Tren Arus Kas 6 Bulan Terakhir
            </h3>
          </div>
        </div>

        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} />
              <YAxis stroke="#94A3B8" fontSize={9} tickLine={false} tickFormatter={(val) => `${val / 1000000}M`} />
              <Tooltip 
                formatter={(val: any) => formatIDR(Number(val))} 
                contentStyle={{ 
                  backgroundColor: '#0F172A', 
                  borderRadius: '1rem', 
                  border: '1px solid #334155',
                  color: '#fff',
                  fontSize: '11px'
                }} 
              />
              <Bar dataKey="Pemasukan" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Pengeluaran" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. EXPENSE BREAKDOWN BY CATEGORY (DONUT CHART) */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <PieIcon size={16} className="text-rose-500" />
          <h3 className="text-xs font-extrabold text-slate-900 dark:text-white">
            Proporsi Pengeluaran per Kategori
          </h3>
        </div>

        {categoryData.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            Tidak ada pengeluaran tercatat di bulan ini.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val: any) => formatIDR(Number(val))} 
                    contentStyle={{ 
                      backgroundColor: '#0F172A', 
                      borderRadius: '1rem', 
                      border: '1px solid #334155',
                      color: '#fff',
                      fontSize: '11px'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* List breakdown */}
            <div className="space-y-2">
              {categoryData.map((item, idx) => {
                const percent = monthExpense > 0 ? Math.round((item.value / monthExpense) * 100) : 0;
                return (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} 
                      />
                      <span className="font-bold text-slate-800 dark:text-slate-200">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-slate-900 dark:text-white">{formatIDR(item.value, hideBalance)}</span>
                      <span className="text-[10px] text-slate-400 ml-1.5 font-bold">({percent}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 6. NERACA & LAPORAN KEUANGAN MANDIRI TIAP ANGGOTA */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-blue-500" />
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white">
              Neraca & Keuangan Mandiri Tiap Anggota ({months[selectedMonth]} {selectedYear})
            </h3>
          </div>
          <span className="text-[10px] font-semibold text-slate-400">
            Uang Masing-Masing
          </span>
        </div>

        {memberDetailedData.length === 0 ? (
          <div className="text-center py-4 text-xs text-slate-400">
            Belum ada data transaksi per anggota untuk bulan ini.
          </div>
        ) : (
          <div className="space-y-3">
            {memberDetailedData.map((m, idx) => {
              const isPositive = m.net >= 0;
              const percentOfTotalExp = monthExpense > 0 ? Math.round((m.expense / monthExpense) * 100) : 0;

              return (
                <div key={m.name} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center">
                        {m.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {m.name}
                        </h4>
                        <span className="text-[10px] text-slate-400">
                          {m.txCount} Transaksi &bull; {percentOfTotalExp}% dari total belanja keluarga
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] font-bold text-slate-400 block">Sisa / Selisih Bersih</span>
                      <span className={`text-xs font-black ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {formatIDR(m.net, hideBalance)}
                      </span>
                    </div>
                  </div>

                  {/* Flow summary */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Pemasukan:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">+{formatIDR(m.income, hideBalance)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Pengeluaran:</span>
                      <span className="font-bold text-rose-600 dark:text-rose-400">-{formatIDR(m.expense, hideBalance)}</span>
                    </div>
                  </div>

                  {m.topCategory !== '-' && (
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between bg-white dark:bg-slate-900/60 px-2.5 py-1 rounded-lg">
                      <span>Pengeluaran Terbesar:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">{m.topCategory}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
