import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { ValorMonetario } from '@/components/comum';
import { Selo } from '@/components/ui';
import type { Tendencia } from '@/types';
import { juntarClasses } from '@/utils/juntarClasses';
import { formatarPercentual } from '@/utils/formatacao';
import { classeTendenciaPreco, tomPreco, tomSeloPreco, rotuloTendenciaPreco } from './aparencia';
import styles from './VariacaoPreco.module.css';

interface VariacaoPrecoProps {
  variacao: number;
  percentual: number;
  tendencia: Tendencia;
  tamanho?: 'sm' | 'md';
  legenda?: string;
  legendaAbaixo?: boolean;
  separarPercentual?: boolean;
  className?: string;
}

export function VariacaoPreco({
  variacao,
  percentual,
  tendencia,
  tamanho = 'md',
  legenda,
  legendaAbaixo = false,
  separarPercentual = false,
  className,
}: VariacaoPrecoProps) {
  const Icon = tendencia === 'BAIXA' ? ArrowDownRight : tendencia === 'ALTA' ? ArrowUpRight : Minus;

  if (tendencia === 'ESTAVEL') {
    return (
      <span className={juntarClasses(styles.delta, styles[classeTendenciaPreco[tendencia]], styles[tamanho], className)}>
        <Icon size={tamanho === 'sm' ? 13 : 15} strokeWidth={2.25} aria-hidden="true" />
        <span className={styles.word}>Preço estável</span>
      </span>
    );
  }

  return (
    <span className={juntarClasses(styles.delta, styles[classeTendenciaPreco[tendencia]], styles[tamanho], className)}>
      <Icon size={tamanho === 'sm' ? 13 : 15} strokeWidth={2.25} aria-hidden="true" />
      <span className={styles.word}>{rotuloTendenciaPreco[tendencia]}</span>
      <ValorMonetario valor={Math.abs(variacao)} tamanho="sm" tom={tomPreco(tendencia)} className={styles.amount} />
      {separarPercentual ? (
        <span className={styles.percentSeparator} aria-hidden="true">
          —
        </span>
      ) : null}
      <Selo tom={tomSeloPreco[tendencia]} className={juntarClasses(styles.percent, 'tabular')}>
        {formatarPercentual(Math.abs(percentual))}
      </Selo>
      {legenda ? (
        <span className={juntarClasses(styles.caption, legendaAbaixo && styles.captionBelow)}>
          {legendaAbaixo ? null : (
            <span className={styles.separator} aria-hidden="true">
              —
            </span>
          )}
          {legenda}
        </span>
      ) : null}
    </span>
  );
}
