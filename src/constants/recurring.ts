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

export const recurrenceFrequencies: RecurrenceFrequency[] = [
  'SEMANAL',
  'QUINZENAL',
  'MENSAL',
  'BIMESTRAL',
  'TRIMESTRAL',
  'SEMESTRAL',
  'ANUAL',
];

export const monthlyOccurrences: Record<RecurrenceFrequency, number> = {
  SEMANAL: 4.3452,
  QUINZENAL: 2.1726,
  MENSAL: 1,
  BIMESTRAL: 1 / 2,
  TRIMESTRAL: 1 / 3,
  SEMESTRAL: 1 / 6,
  ANUAL: 1 / 12,
};

export const recurrenceStepDays: Record<RecurrenceFrequency, number> = {
  SEMANAL: 7,
  QUINZENAL: 14,
  MENSAL: 0,
  BIMESTRAL: 0,
  TRIMESTRAL: 0,
  SEMESTRAL: 0,
  ANUAL: 0,
};

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

export const RECURRING_DUE_SOON_DAYS = 7;
