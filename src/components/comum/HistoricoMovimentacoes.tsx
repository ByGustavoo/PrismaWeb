import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { LucideIcon } from 'lucide-react';
import { juntarClasses } from '@/utils/juntarClasses';
import { formatarDataNumerica } from '@/utils/formatacao';
import { ValorMonetario } from './ValorMonetario';
import type { TomValorMonetario } from './ValorMonetario';
import styles from './HistoricoMovimentacoes.module.css';

export type TomMovimentacao = 'accent' | 'positive' | 'negative' | 'neutral';

export interface ItemMovimentacao {
  id: string;
  data: string;
  titulo: string;
  detalhe?: string;
  valor: number;
  sinal: 'plus' | 'minus' | 'auto';
  tom: TomMovimentacao;
  icone: LucideIcon;
  saldoApos: number;
}

interface HistoricoMovimentacoesProps {
  itens: ItemMovimentacao[];
  quantidadeInicial?: number;
  rotuloSaldo?: string;
}

const tomValor: Record<TomMovimentacao, TomValorMonetario> = {
  accent: 'default',
  positive: 'positive',
  negative: 'negative',
  neutral: 'muted',
};

export function HistoricoMovimentacoes({ itens, quantidadeInicial = 8, rotuloSaldo = 'Saldo' }: HistoricoMovimentacoesProps) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? itens : itens.slice(0, quantidadeInicial);
  const hidden = itens.length - visible.length;

  return (
    <>
      <ul className={styles.list}>
        {visible.map((item, index) => {
          const Icon = item.icone;
          return (
            <li
              key={item.id}
              className={juntarClasses(styles.item, 'list-item-in')}
              style={{ '--i': Math.min(index, 12) } as CSSProperties}
            >
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
                        ·
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
            </li>
          );
        })}
      </ul>

      {hidden > 0 || expanded ? (
        <button type="button" className={styles.more} onClick={() => setExpanded((value) => !value)}>
          {expanded ? 'Mostrar só os mais recentes' : `Mostrar mais ${hidden} ${hidden === 1 ? 'registro' : 'registros'}`}
        </button>
      ) : null}
    </>
  );
}
