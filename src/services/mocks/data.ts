import type {
  Account,
  Category,
  CreditCard,
  Investment,
  Invoice,
  PaymentSource,
  Transaction,
} from '@/types';
import { addDays, monthKeyFromOffset, toISODate } from '@/utils/date';

/* -------------------------------------------------------------------------- */
/* Helpers de data                                                            */
/* -------------------------------------------------------------------------- */

const today = new Date();

/** Data ISO (YYYY-MM-DD) a N dias atras. */
function daysAgo(amount: number): string {
  return toISODate(addDays(today, -amount));
}

export const currentMonth = monthKeyFromOffset(0);

/* -------------------------------------------------------------------------- */
/* Categorias                                                                 */
/* -------------------------------------------------------------------------- */

export const category = {
  moradia: { id: 'cat-moradia', name: 'Moradia', kind: 'expense', colorToken: 1 },
  alimentacao: { id: 'cat-alimentacao', name: 'Alimentação', kind: 'expense', colorToken: 2 },
  transporte: { id: 'cat-transporte', name: 'Transporte', kind: 'expense', colorToken: 3 },
  saude: { id: 'cat-saude', name: 'Saúde', kind: 'expense', colorToken: 4 },
  lazer: { id: 'cat-lazer', name: 'Lazer', kind: 'expense', colorToken: 5 },
  educacao: { id: 'cat-educacao', name: 'Educação', kind: 'expense', colorToken: 6 },
  outrasDespesas: { id: 'cat-outras-despesas', name: 'Outras despesas', kind: 'expense', colorToken: 6 },
  salario: { id: 'cat-salario', name: 'Salário', kind: 'income', colorToken: 2 },
  freelance: { id: 'cat-freelance', name: 'Freelance', kind: 'income', colorToken: 1 },
  rendimentos: { id: 'cat-rendimentos', name: 'Rendimentos', kind: 'income', colorToken: 5 },
  outrasReceitas: { id: 'cat-outras-receitas', name: 'Outras receitas', kind: 'income', colorToken: 4 },
} satisfies Record<string, Category>;

export const categories: Category[] = Object.values(category);

/* -------------------------------------------------------------------------- */
/* Contas, cartoes e faturas                                                  */
/* -------------------------------------------------------------------------- */

export const accounts: Account[] = [
  {
    id: 'acc-1',
    name: 'Conta corrente',
    institution: 'Banco Nova',
    type: 'checking',
    balance: 12480.35,
    includeInTotal: true,
  },
  {
    id: 'acc-2',
    name: 'Reserva de emergência',
    institution: 'Banco Nova',
    type: 'savings',
    balance: 18200,
    includeInTotal: true,
  },
  {
    id: 'acc-3',
    name: 'Carteira',
    institution: 'Dinheiro em espécie',
    type: 'wallet',
    balance: 340,
    includeInTotal: true,
  },
  {
    id: 'acc-4',
    name: 'Corretora',
    institution: 'Meridiano Investimentos',
    type: 'brokerage',
    balance: 2150.9,
    includeInTotal: false,
  },
];

export const creditCards: CreditCard[] = [
  {
    id: 'card-1',
    name: 'Nova Platinum',
    brand: 'Mastercard',
    limit: 12000,
    used: 4380.72,
    closingDay: 28,
    dueDay: 8,
  },
  {
    id: 'card-2',
    name: 'Viagem Gold',
    brand: 'Visa',
    limit: 6000,
    used: 1120.4,
    closingDay: 20,
    dueDay: 1,
  },
];

/**
 * Tudo que pode pagar ou receber um lancamento. Contas e cartoes vivem em
 * cadastros separados, mas o formulario de despesa escolhe entre os dois, entao
 * a lista unificada mora aqui e nao dentro da tela.
 */
export const paymentSources: PaymentSource[] = [
  ...accounts.map((account) => ({ id: account.id, name: account.name, group: 'account' as const })),
  ...creditCards.map((card) => ({ id: card.id, name: card.name, group: 'card' as const })),
];

export const invoices: Invoice[] = [
  {
    id: 'inv-1',
    cardId: 'card-1',
    cardName: 'Nova Platinum',
    month: currentMonth,
    total: 4380.72,
    status: 'open',
    dueDate: daysAgo(-9),
  },
  {
    id: 'inv-2',
    cardId: 'card-2',
    cardName: 'Viagem Gold',
    month: currentMonth,
    total: 1120.4,
    status: 'closed',
    dueDate: daysAgo(-2),
  },
  {
    id: 'inv-3',
    cardId: 'card-1',
    cardName: 'Nova Platinum',
    month: monthKeyFromOffset(-1),
    total: 3915.18,
    status: 'paid',
    dueDate: daysAgo(23),
  },
];

