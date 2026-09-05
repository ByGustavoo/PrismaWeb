import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { Amount } from '@/components/common';
import type { Tendencia } from '@/types';
import { cn } from '@/utils/cn';
import { formatPercent } from '@/utils/format';
import { priceTone, priceTrendLabel } from './meta';
import styles from './PriceDelta.module.css';

interface PriceDeltaProps {
  /** Diferenca em reais; o sinal decide o texto, o valor sai em modulo. */
  change: number;
  /** Variacao percentual sobre o preco de referencia. */
  percentage: number;
  trend: Tendencia;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Quanto o preco andou, em reais e em porcentagem. Seta, palavra e cor contam a
 * mesma historia — ver o comentario de `priceTone` em `meta.ts` para o porque
 * de a cor aqui seguir a noticia, e nao a direcao do numero.
 */
export function PriceDelta({ change, percentage, trend, size = 'md', className }: PriceDeltaProps) {
  const Icon = trend === 'BAIXA' ? ArrowDownRight : trend === 'ALTA' ? ArrowUpRight : Minus;

  if (trend === 'ESTAVEL') {
    return (
      <span className={cn(styles.delta, styles[trend], styles[size], className)}>
        <Icon size={size === 'sm' ? 13 : 15} strokeWidth={2.25} aria-hidden="true" />
        <span className={styles.word}>Preço estável</span>
      </span>
    );
  }

  return (
    <span className={cn(styles.delta, styles[trend], styles[size], className)}>
      <Icon size={size === 'sm' ? 13 : 15} strokeWidth={2.25} aria-hidden="true" />
      <span className={styles.word}>{priceTrendLabel[trend]}</span>
      <Amount value={Math.abs(change)} size="sm" tone={priceTone(trend)} />
      <span className={cn(styles.percent, 'tabular')}>{formatPercent(Math.abs(percentage))}</span>
    </span>
  );
}
