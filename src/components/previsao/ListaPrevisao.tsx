import { ValorMonetario } from '@/components/comum';
import { Painel, CorpoPainel, CabecalhoPainel } from '@/components/ui';
import type { MesPrevisaoDTO } from '@/types';
import { capitalizar, formatarRotuloMes } from '@/utils/formatacao';
import styles from './ListaPrevisao.module.css';

interface ListaPrevisaoProps {
  meses: MesPrevisaoDTO[];
  mesMaisBaixo: string;
}

export function ListaPrevisao({ meses, mesMaisBaixo }: ListaPrevisaoProps) {
  return (
    <Painel espacamento="none">
      <div className={styles.header}>
        <CabecalhoPainel
          titulo="Mês a mês"
          descricao="Cada despesa somada em sua própria linha. A faixa marca o mês de menor saldo."
        />
      </div>

      <ul className={styles.list}>
        {meses.map((month) => (
          <li key={month.mes} className={month.mes === mesMaisBaixo ? styles.lowest : undefined}>
            <CorpoPainel className={styles.item}>
              <div className={styles.top}>
                <span className={styles.month}>
                  {capitalizar(formatarRotuloMes(month.mes))}
                  {month.mes === mesMaisBaixo ? (
                    <span className="visually-hidden"> — mês de menor saldo previsto</span>
                  ) : null}
                </span>
                <span className={styles.balance}>
                  <span className={styles.balanceLabel}>Saldo previsto</span>
                  <ValorMonetario valor={month.saldoFinal} tom={month.saldoFinal < 0 ? 'negative' : 'default'} />
                </span>
              </div>

              <dl className={styles.lines}>
                <div className={styles.line}>
                  <dt>Receitas</dt>
                  <dd>
                    <ValorMonetario valor={month.receita} tamanho="sm" tom="positive" />
                  </dd>
                </div>
                <div className={styles.line}>
                  <dt>Recorrentes</dt>
                  <dd>
                    <ValorMonetario valor={month.recorrentes} tamanho="sm" tom="muted" />
                  </dd>
                </div>
                <div className={styles.line}>
                  <dt>Parcelas</dt>
                  <dd>
                    <ValorMonetario valor={month.parcelas} tamanho="sm" tom="muted" />
                  </dd>
                </div>
                <div className={styles.line}>
                  <dt>Variável</dt>
                  <dd>
                    <ValorMonetario valor={month.variavel} tamanho="sm" tom="muted" />
                  </dd>
                </div>
                <div className={`${styles.line} ${styles.result}`}>
                  <dt>Resultado</dt>
                  <dd>
                    <ValorMonetario
                      valor={month.resultado}
                      tamanho="sm"
                      tom={month.resultado >= 0 ? 'positive' : 'negative'}
                      sinal="auto"
                    />
                  </dd>
                </div>
              </dl>
            </CorpoPainel>
          </li>
        ))}
      </ul>
    </Painel>
  );
}
