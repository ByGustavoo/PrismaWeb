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
    byId: (id: string) => `/transactions/${id}`,
  },
  accounts: {
    list: '/accounts',
    byId: (id: string) => `/accounts/${id}`,
  },
  cards: {
    list: '/cards',
    invoices: '/cards/invoices',
  },
  investments: {
    list: '/investments',
  },
} as const;
