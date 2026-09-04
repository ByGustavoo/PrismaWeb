import type { BadgeTone } from '@/components/ui';
import type { RecurrenceFrequency, RecurringStatus } from '@/types';

export const recurrenceLabel: Record<RecurrenceFrequency, string> = {
  weekly: 'Semanal',
  biweekly: 'Quinzenal',
  monthly: 'Mensal',
  bimonthly: 'Bimestral',
  quarterly: 'Trimestral',
  semiannual: 'Semestral',
  yearly: 'Anual',
};

/** Ordem do seletor: da recorrencia mais frequente para a mais espacada. */
export const recurrenceFrequencies: RecurrenceFrequency[] = [
  'weekly',
  'biweekly',
  'monthly',
  'bimonthly',
  'quarterly',
  'semiannual',
  'yearly',
];

/**
 * Quantas vezes cada recorrencia acontece em um mes. E o que permite somar
 * assinatura mensal com seguro anual sem mentir: a anual pesa um doze avos por
 * mes. As semanais usam 4,3452 — a media real de semanas num mes (365,25 / 7 /
 * 12) —, e nao 4, que subestimaria o custo em quase um mes por ano.
 */
export const monthlyOccurrences: Record<RecurrenceFrequency, number> = {
  weekly: 4.3452,
  biweekly: 2.1726,
  monthly: 1,
  bimonthly: 1 / 2,
  quarterly: 1 / 3,
  semiannual: 1 / 6,
  yearly: 1 / 12,
};

/** Dias entre uma ocorrencia e a seguinte; usado para projetar vencimentos. */
export const recurrenceStepDays: Record<RecurrenceFrequency, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 0,
  bimonthly: 0,
  quarterly: 0,
  semiannual: 0,
  yearly: 0,
};

/** Meses entre uma ocorrencia e a seguinte; zero nas recorrencias em dias. */
export const recurrenceStepMonths: Record<RecurrenceFrequency, number> = {
  weekly: 0,
  biweekly: 0,
  monthly: 1,
  bimonthly: 2,
  quarterly: 3,
  semiannual: 6,
  yearly: 12,
};

export const recurringStatusLabel: Record<RecurringStatus, string> = {
  active: 'Ativa',
  paused: 'Pausada',
};

export const recurringStatuses: RecurringStatus[] = ['active', 'paused'];

export const recurringStatusTone: Record<RecurringStatus, BadgeTone> = {
  active: 'positive',
  paused: 'neutral',
};

/**
 * Janela do aviso de vencimento proximo. Sete dias e o intervalo em que ainda
 * da para agir — mover dinheiro, cancelar uma assinatura — sem que a lista
 * inteira apareca destacada.
 */
export const RECURRING_DUE_SOON_DAYS = 7;
