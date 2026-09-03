/** Todas as rotas da aplicacao em um lugar so. */
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

/**
 * Filtros que a tela de lancamentos aceita ja aplicados pela URL. Sao a ponte
 * entre a busca do header e a listagem: o resultado escolhido vira um link.
 */
export const SEARCH_PARAM = 'busca';
export const CATEGORY_PARAM = 'categoria';
export const ACCOUNT_PARAM = 'conta';
export const EDIT_TRANSACTION_PARAM = 'editar';

/**
 * Cartao escolhido ao chegar em Faturas ou em Compras parceladas vindo da tela
 * de Cartoes: `/faturas?cartao=card-1`. Como os demais, e transitorio — sai da
 * URL assim que a tela o le, para que voltar no historico nao refiltre nada.
 */
export const CARD_PARAM = 'cartao';
