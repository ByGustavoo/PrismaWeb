import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { ValorMonetario } from '@/components/comum';
import type { Tendencia } from '@/types';
import { juntarClasses } from '@/utils/juntarClasses';
import { formatarPercentual } from '@/utils/formatacao';
import { classeTendenciaPreco, tomPreco, rotuloTendenciaPreco } from './aparencia';
import styles from './VariacaoPreco.module.css';

interface VariacaoPrecoProps {
  variacao: number;
  percentual: number;
  tendencia: Tendencia;
  tamanho?: 'sm' | 'md';
  className?: string;
}

export function VariacaoPreco({ variacao, percentual, tendencia, tamanho = 'md', className }: VariacaoPrecoProps) {
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
      <ValorMonetario valor={Math.abs(variacao)} tamanho="sm" tom={tomPreco(tendencia)} />
      <span className={juntarClasses(styles.percent, 'tabular')}>{formatarPercentual(Math.abs(percentual))}</span>
    </span>
  );
}
