import {
  Transaction,
  Account,
  Budget,
  Debt,
  SavingsGoal,
  RecurringBill,
  GriyaKasExportData,
  ThemeColor,
  CloudSyncConfig,
} from "../types";
import {
  DEFAULT_ACCOUNTS,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_PERSONS,
} from "../config";

const VERSION = '2.0.0';
const KEYS = {
  transactions: 'griyakas_transactions_v2',
  accounts: 'griyakas_accounts_v2',
  incomeCategories: 'griyakas_income_cats_v2',
  expenseCategories: 'griyakas_expense_cats_v2',
  persons: 'griyakas_persons_v2',
  budgets: 'griyakas_budgets_v2',
  debts: 'griyakas_debts_v2',
  goals: 'griyakas_goals_v2',
  bills: 'griyakas_recurring_bills_v2',
  settings: 'griyakas_app_settings_v2',
  cloudSync: 'griyakas_cloud_sync_cfg_v2',
  migration: 'griyakas_migration_v1_to_v2_done',
} as const;

const V1_KEYS = {
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

export interface AppSettings {
  themeColor: ThemeColor;
  darkMode: boolean;
  hideBalance: boolean;
  pinLockEnabled: boolean;
}

const DEFAULT_SETTINGS: AppSettings = { themeColor: 'emerald', darkMode: false, hideBalance: false, pinLockEnabled: false };
const DEFAULT_CLOUD: CloudSyncConfig = {
  googleSheets: { enabled: false, webAppUrl: '', autoSync: false },
  supabase: { enabled: false, projectUrl: '', anonKey: '', autoSync: false },
};

const clone = <T>(value: T): T => typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value)) as T;

const safeParse = <T>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
};

const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('GriyaKas: penyimpanan perangkat gagal.', error);
    return false;
  }
};

const copyV1 = (oldKey: string, newKey: string) => {
  if (localStorage.getItem(newKey) !== null) return;
  const raw = localStorage.getItem(oldKey);
  if (raw !== null) localStorage.setItem(newKey, raw);
};

export const migrateV1StorageIfNeeded = () => {
  if (localStorage.getItem(KEYS.migration) === '1') return false;
  let migrated = false;
  const before = Object.values(KEYS).some((key) => localStorage.getItem(key) !== null);

  for (const [field, oldKey] of Object.entries(V1_KEYS)) {
    if (['theme', 'showBalance', 'darkMode'].includes(field)) continue;
    const newKey = KEYS[field as keyof Pick<typeof KEYS, 'transactions'|'accounts'|'incomeCategories'|'expenseCategories'|'persons'|'budgets'|'debts'|'goals'>];
    if (newKey && localStorage.getItem(newKey) === null && localStorage.getItem(oldKey) !== null) {
      copyV1(oldKey, newKey);
      migrated = true;
    }
  }

  if (localStorage.getItem(KEYS.settings) === null) {
    const theme = safeParse<ThemeColor>(localStorage.getItem(V1_KEYS.theme), 'emerald');
    const showBalance = safeParse<boolean>(localStorage.getItem(V1_KEYS.showBalance), true);
    const darkMode = safeParse<boolean>(localStorage.getItem(V1_KEYS.darkMode), false);
    if (localStorage.getItem(V1_KEYS.theme) !== null || localStorage.getItem(V1_KEYS.showBalance) !== null || localStorage.getItem(V1_KEYS.darkMode) !== null) {
      write(KEYS.settings, { ...DEFAULT_SETTINGS, themeColor: theme, hideBalance: !showBalance, darkMode });
      migrated = true;
    }
  }

  localStorage.setItem(KEYS.migration, '1');
  if (migrated) console.info('GriyaKas: data v1 berhasil dimigrasikan ke penyimpanan v2.');
  return migrated || before;
};

migrateV1StorageIfNeeded();

export const formatIDR = (amount: number, hidden = false): string => {
  if (hidden) return 'Rp ••••••••';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number.isFinite(amount) ? amount : 0);
};

export const parseNumber = (input: unknown): number => {
  if (typeof input === 'number') return Number.isFinite(input) ? input : 0;
  const digits = String(input ?? '').replace(/[^0-9]/g, '');
  return Number.parseInt(digits, 10) || 0;
};

