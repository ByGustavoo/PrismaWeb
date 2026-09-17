import type { VarianteNotificacao } from '@/components/ui';

export const duracaoBaseNotificacao: Record<VarianteNotificacao, number> = {
  success: 5000,
  info: 5000,
  warning: 7000,
  error: 8000,
};

export const CARACTERES_LEITURA_BASE_NOTIFICACAO = 70;
export const MS_POR_CARACTERE_EXTRA_NOTIFICACAO = 45;
export const DURACAO_MAXIMA_NOTIFICACAO_MS = 12000;
export const NOTIFICACOES_VISIVEIS_MAXIMO = 3;
export const DURACAO_SAIDA_NOTIFICACAO_MS = 360;
export const DISTANCIA_DESLIZE_DISPENSA_PX = 72;

export const DESCRICAO_ERRO_PADRAO_NOTIFICACAO = 'Tente de novo em alguns instantes.';
