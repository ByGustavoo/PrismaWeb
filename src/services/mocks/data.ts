import type {
  Account,
  Budget,
  Card,
  Category,
  InstallmentPurchase,
  Investment,
  PaymentSource,
  RecurringExpense,
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

/** Dia fixo de um mes deslocado a partir de hoje: ("-2", 12) -> "2026-07-12". */
function dayOfMonth(offset: number, day: number): string {
  return `${monthKeyFromOffset(offset)}-${String(day).padStart(2, '0')}`;
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

/**
 * Cadastro de contas. Os arrays desta secao sao mutaveis de proposito: enquanto
 * nao houver backend, as stores de escrita criam, editam e removem itens aqui, e
 * todas as telas leem da mesma fonte.
 */
export const accounts: Account[] = [
  {
    id: 'acc-1',
    name: 'Conta corrente',
    institution: 'Banco Nova',
    type: 'checking',
    balance: 12480.35,
    status: 'active',
    includeInTotal: true,
  },
  {
    id: 'acc-2',
    name: 'Reserva de emergência',
    institution: 'Banco Nova',
    type: 'emergency',
    balance: 18200,
    status: 'active',
    includeInTotal: true,
  },
  {
    id: 'acc-3',
    name: 'Carteira',
    institution: 'Dinheiro em espécie',
    type: 'other',
    balance: 340,
    status: 'active',
    includeInTotal: true,
  },
  {
    id: 'acc-4',
    name: 'Corretora',
    institution: 'Meridiano Investimentos',
    type: 'other',
    balance: 2150.9,
    status: 'active',
    includeInTotal: false,
  },
  {
    id: 'acc-5',
    name: 'Conta salário',
    institution: 'Banco Horizonte',
    type: 'salary',
    balance: 1840.6,
    status: 'active',
    includeInTotal: true,
  },
  {
    id: 'acc-6',
    name: 'Conta antiga',
    institution: 'Banco Atlas',
    type: 'checking',
    balance: 0,
    status: 'inactive',
    includeInTotal: false,
  },
];

/**
 * Cadastro unico dos quatro tipos de cartao. O limite comprometido (`used`) nao
 * fica aqui: ele sai da soma das faturas em aberto e das parcelas ainda por
 * vencer, calculada em `cards.mock.ts` — guardar o numero a mao deixaria a barra
 * de limite mentindo assim que uma compra parcelada fosse cadastrada.
 */
export const cards: Card[] = [
  {
    id: 'card-1',
    name: 'Nova Platinum',
    institution: 'Banco Nova',
    type: 'credit',
    status: 'active',
    brand: 'Mastercard',
    lastDigits: '4417',
    limit: 20000,
    closingDay: 28,
    dueDay: 8,
  },
  {
    id: 'card-2',
    name: 'Viagem Gold',
    institution: 'Banco Meridiano',
    type: 'credit',
    status: 'active',
    brand: 'Visa',
    lastDigits: '8290',
    limit: 6000,
    closingDay: 20,
    dueDay: 1,
  },
  {
    id: 'card-3',
    name: 'Nova Débito',
    institution: 'Banco Nova',
    type: 'debit',
    status: 'active',
    brand: 'Mastercard',
    lastDigits: '2071',
    accountId: 'acc-1',
    accountName: 'Conta corrente',
  },
  {
    id: 'card-4',
    name: 'Alelo Alimentação',
    institution: 'Alelo',
    type: 'food-voucher',
    status: 'active',
    lastDigits: '1188',
    balance: 642.35,
  },
  {
    id: 'card-5',
    name: 'Ticket Refeição',
    institution: 'Ticket',
    type: 'meal-voucher',
    status: 'active',
    lastDigits: '5530',
    balance: 318.9,
  },
];

/**
 * Tudo que pode pagar ou receber um lancamento. Contas e cartoes vivem em
 * cadastros separados, mas o formulario de despesa escolhe entre os dois, entao
 * a lista unificada nasce aqui e nao dentro da tela.
 *
 * E funcao, e nao array: uma conta cadastrada agora precisa aparecer no proximo
 * lancamento sem recarregar a pagina. O cartao de debito fica de fora porque ele
 * e apenas o meio de acessar a conta — a conta ja esta na lista, e oferecer os
 * dois faria a mesma despesa ter dois lugares possiveis.
 */
export function listPaymentSources(): PaymentSource[] {
  return [
    ...accounts
      .filter((account) => account.status === 'active')
      .map((account) => ({ id: account.id, name: account.name, group: 'account' as const })),
    ...cards
      .filter((card) => card.status === 'active' && card.type !== 'debit')
      .map((card) => ({ id: card.id, name: card.name, group: 'card' as const })),
  ];
}

/**
 * Busca por id sem filtrar por situacao: um lancamento antigo pode apontar para
 * uma conta ja inativa, e edita-lo nao pode falhar por causa disso.
 */
export function findPaymentSource(id: string): PaymentSource | undefined {
  const account = accounts.find((item) => item.id === id);
  if (account) return { id: account.id, name: account.name, group: 'account' };

  const card = cards.find((item) => item.id === id);
  return card ? { id: card.id, name: card.name, group: 'card' } : undefined;
}

/* -------------------------------------------------------------------------- */
/* Compras parceladas                                                         */
/* -------------------------------------------------------------------------- */

/**
 * As parcelas nao sao lancamentos: elas vivem so aqui e entram nas faturas pelo
 * calculo de `cards.mock.ts`. Guardar doze copias de cada compra em
 * `transactions` deixaria a listagem de lancamentos ilegivel e o total do
 * periodo errado, ja que quem sai da conta e a fatura, nao a parcela.
 */
export const installmentPurchases: InstallmentPurchase[] = [
  {
    id: 'ip-1',
    description: 'Notebook',
    totalAmount: 3000,
    count: 10,
    purchaseDate: dayOfMonth(-2, 12),
    firstMonth: monthKeyFromOffset(-2),
    cardId: 'card-1',
    cardName: 'Nova Platinum',
    category: category.outrasDespesas,
    notes: 'Troca do notebook de trabalho.',
  },
  {
    id: 'ip-2',
    description: 'Geladeira',
    totalAmount: 4200,
    count: 12,
    purchaseDate: dayOfMonth(-5, 7),
    firstMonth: monthKeyFromOffset(-5),
    cardId: 'card-1',
    cardName: 'Nova Platinum',
    category: category.moradia,
  },
  {
    id: 'ip-3',
    description: 'Cadeira ergonômica',
    totalAmount: 1440,
    count: 4,
    purchaseDate: dayOfMonth(-5, 22),
    firstMonth: monthKeyFromOffset(-5),
    cardId: 'card-1',
    cardName: 'Nova Platinum',
    category: category.moradia,
  },
  {
    id: 'ip-4',
    description: 'Passagens aéreas',
    totalAmount: 2760,
    count: 6,
    purchaseDate: dayOfMonth(-1, 9),
    firstMonth: monthKeyFromOffset(-1),
    cardId: 'card-2',
    cardName: 'Viagem Gold',
    category: category.lazer,
  },
  {
    id: 'ip-5',
    description: 'Curso de inglês',
    totalAmount: 1800,
    count: 3,
    purchaseDate: dayOfMonth(0, 2),
    firstMonth: currentMonth,
    cardId: 'card-2',
    cardName: 'Viagem Gold',
    category: category.educacao,
  },
];

/* -------------------------------------------------------------------------- */
/* Investimentos                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Carteira de investimentos. Como os demais cadastros desta secao, o array e
 * mutavel: `investments.store.ts` cria, edita e remove posicoes aqui, e a
 * evolucao do patrimonio em `investments.mock.ts` e recalculada a partir dele.
 *
 * `startDate` nao e enfeite: e dela que sai a idade da posicao, e a idade e o
 * que distribui os aportes ao longo do historico. Sem ela, a curva de evolucao
 * teria de supor que tudo entrou no mesmo dia.
 */
export const investments: Investment[] = [
  {
    id: 'inv-1',
    name: 'CDB Liquidez Diária',
    assetClass: 'cdb',
    institution: 'Banco Nova',
    invested: 24000,
    currentValue: 25890.4,
    startDate: dayOfMonth(-22, 10),
    notes: 'Reserva de curto prazo, com resgate em D+0.',
  },
  {
    id: 'inv-2',
    name: 'Tesouro IPCA+ 2029',
    assetClass: 'treasury',
    institution: 'Tesouro Direto',
    invested: 18000,
    currentValue: 19640.15,
    startDate: dayOfMonth(-30, 18),
  },
  {
    id: 'inv-3',
    name: 'LCI prefixada',
    assetClass: 'fixed-income',
    institution: 'Banco Meridiano',
    invested: 9000,
    currentValue: 9584.2,
    startDate: dayOfMonth(-11, 5),
  },
  {
    id: 'inv-4',
    name: 'Carteira de ações',
    assetClass: 'stocks',
    institution: 'Meridiano Investimentos',
    invested: 21000,
    currentValue: 23120.8,
    startDate: dayOfMonth(-26, 3),
  },
  {
    id: 'inv-5',
    name: 'ETF de índice amplo',
    assetClass: 'etf',
    institution: 'Meridiano Investimentos',
    invested: 11000,
    currentValue: 12470.65,
    startDate: dayOfMonth(-16, 12),
  },
  {
    id: 'inv-6',
    name: 'Fundo imobiliário',
    assetClass: 'funds',
    institution: 'Meridiano Investimentos',
    invested: 12000,
    currentValue: 12480.55,
    startDate: dayOfMonth(-19, 8),
  },
  {
    id: 'inv-7',
    name: 'Criptomoedas',
    assetClass: 'crypto',
    institution: 'Bitpar',
    invested: 4000,
    currentValue: 3410.2,
    startDate: dayOfMonth(-14, 21),
    notes: 'Posição pequena, que aceita oscilar.',
  },
  {
    id: 'inv-8',
    name: 'Previdência privada',
    assetClass: 'other',
    institution: 'Seguradora Atlas',
    invested: 7200,
    currentValue: 7845.3,
    startDate: dayOfMonth(-33, 15),
  },
];

/* -------------------------------------------------------------------------- */
/* Orcamento                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Limites mensais por categoria. O orcamento e recorrente e nao tem mes: vale
 * de um mes para o outro ate ser alterado. Guardar uma linha por mes obrigaria
 * quem planeja a redigitar o mesmo numero doze vezes por ano, e deixaria todo
 * mes seguinte comecando sem orcamento nenhum.
 *
 * Educacao e outras despesas ficam de proposito sem limite: e o que faz a tela
 * mostrar o bloco de gasto fora do orcamento, sem o qual a soma dos limites
 * seria lida como o gasto total do mes — e nem todo mundo orca tudo.
 */
export const budgets: Budget[] = [
  { id: 'bud-1', category: category.moradia, limit: 4600 },
  { id: 'bud-2', category: category.alimentacao, limit: 1400 },
  { id: 'bud-3', category: category.transporte, limit: 1900 },
  { id: 'bud-4', category: category.saude, limit: 2400 },
  { id: 'bud-5', category: category.lazer, limit: 1000 },
];

/* -------------------------------------------------------------------------- */
/* Despesas recorrentes                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Proxima ocorrencia do dia `day`: ainda neste mes se ele nao passou, no mes
 * seguinte se ja passou. E o mesmo criterio que o cadastro sugere ao usuario.
 */
function nextDueOn(day: number): string {
  return dayOfMonth(today.getDate() <= day ? 0 : 1, day);
}

/**
 * As recorrentes nao sao lancamentos, e sim o compromisso que os gera. Elas
 * alimentam a previsao dos proximos meses; o lancamento de cada mes continua
 * nascendo em `transactions`, como qualquer outra despesa ja paga.
 */
export const recurringExpenses: RecurringExpense[] = [
  {
    id: 'rec-1',
    description: 'Aluguel',
    amount: 2450,
    category: category.moradia,
    frequency: 'monthly',
    nextDueDate: nextDueOn(5),
    accountId: 'acc-1',
    accountName: 'Conta corrente',
    status: 'active',
  },
  {
    id: 'rec-2',
    description: 'Condomínio',
    amount: 640,
    category: category.moradia,
    frequency: 'monthly',
    nextDueDate: nextDueOn(10),
    accountId: 'acc-1',
    accountName: 'Conta corrente',
    status: 'active',
  },
  {
    id: 'rec-3',
    description: 'Internet fibra',
    amount: 129.9,
    category: category.moradia,
    frequency: 'monthly',
    nextDueDate: nextDueOn(12),
    accountId: 'acc-1',
    accountName: 'Conta corrente',
    status: 'active',
  },
  {
    id: 'rec-4',
    description: 'Plano de saúde',
    amount: 740.3,
    category: category.saude,
    frequency: 'monthly',
    nextDueDate: nextDueOn(14),
    accountId: 'acc-1',
    accountName: 'Conta corrente',
    status: 'active',
    notes: 'Reajuste anual em janeiro.',
  },
  {
    id: 'rec-5',
    description: 'Academia',
    amount: 159.9,
    category: category.saude,
    frequency: 'monthly',
    nextDueDate: nextDueOn(26),
    accountId: 'acc-1',
    accountName: 'Conta corrente',
    status: 'active',
  },
  {
    id: 'rec-6',
    description: 'Streaming e assinaturas',
    amount: 89.7,
    category: category.lazer,
    frequency: 'monthly',
    nextDueDate: nextDueOn(16),
    accountId: 'card-2',
    accountName: 'Viagem Gold',
    status: 'active',
  },
  {
    id: 'rec-7',
    description: 'Seguro do carro',
    amount: 2340,
    category: category.transporte,
    frequency: 'yearly',
    nextDueDate: dayOfMonth(4, 9),
    accountId: 'acc-1',
    accountName: 'Conta corrente',
    status: 'active',
    notes: 'Pago à vista, com desconto.',
  },
  {
    id: 'rec-8',
    description: 'Plano de idiomas',
    amount: 1188,
    category: category.educacao,
    frequency: 'semiannual',
    nextDueDate: dayOfMonth(2, 20),
    accountId: 'card-1',
    accountName: 'Nova Platinum',
    status: 'active',
  },
  {
    id: 'rec-9',
    description: 'Clube esportivo',
    amount: 210,
    category: category.lazer,
    frequency: 'monthly',
    nextDueDate: nextDueOn(22),
    accountId: 'acc-1',
    accountName: 'Conta corrente',
    status: 'paused',
    notes: 'Pausado enquanto a academia estiver ativa.',
  },
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
