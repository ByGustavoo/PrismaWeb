export const ambiente = {
  urlApi: import.meta.env.VITE_API_URL || 'http://localhost:9017/PrismaAPI/v1',
} as const;
