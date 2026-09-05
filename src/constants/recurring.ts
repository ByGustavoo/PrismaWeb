import type { BadgeTone } from '@/components/ui';
import type { RecurrenceFrequency, RecurringStatus } from '@/types';

export const recurrenceLabel: Record<RecurrenceFrequency, string> = {
  SEMANAL: 'Semanal',
  QUINZENAL: 'Quinzenal',
  MENSAL: 'Mensal',
  BIMESTRAL: 'Bimestral',
  TRIMESTRAL: 'Trimestral',
  SEMESTRAL: 'Semestral',
  ANUAL: 'Anual',
};

/** Ordem do seletor: da recorrencia mais frequente para a mais espacada. */
export const recurrenceFrequencies: RecurrenceFrequency[] = [
  'SEMANAL',
  'QUINZENAL',
  'MENSAL',
  'BIMESTRAL',
  'TRIMESTRAL',
  'SEMESTRAL',
  'ANUAL',
];

/**
 * Quantas vezes cada recorrencia acontece em um mes. E o que permite somar
 * assinatura mensal com seguro anual sem mentir: a anual pesa um doze avos por
 * mes. As semanais usam 4,3452 — a media real de semanas num mes (365,25 / 7 /
 * 12) —, e nao 4, que subestimaria o custo em quase um mes por ano.
 */
export const monthlyOccurrences: Record<RecurrenceFrequency, number> = {
  SEMANAL: 4.3452,
  QUINZENAL: 2.1726,
  MENSAL: 1,
  BIMESTRAL: 1 / 2,
  TRIMESTRAL: 1 / 3,
  SEMESTRAL: 1 / 6,
  ANUAL: 1 / 12,
};

/** Dias entre uma ocorrencia e a seguinte; usado para projetar vencimentos. */
export const recurrenceStepDays: Record<RecurrenceFrequency, number> = {
  SEMANAL: 7,
  QUINZENAL: 14,
  MENSAL: 0,
  BIMESTRAL: 0,
  TRIMESTRAL: 0,
  SEMESTRAL: 0,
  ANUAL: 0,
};

/** Meses entre uma ocorrencia e a seguinte; zero nas recorrencias em dias. */
export const recurrenceStepMonths: Record<RecurrenceFrequency, number> = {
  SEMANAL: 0,
  QUINZENAL: 0,
  MENSAL: 1,
  BIMESTRAL: 2,
  TRIMESTRAL: 3,
  SEMESTRAL: 6,
  ANUAL: 12,
};

export const recurringStatusLabel: Record<RecurringStatus, string> = {
  ATIVO: 'Ativa',
  PAUSADO: 'Pausada',
};

export const recurringStatuses: RecurringStatus[] = ['ATIVO', 'PAUSADO'];

export const recurringStatusTone: Record<RecurringStatus, BadgeTone> = {
  ATIVO: 'positive',
  PAUSADO: 'neutral',
};

/**
 * Janela do aviso de vencimento proximo. Sete dias e o intervalo em que ainda
 * da para agir — mover dinheiro, cancelar uma assinatura — sem que a lista
 * inteira apareca destacada.
 */
export const RECURRING_DUE_SOON_DAYS = 7;
