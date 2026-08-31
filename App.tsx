import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Layout } from './components/Layout';
import { Header } from './components/Header';
import { Navbar } from './components/Navbar';
import { Toast } from './components/Toast';
import { ConfirmDialog } from './components/ConfirmDialog';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';
import { PlanningView } from './components/PlanningView';
import { AnalyticsView } from './components/AnalyticsView';
import { SettingsView } from './components/SettingsView';
import { TransactionFormModal } from './components/TransactionFormModal';
import { TransferModal } from './components/TransferModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { MasterDataModal } from './components/MasterDataModal';
import { ReceiptViewerModal } from './components/ReceiptViewerModal';
import { PinModal } from './components/PinModal';

import { 
  Transaction, 
  Account, 
  Budget, 
  Debt, 
  SavingsGoal, 
  RecurringBill, 
  ThemeColor, 
  MainTab, 
  CloudSyncConfig,
  TransactionType
} from './types';

import {
  loadTransactions,
  saveTransactions,
  loadAccounts,
  saveAccounts,
  loadIncomeCategories,
  saveIncomeCategories,
  loadExpenseCategories,
  saveExpenseCategories,
  loadPersons,
  savePersons,
  loadBudgets,
  saveBudgets,
  loadDebts,
  saveDebts,
  loadGoals,
  saveGoals,
  loadRecurringBills,
  saveRecurringBills,
  loadCloudSyncConfig,
  saveCloudSyncConfig,
  loadAppSettings,
  saveAppSettings,
  clearAllStorage,
  downloadCSVTransactions
} from './services/storageService';
import { hasSecurityPin, setSecurityPin, verifySecurityPin } from './services/securityService';

import { 
  smartSyncCloud,
  pushToGoogleAppsScript, 
  pushToSupabase, 
  triggerAutoSync 
} from './services/cloudSyncService';