/* -------------------------------------------------------------------------- */
/* Investimentos                                                              */
/* -------------------------------------------------------------------------- */

export const investments: Investment[] = [
  { id: 'inv-cdb', name: 'CDB Liquidez Diária', assetClass: 'fixed-income', invested: 24000, currentValue: 25890.4 },
  { id: 'inv-tesouro', name: 'Tesouro IPCA+ 2029', assetClass: 'fixed-income', invested: 18000, currentValue: 19640.15 },
  { id: 'inv-acoes', name: 'Carteira de ações', assetClass: 'stocks', invested: 21000, currentValue: 23120.8 },
  { id: 'inv-fii', name: 'Fundos imobiliários', assetClass: 'reits', invested: 12000, currentValue: 12480.55 },
  { id: 'inv-cripto', name: 'Cripto', assetClass: 'crypto', invested: 4000, currentValue: 3410.2 },
];

/* -------------------------------------------------------------------------- */
/* Lancamentos                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Semente da lista de lancamentos. O array e mutavel de proposito: enquanto nao
 * houver backend, `transactions.store.ts` cria, edita e remove itens aqui, e as
 * demais telas (dashboard e avisos) leem da mesma fonte.
 */
export const transactions: Transaction[] = [
  {
    id: 'tx-01',
    description: 'Salário',
    amount: 9800,
    kind: 'income',
    status: 'paid',
    method: 'account',
    date: daysAgo(1),
    category: category.salario,
    accountId: 'acc-1',
    accountName: 'Conta corrente',
    notes: 'Crédito mensal da folha.',
  },
  {
    id: 'tx-02',
    description: 'Aluguel',
    amount: 2450,
    kind: 'expense',
    status: 'paid',
    method: 'account',
    date: daysAgo(2),
    category: category.moradia,
    accountId: 'acc-1',
    accountName: 'Conta corrente',
  },
  {
    id: 'tx-03',
    description: 'Mercado do bairro',
    amount: 612.4,
    kind: 'expense',
    status: 'paid',
    method: 'credit-card',
    date: daysAgo(3),
    category: category.alimentacao,
    accountId: 'card-1',
    accountName: 'Nova Platinum',
  },
  {
    id: 'tx-04',
    description: 'Aporte mensal na corretora',
    amount: 2000,
    kind: 'transfer',
    status: 'paid',
    method: 'account',
    date: daysAgo(4),
    category: null,
    accountId: 'acc-1',
    accountName: 'Conta corrente',
    toAccountId: 'acc-4',
    toAccountName: 'Corretora',
  },
  {
    id: 'tx-05',
    description: 'Projeto freelance',
    amount: 3200,
    kind: 'income',
    status: 'paid',
    method: 'pix',
    date: daysAgo(5),
    category: category.freelance,
    accountId: 'acc-1',
    accountName: 'Conta corrente',
  },
  {
    id: 'tx-06',
    description: 'Combustível',
    amount: 289.9,
    kind: 'expense',
    status: 'paid',
    method: 'credit-card',
    date: daysAgo(6),
    category: category.transporte,
    accountId: 'card-1',
    accountName: 'Nova Platinum',
  },
  {
    id: 'tx-07',
    description: 'Plano de saúde',
    amount: 740.3,
    kind: 'expense',
    status: 'paid',
    method: 'account',
    date: daysAgo(7),
    category: category.saude,
    accountId: 'acc-1',
    accountName: 'Conta corrente',
  },
  {
    id: 'tx-08',
    description: 'Jantar com amigos',
    amount: 186.5,
    kind: 'expense',
    status: 'paid',
    method: 'credit-card',
    date: daysAgo(8),
    category: category.lazer,
    accountId: 'card-2',
    accountName: 'Viagem Gold',
  },
  {
    id: 'tx-09',
    description: 'Curso de arquitetura de software',
    amount: 349,
    kind: 'expense',
    status: 'paid',
    method: 'credit-card',
    date: daysAgo(9),
    category: category.educacao,
    accountId: 'card-1',
    accountName: 'Nova Platinum',
  },
  {
    id: 'tx-10',
    description: 'Energia elétrica',
    amount: 318.72,
    kind: 'expense',
    status: 'pending',
    method: 'account',
    date: daysAgo(-3),
    category: category.moradia,
    accountId: 'acc-1',
    accountName: 'Conta corrente',
  },
  {
    id: 'tx-11',
    description: 'Internet fibra',
    amount: 129.9,
    kind: 'expense',
    status: 'scheduled',
    method: 'account',
    date: daysAgo(-6),
    category: category.moradia,
    accountId: 'acc-1',
    accountName: 'Conta corrente',
  },
  {
    id: 'tx-12',
    description: 'Transferência para reserva',
    amount: 1500,
    kind: 'transfer',
    status: 'paid',
    method: 'account',
    date: daysAgo(10),
    category: null,
    accountId: 'acc-1',
    accountName: 'Conta corrente',
    toAccountId: 'acc-2',
    toAccountName: 'Reserva de emergência',
  },
  {
    id: 'tx-13',
    description: 'Aplicativo de transporte',
    amount: 96.4,
    kind: 'expense',
    status: 'paid',
    method: 'credit-card',
    date: daysAgo(11),
    category: category.transporte,
    accountId: 'card-1',
    accountName: 'Nova Platinum',
  },
  {
    id: 'tx-14',
    description: 'Farmácia',
    amount: 142.85,
    kind: 'expense',
    status: 'paid',
    method: 'pix',
    date: daysAgo(12),
    category: category.saude,
    accountId: 'acc-1',
    accountName: 'Conta corrente',
  },
  {
    id: 'tx-15',
    description: 'Streaming e assinaturas',
    amount: 89.7,
    kind: 'expense',
    status: 'paid',
    method: 'credit-card',
    date: daysAgo(13),
    category: category.lazer,
    accountId: 'card-2',
    accountName: 'Viagem Gold',
  },
  {
    id: 'tx-16',
    description: 'Padaria',
    amount: 74.2,
    kind: 'expense',
    status: 'paid',
    method: 'cash',
    date: daysAgo(14),
    category: category.alimentacao,
    accountId: 'acc-3',
    accountName: 'Carteira',
  },
  {
    id: 'tx-17',
    description: 'Dividendos recebidos',
    amount: 412.6,
    kind: 'income',
    status: 'paid',
    method: 'account',
    date: daysAgo(15),
    category: category.rendimentos,
    accountId: 'acc-4',
    accountName: 'Corretora',
  },
  {
    id: 'tx-18',
    description: 'Manutenção do carro',
    amount: 680,
    kind: 'expense',
    status: 'paid',
    method: 'credit-card',
    date: daysAgo(16),
    category: category.transporte,
    accountId: 'card-1',
    accountName: 'Nova Platinum',
  },
  {
    id: 'tx-19',
    description: 'Condomínio',
    amount: 640,
    kind: 'expense',
    status: 'paid',
    method: 'account',
    date: daysAgo(17),
    category: category.moradia,
    accountId: 'acc-1',
    accountName: 'Conta corrente',
  },
  {
    id: 'tx-20',
    description: 'Livraria',
    amount: 158.3,
    kind: 'expense',
    status: 'paid',
    method: 'credit-card',
    date: daysAgo(18),
    category: category.educacao,
    accountId: 'card-1',
    accountName: 'Nova Platinum',
  },
  {
    id: 'tx-21',
    description: 'Restaurante japonês',
    amount: 232.9,
    kind: 'expense',
    status: 'paid',
    method: 'credit-card',
    date: daysAgo(19),
    category: category.alimentacao,
    accountId: 'card-2',
    accountName: 'Viagem Gold',
  },
  {
    id: 'tx-22',
    description: 'Cinema',
    amount: 92,
    kind: 'expense',
    status: 'paid',
    method: 'pix',
    date: daysAgo(20),
    category: category.lazer,
    accountId: 'acc-1',
    accountName: 'Conta corrente',
  },
  {
    id: 'tx-23',
    description: 'Consultoria pontual',
    amount: 1800,
    kind: 'income',
    status: 'paid',
    method: 'pix',
    date: daysAgo(22),
    category: category.freelance,
    accountId: 'acc-1',
    accountName: 'Conta corrente',
  },
  {
    id: 'tx-24',
    description: 'Academia',
    amount: 159.9,
    kind: 'expense',
    status: 'paid',
    method: 'account',
    date: daysAgo(24),
    category: category.saude,
    accountId: 'acc-1',
    accountName: 'Conta corrente',
  },
  {
    id: 'tx-25',
    description: 'Sobra da carteira para a conta',
    amount: 260,
    kind: 'transfer',
    status: 'paid',
    method: 'cash',
    date: daysAgo(21),
    category: null,
    accountId: 'acc-3',
    accountName: 'Carteira',
    toAccountId: 'acc-1',
    toAccountName: 'Conta corrente',
  },
  {
    id: 'tx-26',
    description: 'Aporte programado na reserva',
    amount: 900,
    kind: 'transfer',
    status: 'scheduled',
    method: 'account',
    date: daysAgo(-8),
    category: null,
    accountId: 'acc-1',
    accountName: 'Conta corrente',
    toAccountId: 'acc-2',
    toAccountName: 'Reserva de emergência',
    notes: 'Débito automático no quinto dia útil.',
  },
  {
    id: 'tx-27',
    description: 'Reembolso de despesa de viagem',
    amount: 745.5,
    kind: 'income',
    status: 'pending',
    method: 'pix',
    date: daysAgo(-4),
    category: category.outrasReceitas,
    accountId: 'acc-1',
    accountName: 'Conta corrente',
  },
];

