import type { TomValorMonetario } from '@/components/comum';
import { corClasseAtivo } from '@/constants/investimentos';
import type { ClasseAtivo } from '@/types';

export function corDaClasse(assetClass: ClasseAtivo): string {
  return `var(--chart-${corClasseAtivo[assetClass]})`;
}

export function tomRendimento(profit: number): TomValorMonetario {
  if (profit > 0) return 'positive';
  if (profit < 0) return 'negative';
  return 'muted';
}
