const configuracaoExecucao = typeof window === 'undefined' ? undefined : window.__PRISMA_CONFIG__;

export const ambiente = {
  urlApi:
    configuracaoExecucao?.urlApi || import.meta.env.VITE_API_URL || 'http://localhost:9017/PrismaAPI/v1',
  versao: configuracaoExecucao?.versao || null,
  dataLancamento: configuracaoExecucao?.dataLancamento || null,
} as const;
