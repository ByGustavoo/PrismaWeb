import type { BadgeTone } from '@/components/ui';
import type { GoalInsight, GoalStatus, Option } from '@/types';

export const goalStatusLabel: Record<GoalStatus, string> = {
  ACOMPANHANDO: 'Em acompanhamento',
  COMPRADA: 'Comprado',
  CANCELADA: 'Cancelado',
};

/** Ordem do seletor e dos filtros: a meta viva primeiro, o arquivo depois. */
export const goalStatuses: GoalStatus[] = ['ACOMPANHANDO', 'COMPRADA', 'CANCELADA'];

/**
 * O acento fica no acompanhamento, que e o estado que pede atencao. Comprado
 * usa o verde de conclusao e cancelado o cinza — ele nao e um erro, so saiu da
 * lista.
 */
export const goalStatusTone: Record<GoalStatus, BadgeTone> = {
  ACOMPANHANDO: 'accent',
  COMPRADA: 'positive',
  CANCELADA: 'neutral',
};

export const goalStatusOptions: Option[] = goalStatuses.map((status) => ({
  value: status,
  label: goalStatusLabel[status],
}));

/**
 * Confirmacao de troca de situacao. E um mapa proprio, e nao o rotulo encaixado
 * numa frase: "meta" e feminino e os rotulos sao masculinos, entao montar
 * "Meta marcada como " + rotulo produzia "marcada como comprado".
 */
export const goalStatusToast: Record<GoalStatus, string> = {
  ACOMPANHANDO: 'Meta de volta em acompanhamento',
  COMPRADA: 'Meta marcada como comprada',
  CANCELADA: 'Meta cancelada',
};

/**
 * A frase que acompanha a analise. Ela sai daqui, e nao do service, pela mesma
 * razao de sempre: o `GoalInsight` e conta de servidor e o texto e interface —
 * traduzir a tela nao pode exigir mexer na API.
 */
export const goalInsightText: Record<GoalInsight, string> = {
  PRIMEIRO:
    'Só há um preço registrado. Consulte o produto de novo em alguns dias para ter com o que comparar.',
  MENOR: 'É o menor preço já registrado. Se a compra estava no plano, este é o melhor momento até agora.',
  ABAIXO_DA_MEDIA: 'O preço atual está abaixo da média registrada.',
  ACIMA_DA_MEDIA: 'O preço atual está acima da média registrada.',
  MAIOR: 'O preço atual está próximo do maior valor já registrado. Vale esperar mais uma consulta.',
  ESTAVEL: 'O preço não se moveu desde o primeiro registro.',
};

/**
 * Distancia ate um extremo, em fracao da faixa, para o preco atual ser lido
 * como "no menor" ou "no maior". Sem essa folga, um centavo de diferenca
 * rebaixaria o melhor preco da serie a um "abaixo da media" qualquer.
 */
export const GOAL_EXTREME_TOLERANCE = 0.05;

/**
 * Variacao ate a qual o preco e considerado estavel. Uma oscilacao de meio por
 * cento nao e noticia, e anunciar "subiu" por causa dela transformaria o
 * indicador em ruido.
 */
export const GOAL_STABLE_THRESHOLD = 0.005;
