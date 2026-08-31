
export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export type AccountType = 'Cash' | 'Rekening' | 'E-money' | 'Tabungan' | 'Investasi' | 'Deposito' | 'Kartu Kredit' | 'PayLater' | 'Dana Darurat' | 'Piutang' | 'Aset' | 'LAINNYA';

export type PersonType = string;

export type ThemeColor = 'emerald' | 'blue' | 'violet' | 'rose' | 'amber' | 'cyan' | 'slate';

export interface ThemeOption {
  name: string;
  value: ThemeColor;
  class: string;
}

export interface Transaction {
  id: string;
  date: string; // ISO Date string
  type: TransactionType;
  category: string;
  amount: number;
  accountId: string; // Source account
  targetAccountId?: string; // For transfers
  person: PersonType;
  notes: string;
  attachment?: string; // Filename
  attachmentImage?: string; // Base64 string of the image
  relatedId?: string; // ID of linked Debt or SavingsGoal
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  icon: string;
  color: string;
}

export interface FilterState {
  month: number;
  year: number;
  type: TransactionType | 'ALL';
  person: PersonType | 'ALL';
}

export interface Budget {
  category: string;
  limit: number;
}

export interface Debt {
  id: string;
  name: string;
  type: 'HUTANG' | 'PIUTANG';
  amount: number;
  notes: string;
  isPaid: boolean;
  dueDate?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  color: string;
}
