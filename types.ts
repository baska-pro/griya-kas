export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export type AccountType = 
  | 'Cash' 
  | 'Rekening' 
  | 'E-money' 
  | 'Tabungan' 
  | 'Investasi' 
  | 'Deposito' 
  | 'Kartu Kredit' 
  | 'PayLater' 
  | 'Dana Darurat' 
  | 'Piutang' 
  | 'Aset';

export type PersonType = string;

export type ThemeColor = 'emerald' | 'blue' | 'violet' | 'rose' | 'amber' | 'cyan' | 'slate';

export interface ThemeOption {
  name: string;
  value: ThemeColor;
  class: string;
  accent: string;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  category: string;
  amount: number;
  accountId: string; // Source account ID
  targetAccountId?: string; // For transfers
  person: string; // Person/Member who executed
  notes: string;
  attachmentImage?: string; // Base64 string of receipt
  relatedId?: string; // ID of linked Debt or SavingsGoal
  createdAt?: number;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  icon: string;
  color: string;
  accountNumber?: string;
  holderName?: string;
  initialBalance?: number;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  period?: 'MONTHLY';
}

export interface Debt {
  id: string;
  name?: string;
  personName?: string;
  type: 'HUTANG' | 'PIUTANG' | 'HUTANG_SAYA' | 'PIUTANG_ORANG'; // HUTANG = Utang kita ke orang lain, PIUTANG = Piutang orang lain ke kita
  amount: number;
  paidAmount?: number;
  originalAmount?: number;
  notes?: string;
  isPaid: boolean;
  dueDate?: string;
  contact?: string;
  createdAt?: string;
  person?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  color: string;
  targetDate?: string;
  notes?: string;
}

export interface RecurringBill {
  id: string;
  name: string;
  category: string;
  amount: number;
  dueDay: number; // 1-31
  accountId?: string;
  notes?: string;
  isPaidThisMonth?: boolean;
  paidMonths?: string[]; // Array of 'YYYY-MM' strings
}

export interface CloudSyncConfig {
  googleSheets: {
    enabled: boolean;
    webAppUrl: string;
    autoSync: boolean;
    lastSync?: string;
  };
  supabase: {
    enabled: boolean;
    projectUrl: string;
    anonKey: string;
    autoSync: boolean;
    lastSync?: string;
  };
}

export interface GriyaKasExportData {
  app: 'GriyaKas';
  schemaVersion: 2;
  version: string;
  exportedAt: string;
  transactions: Transaction[];
  accounts: Account[];
  incomeCategories: string[];
  expenseCategories: string[];
  persons: { id: string; label: string }[];
  budgets: Budget[];
  debts: Debt[];
  goals: SavingsGoal[];
  bills: RecurringBill[];
  settings?: {
    themeColor: ThemeColor;
    darkMode: boolean;
    hideBalance: boolean;
  };
}

export type MainTab = 'DASHBOARD' | 'TRANSACTIONS' | 'PLANNING' | 'ANALYTICS' | 'SETTINGS';
export type PlanningTab = 'BUDGET' | 'DEBT' | 'GOAL' | 'BILL' | 'CALCULATOR';
