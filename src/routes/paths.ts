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
