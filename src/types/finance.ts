import type { Delta, ID } from './common';

export type TransactionKind = 'income' | 'expense' | 'transfer';

export type TransactionStatus = 'paid' | 'pending' | 'scheduled';

export type PaymentMethod = 'account' | 'credit-card' | 'pix' | 'cash';

export interface Category {
  id: ID;
  name: string;
  /** Indice do token de cor de grafico (--chart-1 ... --chart-6). */
  colorToken: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface Transaction {
  id: ID;
  description: string;
  /** Valor sempre positivo. A direcao do dinheiro vem de `kind`. */
  amount: number;
  kind: TransactionKind;
  status: TransactionStatus;
  method: PaymentMethod;
  /** Data ISO (YYYY-MM-DD). */
  date: string;
  category: Category;
  accountName: string;
  notes?: string;
}

export type AccountType = 'checking' | 'savings' | 'wallet' | 'brokerage';

export interface Account {
  id: ID;
  name: string;
  institution: string;
  type: AccountType;
  balance: number;
  includeInTotal: boolean;
}

export interface CreditCard {
  id: ID;
  name: string;
  brand: string;
  limit: number;
  used: number;
  closingDay: number;
  dueDay: number;
}

export type InvoiceStatus = 'open' | 'closed' | 'paid' | 'overdue';

export interface Invoice {
  id: ID;
  cardId: ID;
  cardName: string;
  /** Mes de referencia YYYY-MM. */
  month: string;
  total: number;
  status: InvoiceStatus;
  dueDate: string;
}

export type InvestmentClass = 'fixed-income' | 'stocks' | 'funds' | 'crypto' | 'reits';

export interface Investment {
  id: ID;
  name: string;
  assetClass: InvestmentClass;
  invested: number;
  currentValue: number;
}

export interface CategorySpending {
  category: Category;
  amount: number;
  /** Participacao no total de despesas do periodo (0 a 1). */
  share: number;
}

export interface CashflowPoint {
  /** Rotulo curto do mes: "jan", "fev"... */
  label: string;
  income: number;
  expense: number;
}

export interface BalancePoint {
  label: string;
  balance: number;
}

export type AlertKind = 'invoice-due' | 'bill-due' | 'scheduled' | 'card-limit';

export type AlertSeverity = 'critical' | 'attention' | 'info';

export interface Alert {
  id: ID;
  kind: AlertKind;
  severity: AlertSeverity;
  title: string;
  description: string;
  /** Data ISO (YYYY-MM-DD) a que o aviso se refere. */
  date: string;
  /** Valor envolvido, quando o aviso tiver um. */
  amount?: number;
  /** Rota que responde ao aviso. */
  to?: string;
}

export interface DashboardSummary {
  month: string;
  currentBalance: number;
  balanceDelta: Delta;
  monthIncome: number;
  incomeDelta: Delta;
  monthExpense: number;
  expenseDelta: Delta;
  investmentsTotal: number;
  investmentsDelta: Delta;
  currentInvoice: {
    total: number;
    cardName: string;
    dueDate: string;
    status: InvoiceStatus;
  };
  balanceHistory: BalancePoint[];
  cashflow: CashflowPoint[];
  spendingByCategory: CategorySpending[];
  recentTransactions: Transaction[];
}
