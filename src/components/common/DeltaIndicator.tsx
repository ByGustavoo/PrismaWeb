import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import type { Variacao } from '@/types';
import { cn } from '@/utils/cn';
import { formatSignedPercent } from '@/utils/format';
import styles from './DeltaIndicator.module.css';

export interface DeltaIndicatorProps {
  delta: Variacao;
  caption?: string;
}

/**
 * Cor e seta contam a mesma historia: subiu e verde, caiu e vermelho. Ja houve
 * um modo que invertia so a cor (para ler queda de despesa como boa noticia),
 * mas ele produzia seta para baixo em verde — o simbolo dizia uma coisa e a cor
 * dizia outra.
 */
export function DeltaIndicator({ delta, caption }: DeltaIndicatorProps) {
  const Icon = delta.tendencia === 'ALTA' ? ArrowUpRight : delta.tendencia === 'BAIXA' ? ArrowDownRight : Minus;
  const tone = delta.tendencia === 'ESTAVEL' ? 'flat' : delta.tendencia === 'ALTA' ? 'good' : 'bad';

  return (
    <span className={cn(styles.delta, styles[tone])}>
      <Icon size={14} strokeWidth={2.25} aria-hidden="true" />
      <span className="tabular">{formatSignedPercent(delta.percentual)}</span>
      {caption ? <span className={styles.caption}>{caption}</span> : null}
    </span>
  );
}
