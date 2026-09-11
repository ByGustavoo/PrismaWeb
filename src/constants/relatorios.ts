import type { Opcao } from '@/types';
import type { PeriodoRelatorio } from '@/types';
import { somarDias, somarMeses, periodoDaChaveMes, paraDataISO, paraChaveMes } from '@/utils/data';

export type ChavePeriodoRelatorio = 'week' | 'month' | 'quarter' | 'semester' | 'year' | 'custom';

export const rotuloPeriodoRelatorio: Record<ChavePeriodoRelatorio, string> = {
  week: 'Semana',
  month: 'Mês',
  quarter: '3 meses',
  semester: '6 meses',
  year: 'Ano',
  custom: 'Personalizado',
};

export const chavesPeriodoRelatorio: ChavePeriodoRelatorio[] = ['week', 'month', 'quarter', 'semester', 'year', 'custom'];

export const opcoesPeriodoRelatorio: Opcao<ChavePeriodoRelatorio>[] = chavesPeriodoRelatorio.map((key) => ({ valor: key, rotulo: rotuloPeriodoRelatorio[key],
}));

export function periodoRelatorioDe(key: Exclude<ChavePeriodoRelatorio, 'custom'>, base: Date = new Date()): PeriodoRelatorio {
  const to = paraDataISO(base);

  if (key === 'week') return { dataInicial: paraDataISO(somarDias(base, -6)), dataFinal: to };
  if (key === 'month') return { dataInicial: periodoDaChaveMes(paraChaveMes(base)).from, dataFinal: to };
  if (key === 'year') return { dataInicial: `${base.getFullYear()}-01-01`, dataFinal: to };

  const months = key === 'quarter' ? 2 : 5;
  return { dataInicial: periodoDaChaveMes(paraChaveMes(somarMeses(base, -months))).from, dataFinal: to };
}

export const DIAS_MAXIMOS_BALDE_DIARIO = 10;
export const DIAS_MAXIMOS_BALDE_SEMANAL = 45;