export const App: React.FC = () => {
  // Navigation & View
  const [activeTab, setActiveTab] = useState<MainTab>('DASHBOARD');

  // Core Data
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadTransactions());
  const [accounts, setAccounts] = useState<Account[]>(() => loadAccounts());
  const [incomeCategories, setIncomeCategories] = useState<string[]>(() => loadIncomeCategories());
  const [expenseCategories, setExpenseCategories] = useState<string[]>(() => loadExpenseCategories());
  const [persons, setPersons] = useState<{ id: string; label: string }[]>(() => loadPersons());
  
  // Planning Data
  const [budgets, setBudgets] = useState<Budget[]>(() => loadBudgets());
  const [debts, setDebts] = useState<Debt[]>(() => loadDebts());
  const [goals, setGoals] = useState<SavingsGoal[]>(() => loadGoals());
  const [bills, setBills] = useState<RecurringBill[]>(() => loadRecurringBills());

  // Cloud Sync & App Settings
  const [cloudSyncConfig, setCloudSyncConfig] = useState<CloudSyncConfig>(() => loadCloudSyncConfig());
  const [appSettings, setAppSettings] = useState(() => loadAppSettings());
  const [isSyncing, setIsSyncing] = useState(false);

  // Security PIN
  const [hasPin, setHasPin] = useState<boolean>(() => hasSecurityPin());
  const [isLocked, setIsLocked] = useState<boolean>(() => hasSecurityPin());
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);

  // Toast
  const [toast, setToast] = useState<{ isVisible: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    isVisible: false,
    message: '',
    type: 'info'
  });

  // Confirm Dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    onConfirm: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    type?: 'confirm' | 'alert' | 'success' | 'warning';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Modals
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [presetTxType, setPresetTxType] = useState<TransactionType>('EXPENSE');
  const [presetPerson, setPresetPerson] = useState<string | undefined>(undefined);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isCloudSyncModalOpen, setIsCloudSyncModalOpen] = useState(false);
  const [isMasterDataModalOpen, setIsMasterDataModalOpen] = useState(false);
  const [viewingReceiptImage, setViewingReceiptImage] = useState<string | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ isVisible: true, message, type });
  }, []);

  // Reload all data after restore / cloud pull
  const refreshAllData = useCallback(() => {
    setTransactions(loadTransactions());
    setAccounts(loadAccounts());
    setIncomeCategories(loadIncomeCategories());
    setExpenseCategories(loadExpenseCategories());
    setPersons(loadPersons());
    setBudgets(loadBudgets());
    setDebts(loadDebts());
    setGoals(loadGoals());
    setBills(loadRecurringBills());
    setCloudSyncConfig(loadCloudSyncConfig());
    setAppSettings(loadAppSettings());
  }, []);

  // Multi-device realtime synchronization listener & poller
  useEffect(() => {
    // 1. Listen for background sync updates dispatched by the sync engine
    const handleDataSynced = () => {
      refreshAllData();
    };
    window.addEventListener('griyakas-data-synced', handleDataSynced);

    // 2. Initial Smart 2-Way Sync on Application Mount
    const cfg = loadCloudSyncConfig();
    const isConfigured = (cfg.supabase.enabled && cfg.supabase.projectUrl && cfg.supabase.anonKey) ||
                         (cfg.googleSheets.enabled && cfg.googleSheets.webAppUrl);

    if (isConfigured) {
      smartSyncCloud(cfg).then(res => {
        if (res.success) {
          refreshAllData();
        }
      }).catch(err => {
        console.warn('Initial cloud sync check:', err);
      });
    }

    // 3. Periodic Background Sync every 25 seconds for multi-family realtime collaboration
    const syncInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        const currentCfg = loadCloudSyncConfig();
        const isAuto = (currentCfg.supabase.enabled && currentCfg.supabase.autoSync && currentCfg.supabase.projectUrl) ||
                       (currentCfg.googleSheets.enabled && currentCfg.googleSheets.autoSync && currentCfg.googleSheets.webAppUrl);
        if (isAuto) {
          smartSyncCloud(currentCfg).then(res => {
            if (res.success) refreshAllData();
          }).catch(() => {});
        }
      }
    }, 25000);

    // 4. Instant sync on tab focus / window visibility
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const currentCfg = loadCloudSyncConfig();
        const isAuto = (currentCfg.supabase.enabled && currentCfg.supabase.autoSync && currentCfg.supabase.projectUrl) ||
                       (currentCfg.googleSheets.enabled && currentCfg.googleSheets.autoSync && currentCfg.googleSheets.webAppUrl);
        if (isAuto) {
          smartSyncCloud(currentCfg).then(res => {
            if (res.success) refreshAllData();
          }).catch(() => {});
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      window.removeEventListener('griyakas-data-synced', handleDataSynced);
      clearInterval(syncInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [refreshAllData]);

  // ==========================================
  // SYNC ACTIONS
  // ==========================================
  const handleTriggerManualSync = async () => {
    if (!cloudSyncConfig.googleSheets.enabled && !cloudSyncConfig.supabase.enabled) {
      setIsCloudSyncModalOpen(true);
      return;
    }

    setIsSyncing(true);
    try {
      const res = await smartSyncCloud(cloudSyncConfig);
      setIsSyncing(false);
      if (res.success) {
        showToast(res.message, 'success');
        refreshAllData();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      setIsSyncing(false);
      showToast(`Gagal menyinkronkan: ${err.message}`, 'error');
    }
  };

  // ==========================================
  // TRANSACTION HANDLERS
  // ==========================================
  const handleSaveTransaction = (txData: Partial<Transaction>) => {
    let updated: Transaction[];

    if (txData.id) {
      // Edit existing
      updated = transactions.map(t => t.id === txData.id ? { ...t, ...txData } as Transaction : t);
      showToast("Transaksi berhasil diperbarui", 'success');
    } else {
      // Add new
      const newTx: Transaction = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        date: txData.date || new Date().toISOString().slice(0, 10),
        type: txData.type || 'EXPENSE',
        category: txData.category || 'Lainnya',
        amount: txData.amount || 0,
        accountId: txData.accountId || accounts[0]?.id || '',
        targetAccountId: txData.targetAccountId,
        person: txData.person || persons[0]?.label || '',
        notes: txData.notes || '',
        attachmentImage: txData.attachmentImage,
        relatedId: txData.relatedId
      };
      updated = [newTx, ...transactions];
      showToast("Transaksi baru dicatat!", 'success');
    }

    setTransactions(updated);
    saveTransactions(updated);

    // Auto-sync if configured
    triggerAutoSync();
  };

  const handleDeleteTransaction = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Hapus Transaksi?",
      message: "Transaksi ini akan dihapus permanen dari buku kas Anda.",
      isDestructive: true,
      onConfirm: () => {
        const updated = transactions.filter(t => t.id !== id);
        setTransactions(updated);
        saveTransactions(updated);
        showToast("Transaksi dihapus.", 'info');
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        triggerAutoSync();
      }
    });
  };

  const handleTransfer = (fromId: string, toId: string, amount: number, notes?: string) => {
    const fromAcc = accounts.find(a => a.id === fromId);
    const toAcc = accounts.find(a => a.id === toId);

    const newTx: Transaction = {
      id: `tx_trf_${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      type: 'TRANSFER',
      category: 'Transfer Antar Akun',
      amount,
      accountId: fromId,
      targetAccountId: toId,
      person: persons[0]?.label || '',
      notes: notes || `Transfer dari ${fromAcc?.name} ke ${toAcc?.name}`
    };

    const updated = [newTx, ...transactions];
    setTransactions(updated);
    saveTransactions(updated);
    showToast(`Berhasil transfer ${fromAcc?.name} ke ${toAcc?.name}!`, 'success');
    triggerAutoSync();
  };

  // ==========================================
  // PLANNING HANDLERS
  // ==========================================
  const handleSaveBudget = (b: Budget) => {
    const exists = budgets.find(item => item.id === b.id);
    const updated = exists ? budgets.map(item => item.id === b.id ? b : item) : [...budgets, b];
    setBudgets(updated);
    saveBudgets(updated);
    showToast("Anggaran berhasil disimpan.", 'success');
    triggerAutoSync();
  };

  const handleDeleteBudget = (id: string) => {
    const budget = budgets.find(b => b.id === id);
    setConfirmDialog({
      isOpen: true,
      title: "Hapus Target Anggaran?",
      message: `Batas anggaran untuk kategori "${budget?.category || 'ini'}" akan dihapus.`,
      isDestructive: true,
      onConfirm: () => {
        const updated = budgets.filter(b => b.id !== id);
        setBudgets(updated);
        saveBudgets(updated);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        showToast("Anggaran dihapus.", 'info');
        triggerAutoSync();
      }
    });
  };

  const handleSaveDebt = (d: Debt) => {
    const exists = debts.find(item => item.id === d.id);
    const updated = exists ? debts.map(item => item.id === d.id ? d : item) : [...debts, d];
    setDebts(updated);
    saveDebts(updated);
    showToast("Catatan pinjaman disimpan.", 'success');
    triggerAutoSync();
  };

  const handleDeleteDebt = (id: string) => {
    const debt = debts.find(d => d.id === id);
    setConfirmDialog({
      isOpen: true,
      title: "Hapus Catatan Pinjaman?",
      message: `Catatan hutang/piutang dengan "${debt?.personName || 'pihak ini'}" akan dihapus permanen.`,
      isDestructive: true,
      onConfirm: () => {
        const updated = debts.filter(d => d.id !== id);
        setDebts(updated);
        saveDebts(updated);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        showToast("Catatan pinjaman dihapus.", 'info');
        triggerAutoSync();
      }
    });
  };

  const handlePayDebtInstallment = (debtId: string, payAmount: number, accountId: string) => {
    const debt = debts.find(d => d.id === debtId);
    if (!debt) return;
    const acc = accounts.find(a => a.id === accountId);
    const isHutangSaya = debt.type === 'HUTANG_SAYA';

    setConfirmDialog({
      isOpen: true,
      title: "Konfirmasi Pembayaran Pinjaman",
      type: 'success',
      confirmText: "Ya, Catat Pembayaran",
      cancelText: "Batal",
      message: (
        <div className="space-y-2">
          <p>Apakah Anda yakin ingin mencatat pembayaran pinjaman ini?</p>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Pihak:</span>
              <span className="font-extrabold text-slate-900 dark:text-white">{debt.personName} ({isHutangSaya ? 'Hutang' : 'Piutang'})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Nominal:</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400">Rp {new Intl.NumberFormat('id-ID').format(payAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Rekening:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{acc?.name || 'Kas Utama'}</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Transaksi {isHutangSaya ? 'pengeluaran' : 'pemasukan'} akan otomatis dicatat ke buku kas.
          </p>
        </div>
      ),
      onConfirm: () => {
        const newPaid = (debt.paidAmount || 0) + payAmount;
        const isNowPaid = newPaid >= debt.amount;

        const updatedDebts = debts.map(d => d.id === debtId ? {
          ...d,
          paidAmount: newPaid,
          isPaid: isNowPaid
        } : d);

        setDebts(updatedDebts);
        saveDebts(updatedDebts);

        // Otomatis catat transaksi kas keluar/masuk
        const newTx: Transaction = {
          id: `tx_debt_${Date.now()}`,
          date: new Date().toISOString().slice(0, 10),
          type: isHutangSaya ? 'EXPENSE' : 'INCOME',
          category: isHutangSaya ? 'Cicilan / Bayar Hutang' : 'Penerimaan Piutang',
          amount: payAmount,
          accountId,
          person: persons[0]?.label || '',
          notes: `Pembayaran ${isHutangSaya ? 'hutang ke' : 'piutang dari'} ${debt.personName}`,
          relatedId: debtId
        };

        const updatedTxs = [newTx, ...transactions];
        setTransactions(updatedTxs);
        saveTransactions(updatedTxs);

        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        showToast(isNowPaid ? `Hutang/Piutang dengan ${debt.personName || debt.name} telah LUNAS!` : "Cicilan berhasil dicatat!", 'success');
        triggerAutoSync();
      }
    });
  };

  const handleBatchPayDebts = (payments: { debtId: string; payAmount: number }[], accountId: string) => {
    if (payments.length === 0) return;
    const acc = accounts.find(a => a.id === accountId);
    const totalAmount = payments.reduce((sum, p) => sum + p.payAmount, 0);

    setConfirmDialog({
      isOpen: true,
      title: `Konfirmasi Pembayaran ${payments.length} Pinjaman`,
      type: 'success',
      confirmText: "Ya, Bayar Semua",
      cancelText: "Batal",
      message: (
        <div className="space-y-2">
          <p>Apakah Anda yakin ingin memproses pelunasan/cicilan untuk {payments.length} pinjaman sekaligus?</p>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Jumlah Pinjaman:</span>
              <span className="font-extrabold text-slate-900 dark:text-white">{payments.length} Item</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Pembayaran:</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400">Rp {new Intl.NumberFormat('id-ID').format(totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Sumber Rekening:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{acc?.name || 'Kas Utama'}</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Status pinjaman akan diperbarui dan transaksi kas akan dicatat otomatis.
          </p>
        </div>
      ),
      onConfirm: () => {
        let currentDebts = [...debts];
        const newTransactions: Transaction[] = [];

        payments.forEach(p => {
          const debt = currentDebts.find(d => d.id === p.debtId);
          if (!debt) return;
          const isHutangSaya = debt.type === 'HUTANG_SAYA' || debt.type === 'HUTANG';
          const newPaid = (debt.paidAmount || 0) + p.payAmount;
          const isNowPaid = newPaid >= debt.amount;

          currentDebts = currentDebts.map(d => d.id === p.debtId ? {
            ...d,
            paidAmount: newPaid,
            isPaid: isNowPaid
          } : d);

          newTransactions.push({
            id: `tx_debt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            date: new Date().toISOString().slice(0, 10),
            type: isHutangSaya ? 'EXPENSE' : 'INCOME',
            category: isHutangSaya ? 'Cicilan / Bayar Hutang' : 'Penerimaan Piutang',
            amount: p.payAmount,
            accountId,
            person: persons[0]?.label || '',
            notes: `Pembayaran pinjaman: ${isHutangSaya ? 'hutang ke' : 'piutang dari'} ${debt.personName || debt.name}`,
            relatedId: debt.id
          });
        });

        setDebts(currentDebts);
        saveDebts(currentDebts);

        const updatedTxs = [...newTransactions, ...transactions];
        setTransactions(updatedTxs);
        saveTransactions(updatedTxs);

        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        showToast(`${payments.length} pembayaran pinjaman berhasil dicatat!`, 'success');
        triggerAutoSync();
      }
    });
  };

  const handleSaveGoal = (g: SavingsGoal) => {
    const exists = goals.find(item => item.id === g.id);
    const updated = exists ? goals.map(item => item.id === g.id ? g : item) : [...goals, g];
    setGoals(updated);
    saveGoals(updated);
    showToast("Target tabungan disimpan.", 'success');
    triggerAutoSync();
  };

  const handleDeleteGoal = (id: string) => {
    const goal = goals.find(g => g.id === id);
    setConfirmDialog({
      isOpen: true,
      title: "Hapus Target Tabungan?",
      message: `Target impian "${goal?.name || 'ini'}" akan dihapus dari rencana Anda.`,
      isDestructive: true,
      onConfirm: () => {
        const updated = goals.filter(g => g.id !== id);
        setGoals(updated);
        saveGoals(updated);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        showToast("Target tabungan dihapus.", 'info');
        triggerAutoSync();
      }
    });
  };

  const handleAddGoalDeposit = (goalId: string, amount: number, accountId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const acc = accounts.find(a => a.id === accountId);

    setConfirmDialog({
      isOpen: true,
      title: "Konfirmasi Setor Tabungan",
      type: 'success',
      confirmText: "Ya, Setor Sekarang",
      cancelText: "Batal",
      message: (
        <div className="space-y-2">
          <p>Alokasikan dana ke target impian berikut?</p>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Target Impian:</span>
              <span className="font-extrabold text-slate-900 dark:text-white">{goal.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Nominal Setoran:</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400">Rp {new Intl.NumberFormat('id-ID').format(amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Sumber Rekening:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{acc?.name || 'Kas Utama'}</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Transaksi pengeluaran pos tabungan akan otomatis tercatat ke buku kas.
          </p>
        </div>
      ),
      onConfirm: () => {
        const newCurrent = goal.currentAmount + amount;
        const updatedGoals = goals.map(g => g.id === goalId ? { ...g, currentAmount: newCurrent } : g);
        setGoals(updatedGoals);
        saveGoals(updatedGoals);

        // Otomatis catat transaksi alokasi tabungan
        const newTx: Transaction = {
          id: `tx_goal_${Date.now()}`,
          date: new Date().toISOString().slice(0, 10),
          type: 'EXPENSE',
          category: 'Alokasi Tabungan Impian',
          amount,
          accountId,
          person: persons[0]?.label || '',
          notes: `Setor tabungan impian: ${goal.name}`,
          relatedId: goalId
        };

        const updatedTxs = [newTx, ...transactions];
        setTransactions(updatedTxs);
        saveTransactions(updatedTxs);

        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        showToast(`Setor tabungan Rp ${new Intl.NumberFormat('id-ID').format(amount)} berhasil!`, 'success');
        triggerAutoSync();
      }
    });
  };

  const handleSaveBill = (b: RecurringBill) => {
    const exists = bills.find(item => item.id === b.id);
    const updated = exists ? bills.map(item => item.id === b.id ? b : item) : [...bills, b];
    setBills(updated);
    saveRecurringBills(updated);
    showToast("Tagihan rutin disimpan.", 'success');
    triggerAutoSync();
  };

  const handleDeleteBill = (id: string) => {
    const bill = bills.find(b => b.id === id);
    setConfirmDialog({
      isOpen: true,
      title: "Hapus Tagihan Rutin?",
      message: `Tagihan bulanan "${bill?.name || 'ini'}" akan dihapus dari daftar pengingat.`,
      isDestructive: true,
      onConfirm: () => {
        const updated = bills.filter(b => b.id !== id);
        setBills(updated);
        saveRecurringBills(updated);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        showToast("Tagihan rutin dihapus.", 'info');
        triggerAutoSync();
      }
    });
  };

  const handleToggleBillPaid = (billId: string, monthKey: string, accountId?: string) => {
    const bill = bills.find(b => b.id === billId);
    if (!bill) return;

    const paidList = bill.paidMonths || [];
    const isCurrentlyPaid = paidList.includes(monthKey);
    const targetAccount = accounts.find(a => a.id === accountId) || accounts[0];

    if (isCurrentlyPaid) {
      // Prompt cancel paid status
      setConfirmDialog({
        isOpen: true,
        title: "Batalkan Status Lunas?",
        type: 'warning',
        confirmText: "Ya, Batalkan Lunas",
        cancelText: "Tutup",
        message: (
          <div className="space-y-2">
            <p>
              Status pembayaran tagihan <strong>"{bill.name}"</strong> untuk periode {monthKey} akan diubah kembali menjadi belum dibayar.
            </p>
          </div>
        ),
        onConfirm: () => {
          const nextPaidList = paidList.filter(m => m !== monthKey);
          const updatedBills = bills.map(b => b.id === billId ? { ...b, paidMonths: nextPaidList } : b);
          setBills(updatedBills);
          saveRecurringBills(updatedBills);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          showToast(`Status tagihan ${bill.name} diubah ke belum lunas`, 'info');
          triggerAutoSync();
        }
      });
    } else {
      // Prompt mark paid
      setConfirmDialog({
        isOpen: true,
        title: "Konfirmasi Pembayaran Tagihan",
        type: 'success',
        confirmText: "Ya, Bayar Sekarang",
        cancelText: "Batal",
        message: (
          <div className="space-y-2">
            <p>Apakah Anda ingin menandai dan membayar tagihan ini sekarang?</p>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Tagihan:</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{bill.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nominal:</span>
                <span className="font-black text-rose-600 dark:text-rose-400">Rp {new Intl.NumberFormat('id-ID').format(bill.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kategori:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{bill.category || 'Tagihan & Utilitas'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Rekening Sumber:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{targetAccount?.name || 'Kas Utama'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Periode:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{monthKey}</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Transaksi pengeluaran akan otomatis dicatat ke buku kas dan status ditandai lunas.
            </p>
          </div>
        ),
        onConfirm: () => {
          const nextPaidList = [...paidList, monthKey];
          // Catat transaksi otomatis
          const newTx: Transaction = {
            id: `tx_bill_${Date.now()}`,
            date: new Date().toISOString().slice(0, 10),
            type: 'EXPENSE',
            category: bill.category || 'Tagihan & Utilitas',
            amount: bill.amount,
            accountId: targetAccount?.id || accounts[0]?.id || '',
            person: persons[0]?.label || '',
            notes: `Bayar tagihan rutin: ${bill.name} (${monthKey})`,
            relatedId: billId
          };
          const updatedTxs = [newTx, ...transactions];
          setTransactions(updatedTxs);
          saveTransactions(updatedTxs);

          const updatedBills = bills.map(b => b.id === billId ? { ...b, paidMonths: nextPaidList } : b);
          setBills(updatedBills);
          saveRecurringBills(updatedBills);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          showToast(`Tagihan ${bill.name} lunas & dicatat ke kas!`, 'success');
          triggerAutoSync();
        }
      });
    }
  };

  // ==========================================
  // SETTINGS HANDLERS
  // ==========================================
  const handleToggleHideBalance = () => {
    const next = !appSettings.hideBalance;
    const updated = { ...appSettings, hideBalance: next };
    setAppSettings(updated);
    saveAppSettings(updated);
  };

  const handleToggleDarkMode = () => {
    const next = !appSettings.darkMode;
    const updated = { ...appSettings, darkMode: next };
    setAppSettings(updated);
    saveAppSettings(updated);
  };

  const handleChangeThemeColor = (color: ThemeColor) => {
    const updated = { ...appSettings, themeColor: color };
    setAppSettings(updated);
    saveAppSettings(updated);
    showToast(`Tema warna diubah ke ${color}`, 'success');
  };

  const handleOpenPinSetup = () => {
    setIsPinModalOpen(true);
  };

  const handleRemovePin = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Hapus Kunci PIN?",
      message: "Aplikasi akan dapat dibuka langsung tanpa memasukkan kode PIN keamanan.",
      onConfirm: async () => {
        await setSecurityPin(null);
        setHasPin(false);
        setIsLocked(false);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        showToast("Kunci PIN dihapus.", 'info');
      }
    });
  };

  const handleClearAllData = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Reset Total Data Pabrik?",
      message: "PERINGATAN: Semua riwayat transaksi, rekening, anggaran, dan target impian akan dihapus bersih dari perangkat ini. Tindakan ini tidak dapat dibatalkan!",
      isDestructive: true,
      onConfirm: () => {
        clearAllStorage();
        setHasPin(false);
        setIsLocked(false);
        refreshAllData();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        showToast("Semua data aplikasi telah dibersihkan.", 'info');
      }
    });
  };

  // Overdue count calculation
  const overdueCount = useMemo(() => {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const unpaidBillsCount = bills.filter(b => !(b.paidMonths || []).includes(currentMonthKey)).length;
    const unpaidDebtsCount = debts.filter(d => !d.isPaid).length;
    return unpaidBillsCount + unpaidDebtsCount;
  }, [bills, debts]);

  // If app is PIN locked on start
  if (isLocked && hasPin) {
    return (
      <PinModal
        isOpen={true}
        mode="UNLOCK"
        verifyPin={verifySecurityPin}
        onSuccess={() => setIsLocked(false)}
      />
    );
  }

  return (
    <Layout darkMode={appSettings.darkMode} themeColor={appSettings.themeColor}>
      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        isDestructive={confirmDialog.isDestructive}
        type={confirmDialog.type}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => {
          if (confirmDialog.onCancel) confirmDialog.onCancel();
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }}
      />

      {/* Main Header */}
      <Header
        appName="GriyaKas"
        hideBalance={appSettings.hideBalance}
        onToggleHideBalance={handleToggleHideBalance}
        darkMode={appSettings.darkMode}
        onToggleDarkMode={handleToggleDarkMode}
        cloudSyncConfig={cloudSyncConfig}
        onTriggerSync={handleTriggerManualSync}
        isSyncing={isSyncing}
        onOpenSyncModal={() => setIsCloudSyncModalOpen(true)}
        overdueCount={overdueCount}
        onOpenPlanning={() => setActiveTab('PLANNING')}
        themeColor={appSettings.themeColor}
      />

      {/* Active Tab View */}
      {activeTab === 'DASHBOARD' && (
        <DashboardView
          transactions={transactions}
          accounts={accounts}
          persons={persons}
          budgets={budgets}
          debts={debts}
          goals={goals}
          bills={bills}
          hideBalance={appSettings.hideBalance}
          themeColor={appSettings.themeColor}
          onOpenNewTransaction={(type, person) => {
            setPresetTxType(type || 'EXPENSE');
            setPresetPerson(person);
            setEditingTransaction(null);
            setIsTxModalOpen(true);
          }}
          onOpenTransfer={() => setIsTransferModalOpen(true)}
          onNavigateTab={(tab) => setActiveTab(tab)}
          onViewTransactionDetails={(tx) => {
            setEditingTransaction(tx);
            setIsTxModalOpen(true);
          }}
          onToggleBillPaid={handleToggleBillPaid}
          onPayDebtInstallment={handlePayDebtInstallment}
          onBatchPayDebts={handleBatchPayDebts}
        />
      )}

      {activeTab === 'TRANSACTIONS' && (
        <TransactionsView
          transactions={transactions}
          accounts={accounts}
          persons={persons}
          hideBalance={appSettings.hideBalance}
          themeColor={appSettings.themeColor}
          onEditTransaction={(tx) => {
            setEditingTransaction(tx);
            setIsTxModalOpen(true);
          }}
          onDeleteTransaction={handleDeleteTransaction}
          onViewReceipt={(imgUrl) => setViewingReceiptImage(imgUrl)}
        />
      )}

      {activeTab === 'PLANNING' && (
        <PlanningView
          budgets={budgets}
          debts={debts}
          goals={goals}
          bills={bills}
          transactions={transactions}
          accounts={accounts}
          expenseCategories={expenseCategories}
          hideBalance={appSettings.hideBalance}
          themeColor={appSettings.themeColor}
          onSaveBudget={handleSaveBudget}
          onDeleteBudget={handleDeleteBudget}
          onSaveDebt={handleSaveDebt}
          onDeleteDebt={handleDeleteDebt}
          onPayDebtInstallment={handlePayDebtInstallment}
          onBatchPayDebts={handleBatchPayDebts}
          onSaveGoal={handleSaveGoal}
          onDeleteGoal={handleDeleteGoal}
          onAddGoalDeposit={handleAddGoalDeposit}
          onSaveBill={handleSaveBill}
          onDeleteBill={handleDeleteBill}
          onToggleBillPaid={handleToggleBillPaid}
        />
      )}

      {activeTab === 'ANALYTICS' && (
        <AnalyticsView
          transactions={transactions}
          accounts={accounts}
          persons={persons}
          budgets={budgets}
          debts={debts}
          hideBalance={appSettings.hideBalance}
          themeColor={appSettings.themeColor}
        />
      )}

      {activeTab === 'SETTINGS' && (
        <SettingsView
          cloudSyncConfig={cloudSyncConfig}
          onOpenCloudSyncModal={() => setIsCloudSyncModalOpen(true)}
          onOpenMasterDataModal={() => setIsMasterDataModalOpen(true)}
          themeColor={appSettings.themeColor}
          onChangeThemeColor={handleChangeThemeColor}
          darkMode={appSettings.darkMode}
          onToggleDarkMode={handleToggleDarkMode}
          hideBalance={appSettings.hideBalance}
          onToggleHideBalance={handleToggleHideBalance}
          hasPin={hasPin}
          onOpenPinSetup={handleOpenPinSetup}
          onRemovePin={handleRemovePin}
          transactionsCount={transactions.length}
          onTriggerSync={handleTriggerManualSync}
          isSyncing={isSyncing}
          onDataRestored={refreshAllData}
          onClearAllData={handleClearAllData}
          onShowToast={showToast}
          onDownloadCSV={() => downloadCSVTransactions(transactions)}
        />
      )}

      {/* Bottom Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onOpenNewTransaction={() => {
          setPresetTxType('EXPENSE');
          setPresetPerson(undefined);
          setEditingTransaction(null);
          setIsTxModalOpen(true);
        }}
        themeColor={appSettings.themeColor}
      />

      {/* MODALS */}

      {/* 1. Transaction Form Modal */}
      <TransactionFormModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingTransaction(null);
          setPresetPerson(undefined);
        }}
        onSave={handleSaveTransaction}
        initialData={editingTransaction}
        presetType={presetTxType}
        presetPerson={presetPerson}
        accounts={accounts}
        incomeCategories={incomeCategories}
        expenseCategories={expenseCategories}
        persons={persons}
        goals={goals}
        debts={debts}
        themeColor={appSettings.themeColor}
      />

      {/* 2. Transfer Modal */}
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        accounts={accounts}
        onTransfer={handleTransfer}
        themeColor={appSettings.themeColor}
      />

      {/* 3. Cloud Database Sync Modal */}
      <CloudSyncModal
        isOpen={isCloudSyncModalOpen}
        onClose={() => setIsCloudSyncModalOpen(false)}
        config={cloudSyncConfig}
        onSaveConfig={(cfg) => {
          setCloudSyncConfig(cfg);
          saveCloudSyncConfig(cfg);
        }}
        onDataRestored={refreshAllData}
        onShowToast={showToast}
        themeColor={appSettings.themeColor}
      />

      {/* 4. Master Data Modal */}
      <MasterDataModal
        isOpen={isMasterDataModalOpen}
        onClose={() => setIsMasterDataModalOpen(false)}
        accounts={accounts}
        incomeCategories={incomeCategories}
        expenseCategories={expenseCategories}
        persons={persons}
        onSaveAccounts={(accs) => {
          setAccounts(accs);
          saveAccounts(accs);
          triggerAutoSync();
        }}
        onSaveIncomeCategories={(cats) => {
          setIncomeCategories(cats);
          saveIncomeCategories(cats);
          triggerAutoSync();
        }}
        onSaveExpenseCategories={(cats) => {
          setExpenseCategories(cats);
          saveExpenseCategories(cats);
          triggerAutoSync();
        }}
        onSavePersons={(p) => {
          setPersons(p);
          savePersons(p);
          triggerAutoSync();
        }}
        themeColor={appSettings.themeColor}
      />

      {/* 5. Receipt Photo Viewer Modal */}
      <ReceiptViewerModal
        isOpen={!!viewingReceiptImage}
        imageUrl={viewingReceiptImage}
        onClose={() => setViewingReceiptImage(null)}
      />

      {/* 6. PIN Setup Modal */}
      {isPinModalOpen && (
        <PinModal
          isOpen={isPinModalOpen}
          mode="SETUP"
          onSuccess={async (newPin) => {
            if (newPin) {
              await setSecurityPin(newPin);
              setHasPin(true);
              showToast("PIN Keamanan 4 digit berhasil dipasang!", 'success');
            }
            setIsPinModalOpen(false);
          }}
          onCancel={() => setIsPinModalOpen(false)}
        />
      )}
    </Layout>
  );
};

export default App;

