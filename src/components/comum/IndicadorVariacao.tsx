import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import type { VariacaoDTO } from '@/types';
import { juntarClasses } from '@/utils/juntarClasses';
import { formatarPercentualComSinal } from '@/utils/formatacao';
import styles from './IndicadorVariacao.module.css';

export interface IndicadorVariacaoProps {
  variacao: VariacaoDTO;
  legenda?: string;
}

export function IndicadorVariacao({ variacao, legenda }: IndicadorVariacaoProps) {
  const Icon = variacao.tendencia === 'ALTA' ? ArrowUpRight : variacao.tendencia === 'BAIXA' ? ArrowDownRight : Minus;
  const tone = variacao.tendencia === 'ESTAVEL' ? 'flat' : variacao.tendencia === 'ALTA' ? 'good' : 'bad';

  return (
    <span className={juntarClasses(styles.delta, styles[tone])}>
      <Icon size={14} strokeWidth={2.25} aria-hidden="true" />
      <span className="tabular">{formatarPercentualComSinal(variacao.percentual)}</span>
      {legenda ? <span className={styles.caption}>{legenda}</span> : null}
    </span>
  );
}
