import { PORTFOLIO_HISTORY_MONTHS, investmentClasses } from '@/constants/investments';
import type {
  Investment,
  InvestmentAllocation,
  InvestmentClass,
  InvestmentPosition,
  PortfolioPoint,
  PortfolioSummary,
} from '@/types';
import { monthsBetween, shiftMonthKey } from '@/utils/date';
import { percentDelta, shortMonthLabel } from './aggregate';
import { currentMonth, investments } from './data';

/**
 * A carteira nao guarda historico: ela guarda o que cada posicao custou, o que
 * ela vale hoje e desde quando existe. A curva de evolucao nasce dai — e nao de
 * uma serie escrita a mao — para que cadastrar uma posicao agora mude o grafico
 * na mesma hora, como acontecera contra o backend.
 */

function money(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Oscilacao do mercado mes a mes, do atual para tras. E uma lista fixa pelo
 * mesmo motivo do historico de lancamentos: a curva precisa balancar, mas nao
 * pode mudar a cada recarregamento. O primeiro valor e 1 de proposito — o mes
 * corrente tem de fechar exatamente no valor cadastrado da posicao.
 */
const marketWave = [
  1, 0.986, 1.017, 0.973, 1.024, 0.991, 1.012, 0.968, 1.021, 0.988, 1.009, 0.977, 1.015, 0.994,
  1.006, 0.982, 1.019, 0.99,
];

/**
 * Quanto cada classe sente a oscilacao. Um CDB nao balanca como uma cripto, e
 * desenhar as duas com a mesma amplitude seria desenhar um grafico que nao
 * corresponde ao produto que ele representa.
 */
const classVolatility: Record<InvestmentClass, number> = {
  'RENDA_FIXA': 0.06,
  CDB: 0.04,
  TESOURO: 0.35,
  ACOES: 1,
  ETF: 0.85,
  FUNDOS: 0.6,
  CRIPTO: 2.4,
  OUTROS: 0.2,
};

/** Rentabilidade acumulada da posicao ate hoje: 0.082 e 8,2%. */
function profitabilityOf(item: Investment): number {
  return item.invested > 0 ? (item.currentValue - item.invested) / item.invested : 0;
}

/**
 * Quanto da posicao ja existia no mes indicado. Os aportes sao distribuidos
 * linearmente entre o primeiro deles e hoje: sem uma serie de aportes real, e a
 * suposicao mais honesta — e a unica que faz a curva chegar em hoje valendo
 * exatamente o que o cadastro diz.
 */
function progressOf(item: Investment, monthKey: string): number {
  const start = item.startDate.slice(0, 7);
  if (monthKey < start) return 0;

  const life = monthsBetween(start, currentMonth);
  const elapsed = monthsBetween(start, monthKey);
  return Math.min(elapsed / life, 1);
}

function valueOf(item: Investment, monthKey: string, offset: number): number {
  const progress = progressOf(item, monthKey);
  if (progress === 0) return 0;

  const wave = marketWave[offset] ?? 1;
  const swing = 1 + (wave - 1) * (classVolatility[item.assetClass] ?? 0.5);

  // O ganho acompanha o tempo em carteira: no primeiro mes a posicao vale o
  // aportado, e a rentabilidade so aparece inteira no mes corrente.
  return item.invested * progress * (1 + profitabilityOf(item) * progress) * swing;
}

/** Patrimonio da carteira inteira no fim de um mes. */
export function portfolioValueAt(monthKey: string): number {
  const offset = monthsBetween(monthKey, currentMonth) - 1;
  return money(investments.reduce((total, item) => total + valueOf(item, monthKey, Math.max(offset, 0)), 0));
}

function buildHistory(months: number): PortfolioPoint[] {
  return Array.from({ length: months }, (_, index) => {
    const offset = months - 1 - index;
    const month = shiftMonthKey(currentMonth, -offset);

    return {
      month,
      label: shortMonthLabel(month),
      invested: money(investments.reduce((total, item) => total + item.invested * progressOf(item, month), 0)),
      value: portfolioValueAt(month),
    };
  });
}

function buildAllocation(total: number): InvestmentAllocation[] {
  return investmentClasses
    .map((assetClass) => {
      const items = investments.filter((item) => item.assetClass === assetClass);
      const currentValue = money(items.reduce((sum, item) => sum + item.currentValue, 0));
      const invested = money(items.reduce((sum, item) => sum + item.invested, 0));

      return {
        assetClass,
        invested,
        currentValue,
        profit: money(currentValue - invested),
        share: total > 0 ? currentValue / total : 0,
        count: items.length,
      };
    })
    // Classe sem posicao nenhuma nao vira fatia de zero por cento na rosca.
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.currentValue - a.currentValue);
}

function buildPositions(total: number): InvestmentPosition[] {
  return [...investments]
    .sort((a, b) => b.currentValue - a.currentValue)
    .map((investment) => ({
      investment,
      profit: money(investment.currentValue - investment.invested),
      profitability: profitabilityOf(investment),
      share: total > 0 ? investment.currentValue / total : 0,
    }));
}

export function buildPortfolioSummary(): PortfolioSummary {
  const invested = money(investments.reduce((total, item) => total + item.invested, 0));
  const currentValue = money(investments.reduce((total, item) => total + item.currentValue, 0));
  const history = buildHistory(PORTFOLIO_HISTORY_MONTHS);
  const previous = history[history.length - 2];

  return {
    invested,
    currentValue,
    profit: money(currentValue - invested),
    profitability: invested > 0 ? (currentValue - invested) / invested : 0,
    valueDelta: percentDelta(currentValue, previous?.value ?? currentValue),
    allocation: buildAllocation(currentValue),
    history,
    positions: buildPositions(currentValue),
  };
}
