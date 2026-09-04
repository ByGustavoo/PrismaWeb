import type { Delta, ID } from './common';

export type TransactionKind = 'income' | 'expense' | 'transfer';

export type TransactionStatus = 'paid' | 'pending' | 'scheduled';

export type PaymentMethod = 'account' | 'credit-card' | 'pix' | 'cash';

/** Receita e despesa nao compartilham categoria: cada formulario oferece so as do seu lado. */
export type CategoryKind = 'income' | 'expense';

export interface Category {
  id: ID;
  name: string;
  kind: CategoryKind;
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
  /** Transferencia so move dinheiro entre contas proprias, entao nao tem categoria. */
  category: Category | null;
  /** Conta ou cartao de origem do dinheiro. */
  accountId: ID;
  accountName: string;
  /** Conta de destino; presente apenas em transferencias. */
  toAccountId?: ID;
  toAccountName?: string;
  notes?: string;
}

/**
 * Corpo enviado ao criar ou editar um lancamento. O cliente manda ids: quem
 * resolve nome de conta e de categoria e o servidor (hoje, a camada de mock).
 */
export interface TransactionPayload {
  description: string;
  amount: number;
  kind: TransactionKind;
  status: TransactionStatus;
  method: PaymentMethod;
  date: string;
  categoryId?: ID;
  accountId: ID;
  toAccountId?: ID;
  notes?: string;
}

/** Origem de dinheiro escolhivel num lancamento: uma conta propria ou um cartao. */
export interface PaymentSource {
  id: ID;
  name: string;
  group: 'account' | 'card';
}

/* -------------------------------------------------------------------------- */
/* Contas                                                                     */
/* -------------------------------------------------------------------------- */

export type AccountType = 'checking' | 'salary' | 'emergency' | 'other';

/**
 * Conta inativa continua no cadastro e no historico, mas sai do saldo total e
 * deixa de ser oferecida em lancamentos novos. E a alternativa a exclusao para
 * quem encerrou uma conta que ainda tem passado.
 */
export type AccountStatus = 'active' | 'inactive';

export interface Account {
  id: ID;
  name: string;
  institution: string;
  type: AccountType;
  balance: number;
  status: AccountStatus;
  /** Fora do total ficam contas que nao sao dinheiro disponivel, como a corretora. */
  includeInTotal: boolean;
}

export interface AccountPayload {
  name: string;
  institution: string;
  type: AccountType;
  balance: number;
  status: AccountStatus;
  includeInTotal: boolean;
}

/* -------------------------------------------------------------------------- */
/* Cartoes                                                                    */
/* -------------------------------------------------------------------------- */

export type CardType = 'credit' | 'debit' | 'food-voucher' | 'meal-voucher';

export type CardStatus = 'active' | 'inactive';

/**
 * Um cadastro para os quatro tipos de cartao. Os campos especificos sao
 * opcionais porque nenhum tipo usa todos: credito tem limite e datas de fatura,
 * debito aponta para a conta que ele acessa e os vales carregam saldo proprio.
 * O guarda `isCreditCard` (constants/cards.ts) estreita o tipo onde a tela
 * precisa dos campos de credito.
 */
export interface Card {
  id: ID;
  name: string;
  institution: string;
  type: CardType;
  status: CardStatus;
  /** Bandeira impressa no cartao; vales de rede propria nao tem uma. */
  brand?: string;
  /** Quatro ultimos digitos, quando informados. */
  lastDigits?: string;
  /** Credito: limite total contratado. */
  limit?: number;
  /** Credito: limite ja comprometido. Vem calculado do servidor; o cliente nao envia. */
  used?: number;
  /** Credito: dia do mes em que a fatura fecha. */
  closingDay?: number;
  /** Credito: dia do mes em que a fatura vence. */
  dueDay?: number;
  /** Debito: conta de onde o dinheiro sai. */
  accountId?: ID;
  accountName?: string;
  /** Vale-alimentacao e vale-refeicao: saldo disponivel no cartao. */
  balance?: number;
}

