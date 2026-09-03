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
  },
  alerts: {
    list: '/alerts',
  },
} as const;
