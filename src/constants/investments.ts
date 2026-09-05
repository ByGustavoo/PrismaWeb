import { Bitcoin, Boxes, Building2, CandlestickChart, Coins, Landmark, LineChart, PiggyBank } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { InvestmentClass } from '@/types';

/**
 * Rotulos das classes de ativo num lugar so, para que o formulario, a
 * distribuicao e a lista de posicoes nunca escrevam a mesma classe de duas
 * formas diferentes.
 */
export const investmentClassLabel: Record<InvestmentClass, string> = {
  'RENDA_FIXA': 'Renda fixa',
  CDB: 'CDB',
  TESOURO: 'Tesouro',
  ACOES: 'Ações',
  ETF: 'ETFs',
  FUNDOS: 'Fundos',
  CRIPTO: 'Criptomoedas',
  OUTROS: 'Outros',
};

/**
 * Ordem em que as classes aparecem no formulario e nos agrupamentos: do mais
 * previsivel ao mais volatil, com "Outros" no fim. Uma lista alfabetica
 * separaria CDB de Tesouro, que quem investe le como vizinhos.
 */
export const investmentClasses: InvestmentClass[] = [
  'RENDA_FIXA',
  'CDB',
  'TESOURO',
  'ACOES',
  'ETF',
  'FUNDOS',
  'CRIPTO',
  'OUTROS',
];

/**
 * Um token de grafico por classe, fixo. A cor de uma classe precisa ser a mesma
 * na rosca, na legenda e na lista de posicoes — se ela saisse da ordem das
 * fatias, a mesma classe mudaria de cor ao ganhar ou perder participacao.
 */
export const investmentClassColor: Record<InvestmentClass, number> = {
  'RENDA_FIXA': 1,
  CDB: 6,
  TESOURO: 5,
  ACOES: 2,
  ETF: 8,
  FUNDOS: 4,
  CRIPTO: 3,
  OUTROS: 7,
};

export const investmentClassIcon: Record<InvestmentClass, LucideIcon> = {
  'RENDA_FIXA': PiggyBank,
  CDB: Landmark,
  TESOURO: Building2,
  ACOES: CandlestickChart,
  ETF: LineChart,
  FUNDOS: Boxes,
  CRIPTO: Bitcoin,
  OUTROS: Coins,
};

/**
 * Meses desenhados na evolucao do patrimonio. Doze cobrem o ciclo inteiro de um
 * ano, que e a janela em que se avalia rentabilidade.
 */
export const PORTFOLIO_HISTORY_MONTHS = 12;
