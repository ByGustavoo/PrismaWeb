import type { TomSelo } from '@/components/ui';
import type { Frequencia, SituacaoRecorrente, TipoRecorrente } from '@/types';
import { deDataISO, hojeISO, paraDataISO } from '@/utils/data';

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

export const rotuloSituacaoRecorrente: Record<SituacaoRecorrente, string> = {
  ATIVO: 'Ativa',
  PAUSADO: 'Pausada',
};

export const situacoesRecorrente: SituacaoRecorrente[] = ['ATIVO', 'PAUSADO'];

export const tomSituacaoRecorrente: Record<SituacaoRecorrente, TomSelo> = {
  ATIVO: 'positive',
  PAUSADO: 'neutral',
};

export const DIAS_VENCIMENTO_PROXIMO = 7;

export const ROTULO_LANCAMENTO_AUTOMATICO = 'Lança sozinha';

export const tiposRecorrente: TipoRecorrente[] = ['DESPESA', 'RECEITA'];

export const rotuloTipoRecorrente: Record<TipoRecorrente, string> = {
  RECEITA: 'Receita',
  DESPESA: 'Despesa',
};

const mesesPorFrequencia: Partial<Record<Frequencia, number>> = {
  MENSAL: 1,
  BIMESTRAL: 2,
  TRIMESTRAL: 3,
  SEMESTRAL: 6,
  ANUAL: 12,
};

function somarOcorrencia(iso: string, frequencia: Frequencia): string {
  const date = deDataISO(iso);

  if (frequencia === 'SEMANAL' || frequencia === 'QUINZENAL') {
    const days = frequencia === 'SEMANAL' ? 7 : 14;
    return paraDataISO(new Date(date.getFullYear(), date.getMonth(), date.getDate() + days));
  }

  const months = mesesPorFrequencia[frequencia] ?? 1;
  const lastDay = new Date(date.getFullYear(), date.getMonth() + months + 1, 0).getDate();
  return paraDataISO(new Date(date.getFullYear(), date.getMonth() + months, Math.min(date.getDate(), lastDay)));
}

export function proximaOcorrenciaAPartirDeHoje(iso: string, frequencia: Frequencia): string {
  const hoje = hojeISO();
  let next = somarOcorrencia(iso, frequencia);

  while (next < hoje) {
    next = somarOcorrencia(next, frequencia);
  }

  return next;
}
