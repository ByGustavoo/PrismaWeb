import type { TomSelo } from '@/components/ui';
import type { LeituraMeta, Opcao, SituacaoMeta } from '@/types';

export const rotuloSituacaoMeta: Record<SituacaoMeta, string> = {
  ACOMPANHANDO: 'Em acompanhamento',
  COMPRADA: 'Comprado',
  CANCELADA: 'Cancelado',
};

export const situacoesMeta: SituacaoMeta[] = ['ACOMPANHANDO', 'COMPRADA', 'CANCELADA'];

export const tomSituacaoMeta: Record<SituacaoMeta, TomSelo> = {
  ACOMPANHANDO: 'accent',
  COMPRADA: 'positive',
  CANCELADA: 'neutral',
};

export const opcoesSituacaoMeta: Opcao[] = situacoesMeta.map((status) => ({ valor: status, rotulo: rotuloSituacaoMeta[status],
}));

export const notificacaoSituacaoMeta: Record<SituacaoMeta, string> = {
  ACOMPANHANDO: 'Meta de volta em acompanhamento',
  COMPRADA: 'Meta marcada como comprada',
  CANCELADA: 'Meta cancelada',
};

export const textoLeituraMeta: Record<LeituraMeta, string> = {
  PRIMEIRO:
    'Só há um preço registrado. Consulte o produto de novo em alguns dias para ter com o que comparar.',
  MENOR: 'É o menor preço já registrado. Se a compra estava no plano, este é o melhor momento até agora.',
  ABAIXO_DA_MEDIA: 'O preço atual está abaixo da média registrada.',
  ACIMA_DA_MEDIA: 'O preço atual está acima da média registrada.',
  MAIOR: 'O preço atual está próximo do maior valor já registrado. Vale esperar mais uma consulta.',
  ESTAVEL: 'O preço não se moveu desde o primeiro registro.',
};

export const TOLERANCIA_EXTREMOS_META = 0.05;

export const LIMIAR_ESTABILIDADE_META = 0.005;
