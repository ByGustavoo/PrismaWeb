export const endpoints = {
  dashboard: {
    resumo: '/dashboard/resumo',
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
    portfolio: '/investments/portfolio',
  },
  budgets: {
    create: '/budgets',
    byId: (id: string) => `/budgets/${id}`,
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
