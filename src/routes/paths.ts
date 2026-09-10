export const paths = {
  dashboard: '/dashboard',

  transactions: '/lancamentos',
  income: '/lancamentos/receitas',
  expenses: '/lancamentos/despesas',
  transfers: '/lancamentos/transferencias',

  accounts: '/contas',
  cards: '/cartoes',
  invoices: '/faturas',
  installments: '/parcelamentos',

  investments: '/investimentos',

  budget: '/planejamento/orcamento',
  recurring: '/planejamento/recorrentes',
  forecast: '/planejamento/previsao',
  goals: '/planejamento/metas',

  reports: '/relatorios',
  settings: '/configuracoes',
} as const;

export type AppPath = (typeof paths)[keyof typeof paths];

export const NEW_TRANSACTION_PARAM = 'novo';

export const newTransactionValues = {
  receita: 'RECEITA',
  despesa: 'DESPESA',
  transferencia: 'TRANSFERENCIA',
} as const;

export const SEARCH_PARAM = 'busca';
export const CATEGORY_PARAM = 'categoria';
export const ACCOUNT_PARAM = 'conta';
export const EDIT_TRANSACTION_PARAM = 'editar';

export const CARD_PARAM = 'cartao';
