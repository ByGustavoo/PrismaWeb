import type { TomSelo } from '@/components/ui';
import type { Frequencia, SituacaoDespesaRecorrente } from '@/types';

export const rotuloFrequencia: Record<Frequencia, string> = {
  SEMANAL: 'Semanal',
  QUINZENAL: 'Quinzenal',
  MENSAL: 'Mensal',
  BIMESTRAL: 'Bimestral',
  TRIMESTRAL: 'Trimestral',
  SEMESTRAL: 'Semestral',
  ANUAL: 'Anual',
};

export const frequencias: Frequencia[] = [
  'SEMANAL',
  'QUINZENAL',
  'MENSAL',
  'BIMESTRAL',
  'TRIMESTRAL',
  'SEMESTRAL',
  'ANUAL',
];

export const ocorrenciasMensais: Record<Frequencia, number> = {
  SEMANAL: 4.3452,
  QUINZENAL: 2.1726,
  MENSAL: 1,
  BIMESTRAL: 1 / 2,
  TRIMESTRAL: 1 / 3,
  SEMESTRAL: 1 / 6,
  ANUAL: 1 / 12,
};

export const passoFrequenciaDias: Record<Frequencia, number> = {
  SEMANAL: 7,
  QUINZENAL: 14,
  MENSAL: 0,
  BIMESTRAL: 0,
  TRIMESTRAL: 0,
  SEMESTRAL: 0,
  ANUAL: 0,
};

export const passoFrequenciaMeses: Record<Frequencia, number> = {
  SEMANAL: 0,
  QUINZENAL: 0,
  MENSAL: 1,
  BIMESTRAL: 2,
  TRIMESTRAL: 3,
  SEMESTRAL: 6,
  ANUAL: 12,
};

export const rotuloSituacaoRecorrente: Record<SituacaoDespesaRecorrente, string> = {
  ATIVO: 'Ativa',
  PAUSADO: 'Pausada',
};

export const situacoesRecorrente: SituacaoDespesaRecorrente[] = ['ATIVO', 'PAUSADO'];

export const tomSituacaoRecorrente: Record<SituacaoDespesaRecorrente, TomSelo> = {
  ATIVO: 'positive',
  PAUSADO: 'neutral',
};

export const DIAS_VENCIMENTO_PROXIMO = 7;
