import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Wallet, 
  Tag, 
  Users, 
  Check, 
  CreditCard, 
  Smartphone, 
  ShieldCheck,
  AlertTriangle 
} from 'lucide-react';
import { Account, ThemeColor } from '../types';
import { parseNumber } from '../services/storageService';
import { ConfirmDialog } from './ConfirmDialog';

interface MasterDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  incomeCategories: string[];
  expenseCategories: string[];
  persons: { id: string; label: string }[];
  onSaveAccounts: (accs: Account[]) => void;
  onSaveIncomeCategories: (cats: string[]) => void;
  onSaveExpenseCategories: (cats: string[]) => void;
  onSavePersons: (persons: { id: string; label: string }[]) => void;
  themeColor: ThemeColor;
}

export const MasterDataModal: React.FC<MasterDataModalProps> = ({
  isOpen,
  onClose,
  accounts,
  incomeCategories,
  expenseCategories,
  persons,
  onSaveAccounts,
  onSaveIncomeCategories,
  onSaveExpenseCategories,
  onSavePersons,
  themeColor
}) => {
  const [activeTab, setActiveTab] = useState<'ACCOUNTS' | 'INCOME_CATS' | 'EXPENSE_CATS' | 'PERSONS'>('ACCOUNTS');

  // Input states for new items
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<Account['type']>('Rekening');
  const [newAccBalance, setNewAccBalance] = useState('');

  const [newIncomeCat, setNewIncomeCat] = useState('');
  const [newExpenseCat, setNewExpenseCat] = useState('');
  const [newPersonName, setNewPersonName] = useState('');

  // Internal confirmation modal state
  const [modalDialog, setModalDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDestructive?: boolean;
    type?: 'confirm' | 'alert' | 'success';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  if (!isOpen) return null;

  // Account Handlers
  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName.trim()) return;

    const colors = ['bg-emerald-600', 'bg-blue-600', 'bg-violet-600', 'bg-rose-600', 'bg-amber-600', 'bg-cyan-600'];
    const randomColor = colors[accounts.length % colors.length];

    const newAcc: Account = {
      id: `acc_${Date.now()}`,
      name: newAccName.trim(),
      type: newAccType,
      initialBalance: parseNumber(newAccBalance),
      icon: newAccType === 'E-money' ? 'Smartphone' : newAccType === 'Cash' ? 'Wallet' : 'CreditCard',
      color: randomColor
    };

    onSaveAccounts([...accounts, newAcc]);
    setNewAccName('');
    setNewAccBalance('');
  };

  const handleDeleteAccount = (id: string) => {
    if (accounts.length <= 1) {
      setModalDialog({
        isOpen: true,
        title: "Perhatian",
        message: "Harus ada minimal 1 akun/rekening aktif dalam sistem.",
        type: 'alert',
        onConfirm: () => setModalDialog(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    const acc = accounts.find(a => a.id === id);
    setModalDialog({
      isOpen: true,
      title: "Hapus Akun / Rekening?",
      message: `Akun "${acc?.name || 'ini'}" akan dihapus dari daftar akun Anda.`,
      isDestructive: true,
      type: 'confirm',
      onConfirm: () => {
        onSaveAccounts(accounts.filter(a => a.id !== id));
        setModalDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Income Category Handlers
  const handleAddIncomeCat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncomeCat.trim()) return;
    if (incomeCategories.includes(newIncomeCat.trim())) {
      setModalDialog({
        isOpen: true,
        title: "Kategori Sudah Ada",
        message: `Kategori "${newIncomeCat.trim()}" sudah terdaftar.`,
        type: 'alert',
        onConfirm: () => setModalDialog(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }
    onSaveIncomeCategories([...incomeCategories, newIncomeCat.trim()]);
    setNewIncomeCat('');
  };

  const handleDeleteIncomeCat = (cat: string) => {
    if (incomeCategories.length <= 1) {
      setModalDialog({
        isOpen: true,
        title: "Perhatian",
        message: "Minimal harus ada 1 kategori pemasukan.",
        type: 'alert',
        onConfirm: () => setModalDialog(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }
    setModalDialog({
      isOpen: true,
      title: "Hapus Kategori Pemasukan?",
      message: `Kategori "${cat}" akan dihapus dari pilihan.`,
      isDestructive: true,
      type: 'confirm',
      onConfirm: () => {
        onSaveIncomeCategories(incomeCategories.filter(c => c !== cat));
        setModalDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Expense Category Handlers
  const handleAddExpenseCat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpenseCat.trim()) return;
    if (expenseCategories.includes(newExpenseCat.trim())) {
      setModalDialog({
        isOpen: true,
        title: "Kategori Sudah Ada",
        message: `Kategori "${newExpenseCat.trim()}" sudah terdaftar.`,
        type: 'alert',
        onConfirm: () => setModalDialog(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }
    onSaveExpenseCategories([...expenseCategories, newExpenseCat.trim()]);
    setNewExpenseCat('');
  };

  const handleDeleteExpenseCat = (cat: string) => {
    if (expenseCategories.length <= 1) {
      setModalDialog({
        isOpen: true,
        title: "Perhatian",
        message: "Minimal harus ada 1 kategori pengeluaran.",
        type: 'alert',
        onConfirm: () => setModalDialog(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }
    setModalDialog({
      isOpen: true,
      title: "Hapus Kategori Pengeluaran?",
      message: `Kategori "${cat}" akan dihapus dari pilihan.`,
      isDestructive: true,
      type: 'confirm',
      onConfirm: () => {
        onSaveExpenseCategories(expenseCategories.filter(c => c !== cat));
        setModalDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Person Handlers
  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPersonName.trim()) return;
    const newP = { id: `p_${Date.now()}`, label: newPersonName.trim() };
    onSavePersons([...persons, newP]);
    setNewPersonName('');
  };

  const handleDeletePerson = (id: string) => {
    if (persons.length <= 1) {
      setModalDialog({
        isOpen: true,
        title: "Perhatian",
        message: "Minimal harus ada 1 nama anggota keluarga.",
        type: 'alert',
        onConfirm: () => setModalDialog(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }
    const person = persons.find(p => p.id === id);
    setModalDialog({
      isOpen: true,
      title: "Hapus Anggota Keluarga?",
      message: `Anggota keluarga "${person?.label || 'ini'}" akan dihapus dari daftar dompet mandiri.`,
      isDestructive: true,
      type: 'confirm',
      onConfirm: () => {
        onSavePersons(persons.filter(p => p.id !== id));
        setModalDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  return (
    <>
      <ConfirmDialog
        isOpen={modalDialog.isOpen}
        title={modalDialog.title}
        message={modalDialog.message}
        isDestructive={modalDialog.isDestructive}
        type={modalDialog.type}
        onConfirm={modalDialog.onConfirm}
        onCancel={() => setModalDialog(prev => ({ ...prev, isOpen: false }))}
      />

      <div className="fixed inset-0 z-[130] flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-900 w-full max-w-lg max-h-[92vh] rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200/80 dark:border-slate-800">
          
          {/* Header */}
          <div className="p-4 px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
            <div>
              <h2 className="font-extrabold text-base text-slate-900 dark:text-white">
                Kelola Master Data
              </h2>
              <p className="text-xs text-slate-400">Atur rekening, kategori, dan anggota keluarga</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
            >
              <X size={18} />
            </button>
          </div>

          {/* Sub Tabs */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-200/60 dark:bg-slate-800 rounded-xl">
              <button
                onClick={() => setActiveTab('ACCOUNTS')}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'ACCOUNTS' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                }`}
              >
                Rekening
              </button>
              <button
                onClick={() => setActiveTab('INCOME_CATS')}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'INCOME_CATS' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                }`}
              >
                Kat. Masuk
              </button>
              <button
                onClick={() => setActiveTab('EXPENSE_CATS')}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'EXPENSE_CATS' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                }`}
              >
                Kat. Keluar
              </button>
              <button
                onClick={() => setActiveTab('PERSONS')}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'PERSONS' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                }`}
              >
                Anggota
              </button>
            </div>
          </div>

          {/* Tab Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            
            {/* TAB 1: ACCOUNTS */}
            {activeTab === 'ACCOUNTS' && (
              <div className="space-y-4">
                {/* Form Add Account */}
                <form onSubmit={handleAddAccount} className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-2.5">
                  <span className="text-xs font-extrabold text-slate-800 dark:text-white block">
                    + Tambah Rekening / Dompet Baru
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newAccName}
                      onChange={(e) => setNewAccName(e.target.value)}
                      placeholder="Nama Akun (misal: BCA, ShopeePay)"
                      className="p-2.5 bg-white dark:bg-slate-900 border rounded-xl text-xs font-bold outline-none"
                    />
                    <select
                      value={newAccType}
                      onChange={(e) => setNewAccType(e.target.value as any)}
                      className="p-2.5 bg-white dark:bg-slate-900 border rounded-xl text-xs font-bold outline-none"
                    >
                      <option value="Rekening">Rekening Bank</option>
                      <option value="Cash">Tunai / Dompet</option>
                      <option value="E-money">E-Wallet / E-Money</option>
                      <option value="Dana Darurat">Dana Darurat / Simpanan</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newAccBalance ? new Intl.NumberFormat('id-ID').format(parseNumber(newAccBalance)) : ''}
                      onChange={(e) => setNewAccBalance(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="Saldo Awal (Rp)"
                      className="flex-1 p-2.5 bg-white dark:bg-slate-900 border rounded-xl text-xs font-bold outline-none"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                    >
                      Tambah
                    </button>
                  </div>
                </form>

                {/* Accounts List */}
                <div className="space-y-2">
                  {accounts.map(acc => (
                    <div
                      key={acc.id}
                      className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl ${acc.color} text-white flex items-center justify-center text-xs font-bold`}>
                          {acc.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">{acc.name}</h4>
                          <span className="text-[10px] text-slate-400">{acc.type}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteAccount(acc.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: INCOME CATEGORIES */}
            {activeTab === 'INCOME_CATS' && (
              <div className="space-y-4">
                <form onSubmit={handleAddIncomeCat} className="flex gap-2">
                  <input
                    type="text"
                    value={newIncomeCat}
                    onChange={(e) => setNewIncomeCat(e.target.value)}
                    placeholder="Nama Kategori Pemasukan Baru"
                    className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs"
                  >
                    Tambah
                  </button>
                </form>

                <div className="flex flex-wrap gap-2">
                  {incomeCategories.map(cat => (
                    <div
                      key={cat}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300"
                    >
                      <span>{cat}</span>
                      <button
                        onClick={() => handleDeleteIncomeCat(cat)}
                        className="text-slate-400 hover:text-rose-500 ml-1"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: EXPENSE CATEGORIES */}
            {activeTab === 'EXPENSE_CATS' && (
              <div className="space-y-4">
                <form onSubmit={handleAddExpenseCat} className="flex gap-2">
                  <input
                    type="text"
                    value={newExpenseCat}
                    onChange={(e) => setNewExpenseCat(e.target.value)}
                    placeholder="Nama Kategori Pengeluaran Baru"
                    className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs"
                  >
                    Tambah
                  </button>
                </form>

                <div className="flex flex-wrap gap-2">
                  {expenseCategories.map(cat => (
                    <div
                      key={cat}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300"
                    >
                      <span>{cat}</span>
                      <button
                        onClick={() => handleDeleteExpenseCat(cat)}
                        className="text-slate-400 hover:text-rose-500 ml-1"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: PERSONS / FAMILY MEMBERS */}
            {activeTab === 'PERSONS' && (
              <div className="space-y-4">
                <form onSubmit={handleAddPerson} className="flex gap-2">
                  <input
                    type="text"
                    value={newPersonName}
                    onChange={(e) => setNewPersonName(e.target.value)}
                    placeholder="Nama Anggota (misal: Kakak, Adik, Nenek)"
                    className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs"
                  >
                    Tambah
                  </button>
                </form>

                <div className="space-y-2">
                  {persons.map(p => (
                    <div
                      key={p.id}
                      className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-xs"
                    >
                      <span className="text-xs font-bold text-slate-800 dark:text-white">{p.label}</span>
                      <button
                        onClick={() => handleDeletePerson(p.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl text-xs shadow-md shadow-emerald-600/30 transition-all active:scale-95"
            >
              Selesai
            </button>
          </div>

        </div>
      </div>
    </>
  );
};

