import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import type { Tendencia, VariacaoDTO } from '@/types';
import { ValorMonetario } from './ValorMonetario';
import { juntarClasses } from '@/utils/juntarClasses';
import { formatarPartesPercentualComSinal } from '@/utils/formatacao';
import styles from './IndicadorVariacao.module.css';

export interface IndicadorVariacaoProps {
  variacao: VariacaoDTO;
  legenda?: string;
  sentidoFavoravel?: Exclude<Tendencia, 'ESTAVEL'>;
}

export function IndicadorVariacao({ variacao, legenda, sentidoFavoravel = 'ALTA' }: IndicadorVariacaoProps) {
  const Icon = variacao.tendencia === 'ALTA' ? ArrowUpRight : variacao.tendencia === 'BAIXA' ? ArrowDownRight : Minus;
  const tone =
    variacao.tendencia === 'ESTAVEL' ? 'flat' : variacao.tendencia === sentidoFavoravel ? 'good' : 'bad';

  return (
    <span className={juntarClasses(styles.delta, styles[tone])}>
      <Icon size={14} strokeWidth={2.25} aria-hidden="true" />
      {variacao.percentual === undefined ? (
        <ValorMonetario valor={variacao.diferenca} tamanho="sm" sinal="auto" className={styles.amount} />
      ) : (
        <Percentual valor={variacao.percentual} />
      )}
      {legenda ? <span className={styles.caption}>{legenda}</span> : null}
    </span>
  );
}

function Percentual({ valor }: { valor: number }) {
  const { sinal, numero } = formatarPartesPercentualComSinal(valor);

  return (
    <span className="tabular">
      {sinal ? <span className={styles.sign}>{sinal}</span> : null}
      {numero}
    </span>
  );
}
