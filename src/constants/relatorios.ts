import type { GastoOrigemDTO, Opcao, PeriodoRelatorio, TokenCor } from '@/types';
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

export const TOKENS_COR_ORIGEM: TokenCor[] = [1, 4, 7, 5, 2, 8, 11, 3];

export function chaveDaOrigem(origem: Pick<GastoOrigemDTO, 'id' | 'grupo'>): string {
  return `${origem.grupo}:${origem.id}`;
}

function indiceDaChave(chave: string): number {
  let soma = 0;
  for (const caractere of chave) soma = (soma * 31 + caractere.charCodeAt(0)) >>> 0;
  return soma % TOKENS_COR_ORIGEM.length;
}

export function coresDasOrigens(origens: GastoOrigemDTO[]): Map<string, TokenCor> {
  const cores = new Map<string, TokenCor>();
  const usadas = new Set<number>();

  for (const origem of origens) {
    const chave = chaveDaOrigem(origem);
    let indice = indiceDaChave(chave);
    for (let tentativa = 0; tentativa < TOKENS_COR_ORIGEM.length && usadas.has(indice); tentativa += 1) {
      indice = (indice + 1) % TOKENS_COR_ORIGEM.length;
    }
    usadas.add(indice);
    if (usadas.size >= TOKENS_COR_ORIGEM.length) usadas.clear();
    cores.set(chave, TOKENS_COR_ORIGEM[indice] ?? 1);
  }

  return cores;
}
