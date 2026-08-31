import { Transaction, Account, Budget, Debt, SavingsGoal } from "../types";
import { ACCOUNTS, INCOME_CATEGORIES, EXPENSE_CATEGORIES, PERSONS } from "../config";

const KEYS = {
  transactions: 'griyakas_transactions_v1',
  accounts: 'griyakas_master_accounts',
  incomeCategories: 'griyakas_master_income_cats',
  expenseCategories: 'griyakas_master_expense_cats',
  persons: 'griyakas_master_persons',
  budgets: 'griyakas_budgets',
  debts: 'griyakas_debts',
  goals: 'griyakas_goals',
  theme: 'griyakas_theme',
  showBalance: 'griyakas_show_balance',
  darkMode: 'griyakas_dark_mode',
} as const;

// Legacy storage keys are read only to keep data from the original v1 build usable.
const LEGACY_KEYS: Partial<Record<keyof typeof KEYS, string>> = {
  transactions: 'dompetku_transactions_v1',
  accounts: 'dompetku_master_accounts',
  incomeCategories: 'dompetku_master_income_cats',
  expenseCategories: 'dompetku_master_expense_cats',
  persons: 'dompetku_master_persons',
  budgets: 'dompetku_budgets',
  debts: 'dompetku_debts',
  goals: 'dompetku_goals',
  theme: 'dompetku_theme',
  showBalance: 'dompetku_show_balance',
  darkMode: 'dompetku_dark_mode',
};

const safeParse = <T>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn('GriyaKas: data lokal tidak dapat dibaca, menggunakan nilai aman.', error);
    return fallback;
  }
};

const readWithMigration = <T>(key: keyof typeof KEYS, fallback: T): T => {
  const currentKey = KEYS[key];
  const current = localStorage.getItem(currentKey);
  if (current !== null) return safeParse(current, fallback);

  const legacyKey = LEGACY_KEYS[key];
  if (!legacyKey) return fallback;
  const legacy = localStorage.getItem(legacyKey);
  if (legacy === null) return fallback;

  const parsed = safeParse(legacy, fallback);
  try {
    localStorage.setItem(currentKey, JSON.stringify(parsed));
  } catch (error) {
    console.warn('GriyaKas: migrasi data lokal gagal disimpan.', error);
  }
  return parsed;
};

const write = (key: string, data: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('GriyaKas: penyimpanan browser penuh atau tidak tersedia.', error);
    throw new Error('Penyimpanan perangkat penuh. Hapus beberapa foto/transaksi atau buat backup lalu bersihkan data lama.');
  }
};

export const convertFileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
  if (!file.type.startsWith('image/')) {
    reject(new Error('Hanya file gambar yang didukung.'));
    return;
  }

  const reader = new FileReader();
  reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
  reader.onload = event => {
    const source = String(event.target?.result || '');
    const image = new Image();
    image.onerror = () => reject(new Error('Format gambar tidak dapat dibaca.'));
    image.onload = () => {
      const canvas = document.createElement('canvas');
      let width = image.width;
      let height = image.height;
      const maxDimension = 1600;
      const ratio = Math.min(1, maxDimension / Math.max(width, height));
      width = Math.max(1, Math.round(width * ratio));
      height = Math.max(1, Math.round(height * ratio));
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(source);
        return;
      }
      ctx.drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.76));
    };
    image.src = source;
  };
  reader.readAsDataURL(file);
});

export const saveTransactions = (transactions: Transaction[]) => write(KEYS.transactions, transactions);
export const loadTransactions = (): Transaction[] => readWithMigration('transactions', []);

export const saveMasterData = (key: string, data: unknown) => write(key, data);
export const loadMasterAccounts = (): Account[] => readWithMigration('accounts', structuredClone(ACCOUNTS));
export const loadMasterIncomeCats = (): string[] => readWithMigration('incomeCategories', [...INCOME_CATEGORIES]);
export const loadMasterExpenseCats = (): string[] => readWithMigration('expenseCategories', [...EXPENSE_CATEGORIES]);
export const loadMasterPersons = (): {id: string, label: string}[] => readWithMigration('persons', structuredClone(PERSONS));

export const loadBudgets = (): Budget[] => readWithMigration('budgets', []);
export const saveBudgets = (data: Budget[]) => write(KEYS.budgets, data);
export const loadDebts = (): Debt[] => readWithMigration('debts', []);
export const saveDebts = (data: Debt[]) => write(KEYS.debts, data);
export const loadGoals = (): SavingsGoal[] => readWithMigration('goals', []);
export const saveGoals = (data: SavingsGoal[]) => write(KEYS.goals, data);

export interface GriyaKasBackup {
  app: 'GriyaKas';
  schemaVersion: 1;
  exportedAt: string;
  transactions: Transaction[];
  budgets: Budget[];
  debts: Debt[];
  goals: SavingsGoal[];
}

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

export const normalizeBackupPayload = (value: unknown): GriyaKasBackup | null => {
  // Compatibility with the oldest transaction-only export.
  if (Array.isArray(value)) {
    return { app: 'GriyaKas', schemaVersion: 1, exportedAt: new Date().toISOString(), transactions: value as Transaction[], budgets: [], debts: [], goals: [] };
  }
  if (!isObject(value) || !Array.isArray(value.transactions)) return null;
  return {
    app: 'GriyaKas',
    schemaVersion: 1,
    exportedAt: typeof value.exportedAt === 'string' ? value.exportedAt : new Date().toISOString(),
    transactions: value.transactions as Transaction[],
    budgets: Array.isArray(value.budgets) ? value.budgets as Budget[] : [],
    debts: Array.isArray(value.debts) ? value.debts as Debt[] : [],
    goals: Array.isArray(value.goals) ? value.goals as SavingsGoal[] : [],
  };
};

const downloadText = (filename: string, text: string, mime: string) => {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const exportToJSON = (data: { transactions: Transaction[], budgets: Budget[], debts: Debt[], goals: SavingsGoal[] }) => {
  const backup: GriyaKasBackup = { app: 'GriyaKas', schemaVersion: 1, exportedAt: new Date().toISOString(), ...data };
  downloadText(`griyakas_backup_${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(backup, null, 2), 'application/json;charset=utf-8');
};

const csvEscape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;

export const exportToCSV = (transactions: Transaction[]) => {
  const headers = ['ID', 'Tanggal', 'Tipe', 'Kategori', 'Akun Sumber', 'Akun Tujuan', 'Person', 'Nominal', 'Keterangan'];
  const rows = transactions.map(t => [t.id, t.date, t.type, t.category, t.accountId, t.targetAccountId || '-', t.person, t.amount, t.notes || '']);
  const csv = '\uFEFF' + [headers, ...rows].map(row => row.map(csvEscape).join(',')).join('\r\n');
  downloadText(`griyakas_rekap_${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv;charset=utf-8');
};

export const clearGriyaKasData = () => {
  Object.values(KEYS).forEach(key => localStorage.removeItem(key));
  Object.values(LEGACY_KEYS).forEach(key => key && localStorage.removeItem(key));
};
