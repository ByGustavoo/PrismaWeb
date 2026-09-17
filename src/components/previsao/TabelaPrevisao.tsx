import { ValorMonetario } from '@/components/comum';
import {
  Painel,
  CorpoPainel,
  CabecalhoPainel,
  CorpoTabela,
  CabecaTabela,
  Tabela,
  ContainerTabela,
  Celula,
  CelulaCabecalho,
  LinhaTabela,
  Selo,
} from '@/components/ui';
import { linhasPrevisao } from '@/constants/previsao';
import type { MesPrevisaoDTO } from '@/types';
import { juntarClasses } from '@/utils/juntarClasses';
import { capitalizar, formatarRotuloMes } from '@/utils/formatacao';
import styles from './TabelaPrevisao.module.css';

interface TabelaPrevisaoProps {
  restante: MesPrevisaoDTO;
  meses: MesPrevisaoDTO[];
  mesMaisBaixo: string;
}

export function TabelaPrevisao({ restante, meses, mesMaisBaixo }: TabelaPrevisaoProps) {
  const rows = [{ month: restante, partial: true }, ...meses.map((month) => ({ month, partial: false }))];

  return (
    <Painel espacamento="none">
      <div className={styles.header}>
        <CabecalhoPainel
          titulo="Mês a mês"
          descricao="Cada saída em sua própria coluna. A primeira linha é o que ainda falta no mês corrente; a faixa marca o mês de menor saldo."
        />
      </div>

      <CorpoPainel className={styles.body}>
        <ContainerTabela>
          <Tabela className={styles.table}>
            <CabecaTabela>
              <LinhaTabela>
                <CelulaCabecalho scope="col">Mês</CelulaCabecalho>
                {linhasPrevisao.map((line) => (
                  <CelulaCabecalho key={line.chave} scope="col" numerico>
                    {line.rotulo}
                  </CelulaCabecalho>
                ))}
                <CelulaCabecalho scope="col" numerico>
                  Resultado
                </CelulaCabecalho>
                <CelulaCabecalho scope="col" numerico>
                  Saldo previsto
                </CelulaCabecalho>
              </LinhaTabela>
            </CabecaTabela>
            <CorpoTabela>
              {rows.map(({ month, partial }) => (
                <LinhaTabela
                  key={`${month.mes}-${partial ? 'restante' : 'mes'}`}
                  className={juntarClasses(
                    partial && styles.partial,
                    month.mes === mesMaisBaixo && styles.lowest,
                  )}
                >
                  <Celula>
                    <span className={styles.monthCell}>
                      <span className={styles.month}>
                        {partial ? `Resto de ${capitalizar(formatarRotuloMes(month.mes)).replace(/ de \d{4}$/, '')}` : capitalizar(formatarRotuloMes(month.mes))}
                      </span>
                      {partial ? <Selo tom="neutral">Em andamento</Selo> : null}
                    </span>
                    {month.mes === mesMaisBaixo ? (
                      <span className="visually-hidden"> — menor saldo previsto</span>
                    ) : null}
                  </Celula>
                  {linhasPrevisao.map((line) => {
                    const value = month[line.chave];
                    return (
                      <Celula key={line.chave} numerico>
                        {value === 0 ? (
                          <span className={styles.empty} aria-label="Nada previsto">
                            —
                          </span>
                        ) : (
                          <ValorMonetario valor={value} tamanho="sm" tom={line.entrada ? 'positive' : 'muted'} />
                        )}
                      </Celula>
                    );
                  })}
                  <Celula numerico>
                    <ValorMonetario
                      valor={month.resultado}
                      tamanho="sm"
                      tom={month.resultado >= 0 ? 'positive' : 'negative'}
                      sinal="auto"
                    />
                  </Celula>
                  <Celula numerico>
                    <ValorMonetario valor={month.saldoFinal} tom={month.saldoFinal < 0 ? 'negative' : 'default'} />
                  </Celula>
                </LinhaTabela>
              ))}
            </CorpoTabela>
          </Tabela>
        </ContainerTabela>
      </CorpoPainel>
    </Painel>
  );
}
