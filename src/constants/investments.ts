import { Bitcoin, Boxes, Building2, CandlestickChart, Coins, Landmark, LineChart, PiggyBank } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { InvestmentClass } from '@/types';

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

export const PORTFOLIO_HISTORY_MONTHS = 12;
