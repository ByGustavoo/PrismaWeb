/** Todas as rotas da aplicacao em um lugar so. */
export const paths = {
  dashboard: '/',

  transactions: '/lancamentos',
  income: '/lancamentos/receitas',
  expenses: '/lancamentos/despesas',
  transfers: '/lancamentos/transferencias',

  accounts: '/contas',
  cards: '/cartoes',
  invoices: '/faturas',

  investments: '/investimentos',

  budget: '/planejamento/orcamento',
  recurring: '/planejamento/recorrentes',
  forecast: '/planejamento/previsao',

  reports: '/relatorios',
  settings: '/configuracoes',
} as const;

export type AppPath = (typeof paths)[keyof typeof paths];

/**
 * Query param que abre o formulario de cadastro ja na tela de lancamentos:
 * `/lancamentos?novo=despesa`. Existe para que o botao do header (e qualquer
 * atalho futuro) leve direto ao cadastro, sem estado global entre telas.
 */
export const NEW_TRANSACTION_PARAM = 'novo';

/** Valores aceitos em `?novo=`, na mesma grafia sem acento das rotas. */
export const newTransactionValues = {
  receita: 'income',
  despesa: 'expense',
  transferencia: 'transfer',
} as const;
