/**
 * Contrato de rotas do backend. Nenhuma URL deve ser escrita fora deste arquivo.
 * Os caminhos sao relativos a VITE_API_URL.
 */
export const endpoints = {
  dashboard: {
    summary: '/dashboard/summary',
  },
  transactions: {
    list: '/transactions',
    create: '/transactions',
    byId: (id: string) => `/transactions/${id}`,
  },
  categories: {
    list: '/categories',
  },
  accounts: {
    list: '/accounts',
    create: '/accounts',
    /** Contas e cartoes juntos, para os seletores de lancamento. */
    sources: '/accounts/sources',
    byId: (id: string) => `/accounts/${id}`,
  },
  cards: {
    list: '/cards',
    create: '/cards',
    byId: (id: string) => `/cards/${id}`,
  },
  invoices: {
    list: '/invoices',
    byId: (id: string) => `/invoices/${id}`,
  },
  installments: {
    list: '/installments',
    create: '/installments',
    byId: (id: string) => `/installments/${id}`,
  },
  investments: {
    list: '/investments',
    create: '/investments',
    byId: (id: string) => `/investments/${id}`,
    /** Carteira consolidada: totais, distribuicao e evolucao do patrimonio. */
    portfolio: '/investments/portfolio',
  },
  budgets: {
    list: '/budgets',
    create: '/budgets',
    byId: (id: string) => `/budgets/${id}`,
    /** Consumo do mes: limites, gasto e o que ficou fora do orcamento. */
    overview: '/budgets/overview',
  },
  recurring: {
    list: '/recurring-expenses',
    create: '/recurring-expenses',
    byId: (id: string) => `/recurring-expenses/${id}`,
  },
  goals: {
    list: '/goals',
    create: '/goals',
    byId: (id: string) => `/goals/${id}`,
    /** Registro de um preco novo; nunca substitui o anterior. */
    prices: (id: string) => `/goals/${id}/prices`,
  },
  forecast: {
    summary: '/forecast',
  },
  reports: {
    summary: '/reports/summary',
  },
  alerts: {
    list: '/alerts',
  },
} as const;
