import type { BadgeTone } from '@/components/ui';
import type { GoalInsight, GoalStatus, Option } from '@/types';

export const goalStatusLabel: Record<GoalStatus, string> = {
  ACOMPANHANDO: 'Em acompanhamento',
  COMPRADA: 'Comprado',
  CANCELADA: 'Cancelado',
};

export const goalStatuses: GoalStatus[] = ['ACOMPANHANDO', 'COMPRADA', 'CANCELADA'];

export const goalStatusTone: Record<GoalStatus, BadgeTone> = {
  ACOMPANHANDO: 'accent',
  COMPRADA: 'positive',
  CANCELADA: 'neutral',
};

export const goalStatusOptions: Option[] = goalStatuses.map((status) => ({
  value: status,
  label: goalStatusLabel[status],
}));

export const goalStatusToast: Record<GoalStatus, string> = {
  ACOMPANHANDO: 'Meta de volta em acompanhamento',
  COMPRADA: 'Meta marcada como comprada',
  CANCELADA: 'Meta cancelada',
};

export const goalInsightText: Record<GoalInsight, string> = {
  PRIMEIRO:
    'Só há um preço registrado. Consulte o produto de novo em alguns dias para ter com o que comparar.',
  MENOR: 'É o menor preço já registrado. Se a compra estava no plano, este é o melhor momento até agora.',
  ABAIXO_DA_MEDIA: 'O preço atual está abaixo da média registrada.',
  ACIMA_DA_MEDIA: 'O preço atual está acima da média registrada.',
  MAIOR: 'O preço atual está próximo do maior valor já registrado. Vale esperar mais uma consulta.',
  ESTAVEL: 'O preço não se moveu desde o primeiro registro.',
};

export const GOAL_EXTREME_TOLERANCE = 0.05;

export const GOAL_STABLE_THRESHOLD = 0.005;
