/**
 * Ponto unico de leitura de variaveis de ambiente.
 * Nenhum outro arquivo deve ler `import.meta.env` diretamente.
 */
const parsedDelay = Number(import.meta.env.VITE_MOCK_DELAY);

export const env = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  useMocks: (import.meta.env.VITE_USE_MOCKS ?? 'true') !== 'false',
  mockDelay: Number.isFinite(parsedDelay) ? parsedDelay : 400,
} as const;
