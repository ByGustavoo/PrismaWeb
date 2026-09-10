import type { ID, Tendencia, Variacao } from './common';

export type TipoLancamento = 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA';

export type SituacaoLancamento = 'PAGO' | 'PENDENTE' | 'AGENDADO';

export type FormaPagamento = 'CONTA' | 'CARTAO_CREDITO' | 'PIX' | 'DINHEIRO';

export type TipoCategoria = 'RECEITA' | 'DESPESA';

export interface Categoria {
  id: ID;
  nome: string;
  tipo: TipoCategoria;
  tokenCor: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface Lancamento {
  id: ID;
  descricao: string;
  valor: number;
  tipo: TipoLancamento;
  situacao: SituacaoLancamento;
  forma: FormaPagamento;
  data: string;
  categoria: Categoria | null;
  idOrigem: ID;
  nomeOrigem: string;
  idContaDestino?: ID;
  nomeContaDestino?: string;
  observacoes?: string;
}

export interface LancamentoPayload {
  descricao: string;
  valor: number;
  tipo: TipoLancamento;
  situacao: SituacaoLancamento;
  forma: FormaPagamento;
  data: string;
  idCategoria?: ID;
  idOrigem: ID;
  idContaDestino?: ID;
  observacoes?: string;
}

export interface PaymentSource {
  id: ID;
  name: string;
  group: 'CONTA' | 'CARTAO';
}

export type AccountType = 'CORRENTE' | 'SALARIO' | 'EMERGENCIA' | 'OUTRA';

export type AccountStatus = 'ATIVO' | 'INATIVO';

export interface Account {
  id: ID;
  name: string;
  institution: string;
  type: AccountType;
  balance: number;
  status: AccountStatus;
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

export type CardType = 'CREDITO' | 'DEBITO' | 'VALE_ALIMENTACAO' | 'VALE_REFEICAO';

export type CardStatus = 'ATIVO' | 'INATIVO';

export interface Card {
  id: ID;
  name: string;
  institution: string;
  type: CardType;
  status: CardStatus;
  brand?: string;
  lastDigits?: string;
  limit?: number;
  used?: number;
  closingDay?: number;
  dueDay?: number;
  accountId?: ID;
  accountName?: string;
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

export type SituacaoFatura = 'FUTURA' | 'ABERTA' | 'FECHADA' | 'PAGA' | 'VENCIDA';

export interface Invoice {
  id: ID;
  cardId: ID;
  cardName: string;
  month: string;
  total: number;
  status: SituacaoFatura;
  closingDate: string;
  dueDate: string;
  itemCount: number;
  previousTotal?: number;
}

export interface InvoiceItem {
  id: ID;
  description: string;
  date: string;
  amount: number;
  category: Categoria | null;
  installment?: {
    number: number;
    total: number;
    purchaseId: ID;
  };
}

export interface InvoiceDetail extends Invoice {
  items: InvoiceItem[];
}

export type InstallmentStatus = 'PAGA' | 'ATUAL' | 'FUTURA';

export interface Installment {
  number: number;
  month: string;
  dueDate: string;
  amount: number;
  status: InstallmentStatus;
}

export interface InstallmentPurchase {
  id: ID;
  description: string;
  totalAmount: number;
  count: number;
  purchaseDate: string;
  firstMonth: string;
  cardId: ID;
  cardName: string;
  category: Categoria | null;
  notes?: string;
}

export interface InstallmentPlan {
  purchase: InstallmentPurchase;
  installmentAmount: number;
  paidCount: number;
  remainingCount: number;
  paidAmount: number;
  remainingAmount: number;
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

export type InvestmentClass =
  | 'RENDA_FIXA'
  | 'CDB'
  | 'TESOURO'
  | 'ACOES'
  | 'ETF'
  | 'FUNDOS'
  | 'CRIPTO'
  | 'OUTROS';

export interface Investment {
  id: ID;
  name: string;
  assetClass: InvestmentClass;
  institution: string;
  invested: number;
  currentValue: number;
  startDate: string;
  notes?: string;
}

export interface InvestmentPayload {
  name: string;
  assetClass: InvestmentClass;
  institution: string;
  invested: number;
  currentValue: number;
  startDate: string;
  notes?: string;
}

export interface InvestmentPosition {
  investment: Investment;
  profit: number;
  profitability: number;
  share: number;
}

export interface InvestmentAllocation {
  assetClass: InvestmentClass;
  invested: number;
  currentValue: number;
  profit: number;
  share: number;
  count: number;
}

export interface PortfolioPoint {
  label: string;
  month: string;
  invested: number;
  value: number;
}

export interface PortfolioSummary {
  invested: number;
  currentValue: number;
  profit: number;
  profitability: number;
  valueDelta: Variacao;
  allocation: InvestmentAllocation[];
  history: PortfolioPoint[];
  positions: InvestmentPosition[];
}

export interface GastoPorCategoria {
  categoria: Categoria;
  valor: number;
  participacao: number;
}

export interface PontoFluxo {
  rotulo: string;
  receitas: number;
  despesas: number;
}

export interface PontoSaldo {
  rotulo: string;
  saldo: number;
}

export interface GastoDiario {
  data: string;
  valor: number;
}

export type AlertKind = 'FATURA_VENCENDO' | 'CONTA_VENCENDO' | 'LANCAMENTO_AGENDADO' | 'LIMITE_CARTAO';

export type AlertSeverity = 'CRITICO' | 'ATENCAO' | 'INFO';

export interface Alert {
  id: ID;
  kind: AlertKind;
  severity: AlertSeverity;
  title: string;
  description: string;
  date: string;
  amount?: number;
  to?: string;
}

export interface ResumoDashboard {
  de: string;
  ate: string;
  saldoAtual: number;
  variacaoSaldo: Variacao;
  receitasMes: number;
  variacaoReceitas: Variacao;
  despesasMes: number;
  variacaoDespesas: Variacao;
  totalInvestido: number;
  variacaoInvestimentos: Variacao;
  faturaAtual: {
    total: number;
    nomeCartao: string;
    dataVencimento: string;
    situacao: SituacaoFatura;
  };
  historicoSaldo: PontoSaldo[];
  fluxoCaixa: PontoFluxo[];
  gastoDiario: GastoDiario[];
  gastoPorCategoria: GastoPorCategoria[];
  lancamentosRecentes: Lancamento[];
}

export type BudgetStatus = 'SEGURO' | 'ALERTA' | 'ESTOURADO';

export interface Budget {
  id: ID;
  category: Categoria;
  limit: number;
}

export interface BudgetPayload {
  categoryId: ID;
  limit: number;
}

export interface BudgetUsage {
  budget: Budget;
  spent: number;
  remaining: number;
  ratio: number;
  projected: number;
  status: BudgetStatus;
}

export interface BudgetOverview {
  month: string;
  planned: number;
  spent: number;
  remaining: number;
  ratio: number;
  daysLeft: number;
  daysElapsed: number;
  daysInMonth: number;
  items: BudgetUsage[];
  unplanned: GastoPorCategoria[];
}

export type RecurrenceFrequency =
  | 'SEMANAL'
  | 'QUINZENAL'
  | 'MENSAL'
  | 'BIMESTRAL'
  | 'TRIMESTRAL'
  | 'SEMESTRAL'
  | 'ANUAL';

export type RecurringStatus = 'ATIVO' | 'PAUSADO';

export interface RecurringExpense {
  id: ID;
  description: string;
  amount: number;
  category: Categoria | null;
  frequency: RecurrenceFrequency;
  nextDueDate: string;
  accountId: ID;
  accountName: string;
  status: RecurringStatus;
  notes?: string;
}

export interface RecurringPayload {
  description: string;
  amount: number;
  categoryId?: ID;
  frequency: RecurrenceFrequency;
  nextDueDate: string;
  accountId: ID;
  status: RecurringStatus;
  notes?: string;
}

export interface RecurringSummary {
  items: RecurringExpense[];
  monthlyCost: number;
  yearlyCost: number;
  dueSoon: RecurringExpense[];
}

export interface ForecastMonth {
  month: string;
  label: string;
  income: number;
  recurring: number;
  installments: number;
  variable: number;
  expense: number;
  net: number;
  endingBalance: number;
}

export interface ForecastSummary {
  startingBalance: number;
  months: ForecastMonth[];
  endingBalance: number;
  averageNet: number;
  lowest: { month: string; balance: number };
}

export interface ReportRange {
  from: string;
  to: string;
}

export interface SourceSpending {
  id: ID;
  name: string;
  group: 'CONTA' | 'CARTAO';
  amount: number;
  share: number;
}

export interface NetWorthPoint {
  label: string;
  month: string;
  accounts: number;
  investments: number;
  total: number;
}

export interface ReportSummary {
  from: string;
  to: string;
  income: number;
  expense: number;
  net: number;
  incomeDelta: Variacao;
  expenseDelta: Variacao;
  transactionCount: number;
  expenseByCategory: GastoPorCategoria[];
  incomeByCategory: GastoPorCategoria[];
  cashflow: PontoFluxo[];
  expenseBySource: SourceSpending[];
  balanceHistory: PontoSaldo[];
  netWorth: NetWorthPoint[];
}

export type GoalStatus = 'ACOMPANHANDO' | 'COMPRADA' | 'CANCELADA';

export interface GoalPriceEntry {
  id: ID;
  date: string;
  price: number;
  note?: string;
}

export interface Goal {
  id: ID;
  name: string;
  url?: string;
  imageUrl?: string;
  status: GoalStatus;
  notes?: string;
  createdAt: string;
  history: GoalPriceEntry[];
}

export interface GoalPayload {
  name: string;
  url?: string;
  imageUrl?: string;
  price: number;
  date: string;
  status: GoalStatus;
  notes?: string;
}

export interface GoalUpdatePayload {
  name: string;
  url?: string;
  imageUrl?: string;
  status: GoalStatus;
  notes?: string;
}

export interface GoalPricePayload {
  price: number;
  date: string;
  note?: string;
}

export type GoalInsight = 'PRIMEIRO' | 'MENOR' | 'ABAIXO_DA_MEDIA' | 'ACIMA_DA_MEDIA' | 'MAIOR' | 'ESTAVEL';

export interface GoalAnalysis {
  initialPrice: number;
  currentPrice: number;
  lowestPrice: number;
  highestPrice: number;
  averagePrice: number;
  change: number;
  changePercentage: number;
  trend: Tendencia;
  savings: number;
  lastUpdate: string;
  entryCount: number;
  insight: GoalInsight;
}

export interface GoalTracking {
  goal: Goal;
  analysis: GoalAnalysis;
}

export interface GoalsSummary {
  items: GoalTracking[];
  trackingCount: number;
  purchasedCount: number;
  currentTotal: number;
  initialTotal: number;
  totalChange: number;
  totalSavings: number;
}
