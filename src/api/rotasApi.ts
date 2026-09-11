export const rotasApi = {
  dashboard: {
    resumo: '/dashboard/resumo',
  },
  lancamentos: {
    listar: '/transactions',
    criar: '/transactions',
    porId: (id: string) => `/transactions/${id}`,
  },
  categorias: {
    listar: '/categories',
  },
  contas: {
    listar: '/accounts',
    criar: '/accounts',
    origens: '/accounts/sources',
    porId: (id: string) => `/accounts/${id}`,
  },
  cartoes: {
    listar: '/cards',
    criar: '/cards',
    porId: (id: string) => `/cards/${id}`,
  },
  faturas: {
    listar: '/invoices',
    porId: (id: string) => `/invoices/${id}`,
  },
  comprasParceladas: {
    listar: '/installments',
    criar: '/installments',
    porId: (id: string) => `/installments/${id}`,
  },
  investimentos: {
    criar: '/investments',
    porId: (id: string) => `/investments/${id}`,
    carteira: '/investments/portfolio',
  },
  orcamentos: {
    criar: '/budgets',
    porId: (id: string) => `/budgets/${id}`,
    visaoGeral: '/budgets/overview',
  },
  despesasRecorrentes: {
    listar: '/recurring-expenses',
    criar: '/recurring-expenses',
    porId: (id: string) => `/recurring-expenses/${id}`,
  },
  metas: {
    listar: '/goals',
    criar: '/goals',
    porId: (id: string) => `/goals/${id}`,
    precos: (id: string) => `/goals/${id}/prices`,
  },
  previsao: {
    resumo: '/forecast',
  },
  relatorios: {
    resumo: '/reports/summary',
  },
  avisos: {
    listar: '/alerts',
  },
} as const;
