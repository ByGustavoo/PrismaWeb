import type { AmountTone } from '@/components/common';
import { investmentClassColor } from '@/constants/investments';
import type { InvestmentClass } from '@/types';

export function classColor(assetClass: InvestmentClass): string {
  return `var(--chart-${investmentClassColor[assetClass]})`;
}

export function profitTone(profit: number): AmountTone {
  if (profit > 0) return 'positive';
  if (profit < 0) return 'negative';
  return 'muted';
}