export const compressImageToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
  if (!file.type.startsWith('image/')) return reject(new Error('Lampiran harus berupa file gambar.'));
  if (file.size > 12 * 1024 * 1024) return reject(new Error('Ukuran gambar maksimal 12 MB sebelum kompresi.'));
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('Gagal membaca gambar.'));
  reader.onload = (event) => {
    const source = String(event.target?.result || '');
    const image = new Image();
    image.onerror = () => reject(new Error('Format gambar tidak dapat dibaca.'));
    image.onload = () => {
      const ratio = Math.min(1, 1600 / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * ratio));
      canvas.height = Math.max(1, Math.round(image.height * ratio));
      const context = canvas.getContext('2d');
      if (!context) return resolve(source);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.76));
    };
    image.src = source;
  };
  reader.readAsDataURL(file);
});

export const loadTransactions = (): Transaction[] => safeParse(localStorage.getItem(KEYS.transactions), []);
export const saveTransactions = (value: Transaction[]) => write(KEYS.transactions, value);
export const loadAccounts = (): Account[] => safeParse(localStorage.getItem(KEYS.accounts), clone(DEFAULT_ACCOUNTS));
export const saveAccounts = (value: Account[]) => write(KEYS.accounts, value);
export const loadIncomeCategories = (): string[] => safeParse(localStorage.getItem(KEYS.incomeCategories), [...DEFAULT_INCOME_CATEGORIES]);
export const saveIncomeCategories = (value: string[]) => write(KEYS.incomeCategories, value);
export const loadExpenseCategories = (): string[] => safeParse(localStorage.getItem(KEYS.expenseCategories), [...DEFAULT_EXPENSE_CATEGORIES]);
export const saveExpenseCategories = (value: string[]) => write(KEYS.expenseCategories, value);
export const loadPersons = (): {id: string; label: string}[] => safeParse(localStorage.getItem(KEYS.persons), clone(DEFAULT_PERSONS));
export const savePersons = (value: {id: string; label: string}[]) => write(KEYS.persons, value);
const normalizeBudgets = (items: Array<Partial<Budget>>): Budget[] => items
  .filter((item): item is Partial<Budget> & { category: string; limit: number } => typeof item?.category === 'string' && Number.isFinite(Number(item?.limit)))
  .map((item, index) => ({
    id: typeof item.id === 'string' && item.id ? item.id : `budget_${index}_${item.category.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
    category: item.category,
    limit: Number(item.limit),
    period: 'MONTHLY',
  }));
export const loadBudgets = (): Budget[] => normalizeBudgets(safeParse<Array<Partial<Budget>>>(localStorage.getItem(KEYS.budgets), []));
export const saveBudgets = (value: Budget[]) => write(KEYS.budgets, value);
export const loadDebts = (): Debt[] => safeParse(localStorage.getItem(KEYS.debts), []);
export const saveDebts = (value: Debt[]) => write(KEYS.debts, value);
export const loadGoals = (): SavingsGoal[] => safeParse(localStorage.getItem(KEYS.goals), []);
export const saveGoals = (value: SavingsGoal[]) => write(KEYS.goals, value);
export const loadRecurringBills = (): RecurringBill[] => safeParse(localStorage.getItem(KEYS.bills), []);
export const saveRecurringBills = (value: RecurringBill[]) => write(KEYS.bills, value);
export const loadCloudSyncConfig = (): CloudSyncConfig => safeParse(localStorage.getItem(KEYS.cloudSync), clone(DEFAULT_CLOUD));
export const saveCloudSyncConfig = (value: CloudSyncConfig) => write(KEYS.cloudSync, value);
export const loadAppSettings = (): AppSettings => ({ ...DEFAULT_SETTINGS, ...safeParse<Partial<AppSettings>>(localStorage.getItem(KEYS.settings), {}) });
export const saveAppSettings = (value: AppSettings) => write(KEYS.settings, value);

export const getFullAppData = (): GriyaKasExportData => ({
  app: 'GriyaKas', schemaVersion: 2, version: VERSION, exportedAt: new Date().toISOString(),
  transactions: loadTransactions(), accounts: loadAccounts(), incomeCategories: loadIncomeCategories(), expenseCategories: loadExpenseCategories(),
  persons: loadPersons(), budgets: loadBudgets(), debts: loadDebts(), goals: loadGoals(), bills: loadRecurringBills(),
  settings: { themeColor: loadAppSettings().themeColor, darkMode: loadAppSettings().darkMode, hideBalance: loadAppSettings().hideBalance },
});

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

export const normalizeBackupPayload = (input: unknown): GriyaKasExportData | null => {
  if (Array.isArray(input)) {
    return { ...getFullAppData(), transactions: input as Transaction[], exportedAt: new Date().toISOString() };
  }
  if (!isRecord(input)) return null;
  const hasRecognizedData = ['transactions','accounts','budgets','debts','goals','bills'].some((key) => Array.isArray(input[key]));
  if (!hasRecognizedData) return null;
  const base = getFullAppData();
  const settings = isRecord(input.settings) ? input.settings : {};
  return {
    ...base,
    exportedAt: typeof input.exportedAt === 'string' ? input.exportedAt : new Date().toISOString(),
    transactions: Array.isArray(input.transactions) ? input.transactions as Transaction[] : base.transactions,
    accounts: Array.isArray(input.accounts) ? input.accounts as Account[] : base.accounts,
    incomeCategories: Array.isArray(input.incomeCategories) ? input.incomeCategories as string[] : base.incomeCategories,
    expenseCategories: Array.isArray(input.expenseCategories) ? input.expenseCategories as string[] : base.expenseCategories,
    persons: Array.isArray(input.persons) ? input.persons as {id:string;label:string}[] : base.persons,
    budgets: Array.isArray(input.budgets) ? normalizeBudgets(input.budgets as Array<Partial<Budget>>) : base.budgets,
    debts: Array.isArray(input.debts) ? input.debts as Debt[] : base.debts,
    goals: Array.isArray(input.goals) ? input.goals as SavingsGoal[] : base.goals,
    bills: Array.isArray(input.bills) ? input.bills as RecurringBill[] : base.bills,
    settings: {
      themeColor: typeof settings.themeColor === 'string' ? settings.themeColor as ThemeColor : base.settings!.themeColor,
      darkMode: typeof settings.darkMode === 'boolean' ? settings.darkMode : base.settings!.darkMode,
      hideBalance: typeof settings.hideBalance === 'boolean' ? settings.hideBalance : base.settings!.hideBalance,
    },
  };
};

export const restoreFullAppData = (input: unknown): boolean => {
  const data = normalizeBackupPayload(input);
  if (!data) return false;
  const writes = [
    saveTransactions(data.transactions), saveAccounts(data.accounts), saveIncomeCategories(data.incomeCategories), saveExpenseCategories(data.expenseCategories),
    savePersons(data.persons), saveBudgets(data.budgets), saveDebts(data.debts), saveGoals(data.goals), saveRecurringBills(data.bills),
  ];
  if (data.settings) {
    const current = loadAppSettings();
    writes.push(saveAppSettings({ ...current, ...data.settings }));
  }
  return writes.every(Boolean);
};

const downloadText = (filename: string, text: string, type: string) => {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a');
  link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const downloadJSONBackup = () => downloadText(
  `GriyaKas_Backup_v2_${new Date().toISOString().slice(0, 10)}.json`,
  JSON.stringify(getFullAppData(), null, 2), 'application/json;charset=utf-8'
);

const csvEscape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
export const downloadCSVTransactions = (transactions: Transaction[]) => {
  const rows = [
    ['ID','Tanggal','Tipe','Kategori','Akun Sumber','Akun Tujuan','Anggota Keluarga','Nominal (Rp)','Keterangan'],
    ...transactions.map((t) => [t.id,t.date,t.type,t.category,t.accountId,t.targetAccountId || '-',t.person,t.amount,t.notes || '']),
  ];
  downloadText(`GriyaKas_Transaksi_${new Date().toISOString().slice(0,10)}.csv`, '\uFEFF' + rows.map((row) => row.map(csvEscape).join(',')).join('\r\n'), 'text/csv;charset=utf-8');
};

export const clearAllStorage = () => {
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
  Object.values(V1_KEYS).forEach((key) => localStorage.removeItem(key));
  localStorage.removeItem('griyakas_security_pin_v2');
  localStorage.removeItem('griyakas_admin_pin_v1');
};
