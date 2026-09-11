export const rotasApi = {
  dashboard: {
    resumo: '/dashboard/resumo',
  },
  lancamentos: {
    listar: '/lancamentos',
    criar: '/lancamentos',
    porId: (id: string) => `/lancamentos/${id}`,
  },
  categorias: {
    listar: '/categorias',
  },
  contas: {
    listar: '/contas',
    criar: '/contas',
    origens: '/contas/origens',
    porId: (id: string) => `/contas/${id}`,
  },
  cartoes: {
    listar: '/cartoes',
    criar: '/cartoes',
    porId: (id: string) => `/cartoes/${id}`,
  },
  faturas: {
    listar: '/faturas',
    porId: (id: string) => `/faturas/${id}`,
  },
  comprasParceladas: {
    listar: '/compras-parceladas',
    criar: '/compras-parceladas',
    porId: (id: string) => `/compras-parceladas/${id}`,
  },
  investimentos: {
    criar: '/investimentos',
    porId: (id: string) => `/investimentos/${id}`,
    carteira: '/investimentos/carteira',
  },
  orcamentos: {
    criar: '/orcamentos',
    porId: (id: string) => `/orcamentos/${id}`,
    visaoGeral: '/orcamentos/visao-geral',
  },
  despesasRecorrentes: {
    listar: '/despesas-recorrentes',
    criar: '/despesas-recorrentes',
    porId: (id: string) => `/despesas-recorrentes/${id}`,
  },
  metas: {
    listar: '/metas',
    criar: '/metas',
    porId: (id: string) => `/metas/${id}`,
    precos: (id: string) => `/metas/${id}/precos`,
  },
  previsao: {
    resumo: '/previsao',
  },
  relatorios: {
    resumo: '/relatorios/resumo',
  },
  avisos: {
    listar: '/avisos',
  },
} as const;
