import { ValorMonetario } from '@/components/comum';
import { Painel, CorpoPainel, CabecalhoPainel, Selo } from '@/components/ui';
import { linhasPrevisao } from '@/constants/previsao';
import type { MesPrevisaoDTO } from '@/types';
import { juntarClasses } from '@/utils/juntarClasses';
import { capitalizar, formatarRotuloMes } from '@/utils/formatacao';
import styles from './ListaPrevisao.module.css';

interface ListaPrevisaoProps {
  restante: MesPrevisaoDTO;
  meses: MesPrevisaoDTO[];
  mesMaisBaixo: string;
}

export function ListaPrevisao({ restante, meses, mesMaisBaixo }: ListaPrevisaoProps) {
  const rows = [{ month: restante, partial: true }, ...meses.map((month) => ({ month, partial: false }))];

  return (
    <Painel espacamento="none">
      <div className={styles.header}>
        <CabecalhoPainel
          titulo="Mês a mês"
          descricao="O primeiro bloco é o que ainda falta no mês corrente. A faixa marca o mês de menor saldo."
        />
      </div>

      <ul className={styles.list}>
        {rows.map(({ month, partial }) => {
          const lowest = month.mes === mesMaisBaixo;
          const lines = linhasPrevisao.filter((line) => month[line.chave] !== 0);

          return (
            <li
              key={`${month.mes}-${partial ? 'restante' : 'mes'}`}
              className={juntarClasses(lowest && styles.lowest, partial && styles.partial)}
            >
              <CorpoPainel className={styles.item}>
                <div className={styles.top}>
                  <span className={styles.monthGroup}>
                    <span className={styles.month}>
                      {partial
                        ? `Resto de ${capitalizar(formatarRotuloMes(month.mes)).replace(/ de \d{4}$/, '')}`
                        : capitalizar(formatarRotuloMes(month.mes))}
                      {lowest ? <span className="visually-hidden"> — mês de menor saldo previsto</span> : null}
                    </span>
                    {partial ? <Selo tom="neutral">Em andamento</Selo> : null}
                  </span>
                  <span className={styles.balance}>
                    <span className={styles.balanceLabel}>Saldo previsto</span>
                    <ValorMonetario valor={month.saldoFinal} tom={month.saldoFinal < 0 ? 'negative' : 'default'} />
                  </span>
                </div>

                <dl className={styles.lines}>
                  {lines.map((line) => (
                    <div key={line.chave} className={styles.line}>
                      <dt>{line.rotulo}</dt>
                      <dd>
                        <ValorMonetario valor={month[line.chave]} tamanho="sm" tom={line.entrada ? 'positive' : 'muted'} />
                      </dd>
                    </div>
                  ))}
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
          );
        })}
      </ul>
    </Painel>
  );
}