/* -------------------------------------------------------------------------- */
/* Historico dos meses anteriores                                             */
/* -------------------------------------------------------------------------- */

/** Um lancamento do modelo mensal: dia do mes no lugar da data completa. */
type HistoryTemplate = Omit<Transaction, 'id' | 'date' | 'status'> & {
  day: number;
  /** Conta fixa: nao acompanha a variacao do mes. */
  fixed?: boolean;
};

/**
 * Modelo de um mes tipico. O seletor de mes do header precisa de meses com
 * movimento para ter o que mostrar, e escrever seis meses a mao seria
 * repetitivo e dificil de manter. O dia fica em 28 ou menos para a data existir
 * tambem em fevereiro.
 */
const monthlyTemplate: HistoryTemplate[] = [
  {
    day: 1,
    description: 'Padaria da esquina',
    amount: 78.4,
    kind: 'expense',
    method: 'cash',
    category: category.alimentacao,
    accountId: 'acc-3',
    accountName: 'Carteira',
  },
  {
    day: 4,
    description: 'Corrida de aplicativo',
    amount: 96.4,
    kind: 'expense',
    method: 'credit-card',
    category: category.transporte,
    accountId: 'card-1',
    accountName: 'Nova Platinum',
  },
  {
    day: 5,
    description: 'Salário',
    amount: 9800,
    kind: 'income',
    method: 'account',
    category: category.salario,
    accountId: 'acc-1',
    accountName: 'Conta corrente',
    fixed: true,
  },
  {
    day: 10,
    description: 'Aluguel',
    amount: 2450,
    kind: 'expense',
    method: 'account',
    category: category.moradia,
    accountId: 'acc-1',
    accountName: 'Conta corrente',
    fixed: true,
  },
  {
    day: 10,
    description: 'Condomínio',
    amount: 640,
    kind: 'expense',
    method: 'account',
    category: category.moradia,
    accountId: 'acc-1',
    accountName: 'Conta corrente',
    fixed: true,
  },
  {
    day: 12,
    description: 'Energia elétrica',
    amount: 296.4,
    kind: 'expense',
    method: 'account',
    category: category.moradia,
    accountId: 'acc-1',
    accountName: 'Conta corrente',
  },
  {
    day: 12,
    description: 'Internet fibra',
    amount: 129.9,
    kind: 'expense',
    method: 'account',
    category: category.moradia,
    accountId: 'acc-1',
    accountName: 'Conta corrente',
    fixed: true,
  },
  {
    day: 14,
    description: 'Plano de saúde',
    amount: 740.3,
    kind: 'expense',
    method: 'account',
    category: category.saude,
    accountId: 'acc-1',
    accountName: 'Conta corrente',
    fixed: true,
  },
  {
    day: 2,
    description: 'Compras do mês',
    amount: 728.9,
    kind: 'expense',
    method: 'credit-card',
    category: category.alimentacao,
    accountId: 'card-1',
    accountName: 'Nova Platinum',
  },
  {
    day: 19,
    description: 'Supermercado',
    amount: 384.15,
    kind: 'expense',
    method: 'credit-card',
    category: category.alimentacao,
    accountId: 'card-1',
    accountName: 'Nova Platinum',
  },
  {
    day: 3,
    description: 'Combustível',
    amount: 302.5,
    kind: 'expense',
    method: 'credit-card',
    category: category.transporte,
    accountId: 'card-1',
    accountName: 'Nova Platinum',
  },
  {
    day: 16,
    description: 'Assinaturas digitais',
    amount: 89.7,
    kind: 'expense',
    method: 'credit-card',
    category: category.lazer,
    accountId: 'card-2',
    accountName: 'Viagem Gold',
    fixed: true,
  },
  {
    day: 24,
    description: 'Saída com a família',
    amount: 274.6,
    kind: 'expense',
    method: 'credit-card',
    category: category.lazer,
    accountId: 'card-2',
    accountName: 'Viagem Gold',
  },
  {
    day: 26,
    description: 'Academia',
    amount: 159.9,
    kind: 'expense',
    method: 'account',
    category: category.saude,
    accountId: 'acc-1',
    accountName: 'Conta corrente',
    fixed: true,
  },
  {
    day: 18,
    description: 'Dividendos recebidos',
    amount: 396.2,
    kind: 'income',
    method: 'account',
    category: category.rendimentos,
    accountId: 'acc-4',
    accountName: 'Corretora',
  },
  {
    day: 6,
    description: 'Aporte na corretora',
    amount: 2000,
    kind: 'transfer',
    method: 'account',
    category: null,
    accountId: 'acc-1',
    accountName: 'Conta corrente',
    toAccountId: 'acc-4',
    toAccountName: 'Corretora',
    fixed: true,
  },
  {
    day: 8,
    description: 'Aporte na reserva',
    amount: 1500,
    kind: 'transfer',
    method: 'account',
    category: null,
    accountId: 'acc-1',
    accountName: 'Conta corrente',
    toAccountId: 'acc-2',
    toAccountName: 'Reserva de emergência',
    fixed: true,
  },
];