export interface CardPayload {
  name: string;
  institution: string;
  type: CardType;
  status: CardStatus;
  brand?: string;
  lastDigits?: string;
  limit?: number;
  closingDay?: number;
  dueDay?: number;
  accountId?: ID;
  balance?: number;
}

/* -------------------------------------------------------------------------- */
/* Faturas                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * `future` e a fatura de um ciclo que ainda nem comecou: ela existe porque as
 * parcelas ja estao comprometidas. `open` e o ciclo em andamento, que continua
 * aceitando compras.
 */
export type InvoiceStatus = 'future' | 'open' | 'closed' | 'paid' | 'overdue';

export interface Invoice {
  id: ID;
  cardId: ID;
  cardName: string;
  /** Mes de referencia YYYY-MM. */
  month: string;
  total: number;
  status: InvoiceStatus;
  /** Data ISO em que o ciclo fecha. */
  closingDate: string;
  /** Data ISO de vencimento. */
  dueDate: string;
  itemCount: number;
}

export interface InvoiceItem {
  id: ID;
  description: string;
  date: string;
  amount: number;
  category: Category | null;
  /** Presente quando o item e uma parcela de uma compra parcelada. */
  installment?: {
    number: number;
    total: number;
    purchaseId: ID;
  };
}

export interface InvoiceDetail extends Invoice {
  items: InvoiceItem[];
}

/* -------------------------------------------------------------------------- */
/* Compras parceladas                                                         */
/* -------------------------------------------------------------------------- */

export type InstallmentStatus = 'paid' | 'current' | 'upcoming';

export interface Installment {
  /** Comeca em 1. */
  number: number;
  /** Mes da fatura em que a parcela cai, YYYY-MM. */
  month: string;
  /** Vencimento da fatura correspondente, data ISO. */
  dueDate: string;
  amount: number;
  status: InstallmentStatus;
}

export interface InstallmentPurchase {
  id: ID;
  description: string;
  /** Valor total da compra, nao o da parcela. */
  totalAmount: number;
  /** Quantidade de parcelas. */
  count: number;
  purchaseDate: string;
  /** Mes da primeira parcela, YYYY-MM. */
  firstMonth: string;
  cardId: ID;
  cardName: string;
  category: Category | null;
  notes?: string;
}

/** Visao calculada de uma compra parcelada: e o que a tela precisa mostrar. */
export interface InstallmentPlan {
  purchase: InstallmentPurchase;
  /** Valor de cada parcela; a ultima absorve o arredondamento e pode diferir. */
  installmentAmount: number;
  paidCount: number;
  remainingCount: number;
  paidAmount: number;
  remainingAmount: number;
  /** Parcela em curso; ausente quando a compra ja foi quitada. */
  current: Installment | null;
  schedule: Installment[];
}

export interface InstallmentPayload {
  description: string;
  totalAmount: number;
  count: number;
  purchaseDate: string;
  firstMonth: string;
  cardId: ID;
  categoryId?: ID;
  notes?: string;
}

/* -------------------------------------------------------------------------- */
/* Investimentos                                                              */
/* -------------------------------------------------------------------------- */

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

/**
 * Despesas somadas de um dia do periodo. O dia sem gasto vem com zero, e nao
 * ausente: o calendario precisa desenhar a casa vazia, e uma sequencia de dias
 * sem gasto e informacao — nao um buraco na serie.
 */
export interface DailySpending {
  /** Data ISO (YYYY-MM-DD). */
  date: string;
  amount: number;
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
  /** Primeiro mes do periodo, YYYY-MM. */
  from: string;
  /** Ultimo mes do periodo, YYYY-MM. Igual a `from` quando o recorte e um mes so. */
  to: string;
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
  /** Todos os dias da janela dos graficos, do primeiro ao ultimo, em ordem. */
  dailySpending: DailySpending[];
  spendingByCategory: CategorySpending[];
  recentTransactions: Transaction[];
}
