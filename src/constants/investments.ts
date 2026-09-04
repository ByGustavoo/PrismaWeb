import { Bitcoin, Boxes, Building2, CandlestickChart, Coins, Landmark, LineChart, PiggyBank } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { InvestmentClass } from '@/types';

/**
 * Rotulos das classes de ativo num lugar so, para que o formulario, a
 * distribuicao e a lista de posicoes nunca escrevam a mesma classe de duas
 * formas diferentes.
 */
export const investmentClassLabel: Record<InvestmentClass, string> = {
  'fixed-income': 'Renda fixa',
  cdb: 'CDB',
  treasury: 'Tesouro',
  stocks: 'Ações',
  etf: 'ETFs',
  funds: 'Fundos',
  crypto: 'Criptomoedas',
  other: 'Outros',
};

/**
 * Ordem em que as classes aparecem no formulario e nos agrupamentos: do mais
 * previsivel ao mais volatil, com "Outros" no fim. Uma lista alfabetica
 * separaria CDB de Tesouro, que quem investe le como vizinhos.
 */
export const investmentClasses: InvestmentClass[] = [
  'fixed-income',
  'cdb',
  'treasury',
  'stocks',
  'etf',
  'funds',
  'crypto',
  'other',
];

/**
 * Um token de grafico por classe, fixo. A cor de uma classe precisa ser a mesma
 * na rosca, na legenda e na lista de posicoes — se ela saisse da ordem das
 * fatias, a mesma classe mudaria de cor ao ganhar ou perder participacao.
 */
export const investmentClassColor: Record<InvestmentClass, number> = {
  'fixed-income': 1,
  cdb: 6,
  treasury: 5,
  stocks: 2,
  etf: 8,
  funds: 4,
  crypto: 3,
  other: 7,
};

export const investmentClassIcon: Record<InvestmentClass, LucideIcon> = {
  'fixed-income': PiggyBank,
  cdb: Landmark,
  treasury: Building2,
  stocks: CandlestickChart,
  etf: LineChart,
  funds: Boxes,
  crypto: Bitcoin,
  other: Coins,
};

/**
 * Meses desenhados na evolucao do patrimonio. Doze cobrem o ciclo inteiro de um
 * ano, que e a janela em que se avalia rentabilidade.
 */
export const PORTFOLIO_HISTORY_MONTHS = 12;