/**
 * Variacao aplicada aos gastos variaveis, do mes atual para tras. E uma lista
 * fixa de proposito: o grafico de fluxo precisa oscilar, mas nao pode mudar a
 * cada recarregamento da pagina. O tamanho define ate onde o historico vai, e
 * precisa cobrir com folga o mes mais antigo que o seletor de periodo oferece:
 * um recorte de mes unico ainda desenha os cinco meses anteriores.
 */
const monthlyVariation = [
  1, 0.96, 1.07, 0.91, 1.12, 0.94, 1.03, 0.89, 1.08, 0.97, 1.05, 0.93,
  1.11, 0.9, 1.02, 0.98, 1.06, 0.92,
];

/** Projeto freelance nao entra todo mes; estes sao os meses em que entrou. */
const freelanceMonths: Record<number, number> = {
  1: 2400,
  3: 3100,
  5: 1750,
  8: 2650,
  11: 1980,
  14: 2300,
  17: 2050,
};

/**
 * Expande o modelo mes a mes para tras. O mes atual para no dia de hoje: um
 * lancamento com data futura marcado como pago seria incoerente, e os itens
 * pendentes e agendados ja vem da lista escrita a mao acima.
 */
function buildHistory(): Transaction[] {
  const result: Transaction[] = [];
  const todayDay = today.getDate();

  for (let offset = 0; offset < monthlyVariation.length; offset += 1) {
    const month = monthKeyFromOffset(-offset);
    const variation = monthlyVariation[offset] ?? 1;

    for (const [index, entry] of monthlyTemplate.entries()) {
      if (offset === 0 && entry.day > todayDay) continue;

      const { day, fixed, ...rest } = entry;
      result.push({
        ...rest,
        id: `tx-h${offset}-${String(index + 1).padStart(2, '0')}`,
        date: `${month}-${String(day).padStart(2, '0')}`,
        status: 'paid',
        amount: fixed ? rest.amount : Math.round(rest.amount * variation * 100) / 100,
      });
    }

    const freelance = freelanceMonths[offset];
    if (freelance && !(offset === 0 && todayDay < 21)) {
      result.push({
        id: `tx-h${offset}-freela`,
        description: 'Projeto freelance',
        amount: freelance,
        kind: 'income',
        status: 'paid',
        method: 'pix',
        date: `${month}-21`,
        category: category.freelance,
        accountId: 'acc-1',
        accountName: 'Conta corrente',
      });
    }
  }

  return result;
}

// O historico entra depois da lista escrita a mao para nao atrapalhar a leitura
// dela. O array e o mesmo que `transactions.store.ts` muta.
transactions.push(...buildHistory());
