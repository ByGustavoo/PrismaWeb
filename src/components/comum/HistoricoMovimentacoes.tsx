import { useCallback, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { juntarClasses } from '@/utils/juntarClasses';
import { formatarDataNumerica } from '@/utils/formatacao';
import { ValorMonetario } from './ValorMonetario';
import type { TomValorMonetario } from './ValorMonetario';
import { DURACAO_VOO_MOVIMENTACAO_MS, VooMovimentacao } from './VooMovimentacao';
import styles from './HistoricoMovimentacoes.module.css';

export type TomMovimentacao = 'accent' | 'positive' | 'negative' | 'neutral';

export interface ItemMovimentacao {
  id: string;
  data: string;
  titulo: string;
  detalhe?: ReactNode;
  valor: number;
  sinal: 'plus' | 'minus' | 'auto';
  tom: TomMovimentacao;
  icone: LucideIcon;
  saldoApos: number;
}

export interface ChegadaMovimentacao {
  chave: number;
  ids: ReadonlySet<string>;
  origem: DOMRect | null;
}

interface HistoricoMovimentacoesProps {
  itens: ItemMovimentacao[];
  quantidadeInicial?: number;
  rotuloSaldo?: string;
  chegada?: ChegadaMovimentacao | null;
}

const tomValor: Record<TomMovimentacao, TomValorMonetario> = {
  accent: 'default',
  positive: 'positive',
  negative: 'negative',
  neutral: 'muted',
};

function movimentoReduzido(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function conteudoLinha(item: ItemMovimentacao, rotuloSaldo: string): ReactNode {
  const Icon = item.icone;
  return (
    <>
      <span className={juntarClasses(styles.icon, styles[item.tom])} aria-hidden="true">
        <Icon size={15} strokeWidth={2} />
      </span>

      <span className={styles.text}>
        <span className={styles.title}>{item.titulo}</span>
        <span className={styles.meta}>
          <span className="tabular">{formatarDataNumerica(item.data)}</span>
          {item.detalhe ? (
            <>
              <span className={styles.separator} aria-hidden="true">
                —
              </span>
              {item.detalhe}
            </>
          ) : null}
        </span>
      </span>

      <span className={styles.figures}>
        <ValorMonetario valor={item.valor} tamanho="sm" sinal={item.sinal} tom={tomValor[item.tom]} />
        <span className={styles.balance}>
          {rotuloSaldo} <ValorMonetario valor={item.saldoApos} tamanho="sm" tom="muted" />
        </span>
      </span>
    </>
  );
}

export function HistoricoMovimentacoes({
  itens,
  quantidadeInicial = 8,
  rotuloSaldo = 'Saldo',
  chegada = null,
}: HistoricoMovimentacoesProps) {
  const [expanded, setExpanded] = useState(false);
  const [landedKey, setLandedKey] = useState<number | null>(null);
  const arrivingRowRef = useRef<HTMLDivElement | null>(null);
  const arrivedIdsRef = useRef(new Set<string>());
  const visible = expanded ? itens : itens.slice(0, quantidadeInicial);
  const hidden = itens.length - visible.length;

  chegada?.ids.forEach((id) => arrivedIdsRef.current.add(id));

  const arrivingItem = chegada ? visible.find((item) => chegada.ids.has(item.id)) : undefined;
  const plannedFlight =
    chegada?.origem && arrivingItem && !movimentoReduzido()
      ? { item: arrivingItem, origem: chegada.origem, chave: chegada.chave }
      : null;
  const flight = plannedFlight && landedKey !== plannedFlight.chave ? plannedFlight : null;
  const arrivalDelay = plannedFlight ? DURACAO_VOO_MOVIMENTACAO_MS : 0;

  const findArrivingRow = useCallback(() => arrivingRowRef.current, []);

  return (
    <>
      <ul className={styles.list}>
        {visible.map((item, index) => {
          const arriving = arrivedIdsRef.current.has(item.id);
          return (
            <li
              key={item.id}
              className={juntarClasses(styles.item, arriving ? styles.arriving : 'list-item-in')}
              style={
                arriving
                  ? ({ '--atraso-chegada': `${arrivalDelay}ms` } as CSSProperties)
                  : ({ '--i': Math.min(index, 12) } as CSSProperties)
              }
            >
              <div ref={item === arrivingItem ? arrivingRowRef : undefined} className={styles.row}>
                {conteudoLinha(item, rotuloSaldo)}
              </div>
            </li>
          );
        })}
      </ul>

      {hidden > 0 || expanded ? (
        <button type="button" className={styles.more} onClick={() => setExpanded((value) => !value)}>
          {expanded ? 'Mostrar só os mais recentes' : `Mostrar mais ${hidden} ${hidden === 1 ? 'registro' : 'registros'}`}
        </button>
      ) : null}

      {flight ? (
        <VooMovimentacao
          key={flight.chave}
          origem={flight.origem}
          destino={findArrivingRow}
          aoPousar={() => setLandedKey(flight.chave)}
        >
          <div className={styles.row}>{conteudoLinha(flight.item, rotuloSaldo)}</div>
        </VooMovimentacao>
      ) : null}
    </>
  );
}
