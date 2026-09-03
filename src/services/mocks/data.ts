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
