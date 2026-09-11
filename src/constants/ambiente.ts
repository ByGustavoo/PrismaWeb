const atrasoInterpretado = Number(import.meta.env.VITE_MOCK_DELAY);

export const ambiente = {
  urlApi: import.meta.env.VITE_API_URL || 'http://localhost:9017/PrismaAPI/v1',
  usarMocks: (import.meta.env.VITE_USE_MOCKS ?? 'true') !== 'false',
  atrasoMocks: Number.isFinite(atrasoInterpretado) ? atrasoInterpretado : 400,
} as const;
