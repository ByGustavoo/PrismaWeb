import { ArrowDownRight, ArrowRight, ArrowUpRight, ChevronRight } from 'lucide-react';
import { ValorMonetario } from '@/components/comum';
import { Selo, Botao } from '@/components/ui';
import { tomDaFatura } from '@/components/cartoes/aparencia';
import { rotuloSituacaoFatura } from '@/constants/cartoes';
import type { FaturaCartaoDTO } from '@/types';
import { capitalizar, formatarRotuloVencimento, formatarDataCompleta, formatarRotuloMes, formatarDataCurta } from '@/utils/formatacao';
import styles from './EntradaFatura.module.css';

interface EntradaFaturaProps {
  fatura: FaturaCartaoDTO;
  aoAbrir: (invoice: FaturaCartaoDTO) => void;
}

function rotuloItens(count: number): string {
  return `${count} ${count === 1 ? 'compra' : 'compras'}`;
}

export function DestaqueFatura({ fatura, aoAbrir }: EntradaFaturaProps) {
  const empty = fatura.quantidadeItens === 0;

  const previous = fatura.totalAnterior;
  const difference = previous !== undefined && previous > 0 ? fatura.total - previous : undefined;
  const changed = difference !== undefined && Math.abs(difference) >= 0.01;

  return (
    <article className={`${styles.highlight} card-hover-accent`}>
      <header className={styles.highlightHeader}>
        <span className={styles.cardName}>{fatura.nomeCartao}</span>
        <Selo tom={tomDaFatura(fatura)} ponto>
          {rotuloSituacaoFatura[fatura.situacao]}
        </Selo>
      </header>

      <h3 className={styles.month}>{capitalizar(formatarRotuloMes(fatura.mes))}</h3>

      <ValorMonetario valor={fatura.total} tamanho="lg" />
      <span className={styles.items}>{empty ? 'Nenhuma compra ainda' : rotuloItens(fatura.quantidadeItens)}</span>

      {changed && difference !== undefined ? (
        <span className={styles.compare}>
          {difference > 0 ? (
            <ArrowUpRight size={14} strokeWidth={2.25} aria-hidden="true" />
          ) : (
            <ArrowDownRight size={14} strokeWidth={2.25} aria-hidden="true" />
          )}
          <ValorMonetario valor={Math.abs(difference)} tamanho="sm" tom="muted" />
          {difference > 0 ? 'acima da fatura anterior' : 'abaixo da fatura anterior'}
        </span>
      ) : null}

      <dl className={styles.dates}>
        <div className={styles.date}>
          <dt>Fechamento</dt>
          <dd>{formatarDataCompleta(fatura.dataFechamento)}</dd>
        </div>
        <div className={styles.date}>
          <dt>Vencimento</dt>
          <dd>{formatarDataCompleta(fatura.dataVencimento)}</dd>
        </div>
      </dl>

      <footer className={styles.highlightFooter}>
        <span className={styles.due}>{capitalizar(formatarRotuloVencimento(fatura.dataVencimento))}</span>
        <Botao
          variante="secondary"
          tamanho="sm"
          icone={ArrowRight}
          posicaoIcone="right"
          disabled={empty}
          onClick={() => aoAbrir(fatura)}
        >
          Ver compras
        </Botao>
      </footer>
    </article>
  );
}

export function LinhaFatura({ fatura, aoAbrir }: EntradaFaturaProps) {
  return (
    <li>
      <button type="button" className={styles.row} onClick={() => aoAbrir(fatura)}>
        <span className={styles.rowIdentity}>
          <span className={styles.rowMonth}>{capitalizar(formatarRotuloMes(fatura.mes))}</span>
          <span className={styles.rowCard}>
            {fatura.nomeCartao}
            <span className={styles.separator} aria-hidden="true">
              ·
            </span>
            {rotuloItens(fatura.quantidadeItens)}
          </span>
        </span>

        <span className={styles.rowDates}>
          <span>
            Fecha <span className="tabular">{formatarDataCurta(fatura.dataFechamento)}</span>
          </span>
          <span>
            Vence <span className="tabular">{formatarDataCurta(fatura.dataVencimento)}</span>
          </span>
        </span>

        <span className={styles.rowValue}>
          <ValorMonetario valor={fatura.total} tamanho="sm" />
        </span>

        <span className={styles.rowStatus}>
          <Selo tom={tomDaFatura(fatura)} ponto>
            {rotuloSituacaoFatura[fatura.situacao]}
          </Selo>
        </span>

        <ChevronRight className={styles.chevron} size={16} strokeWidth={2} aria-hidden="true" />
      </button>
    </li>
  );
}
