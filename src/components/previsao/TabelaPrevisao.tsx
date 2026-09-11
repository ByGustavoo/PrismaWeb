import { ValorMonetario } from '@/components/comum';
import { Painel, CorpoPainel, CabecalhoPainel, CorpoTabela, CabecaTabela, Tabela, ContainerTabela, Celula, CelulaCabecalho, LinhaTabela } from '@/components/ui';
import type { MesPrevisaoDTO } from '@/types';
import { capitalizar, formatarRotuloMes } from '@/utils/formatacao';
import styles from './TabelaPrevisao.module.css';

interface TabelaPrevisaoProps {
  meses: MesPrevisaoDTO[];
  mesMaisBaixo: string;
}

export function TabelaPrevisao({ meses, mesMaisBaixo }: TabelaPrevisaoProps) {
  return (
    <Painel espacamento="none">
      <div className={styles.header}>
        <CabecalhoPainel
          titulo="Mês a mês"
          descricao="Cada despesa somada em sua própria linha. A faixa marca o mês de menor saldo."
        />
      </div>

      <CorpoPainel className={styles.body}>
        <ContainerTabela>
          <Tabela className={styles.table}>
            <CabecaTabela>
              <LinhaTabela>
                <CelulaCabecalho scope="col">Mês</CelulaCabecalho>
                <CelulaCabecalho scope="col" numerico>
                  Receitas
                </CelulaCabecalho>
                <CelulaCabecalho scope="col" numerico>
                  Recorrentes
                </CelulaCabecalho>
                <CelulaCabecalho scope="col" numerico>
                  Parcelas
                </CelulaCabecalho>
                <CelulaCabecalho scope="col" numerico>
                  Variável
                </CelulaCabecalho>
                <CelulaCabecalho scope="col" numerico>
                  Resultado
                </CelulaCabecalho>
                <CelulaCabecalho scope="col" numerico>
                  Saldo previsto
                </CelulaCabecalho>
              </LinhaTabela>
            </CabecaTabela>
            <CorpoTabela>
              {meses.map((month) => (
                <LinhaTabela key={month.mes} className={month.mes === mesMaisBaixo ? styles.lowest : undefined}>
                  <Celula>
                    <span className={styles.month}>{capitalizar(formatarRotuloMes(month.mes))}</span>
                    {month.mes === mesMaisBaixo ? (
                      <span className="visually-hidden"> — mês de menor saldo previsto</span>
                    ) : null}
                  </Celula>
                  <Celula numerico>
                    <ValorMonetario valor={month.receita} tamanho="sm" tom="positive" />
                  </Celula>
                  <Celula numerico>
                    <ValorMonetario valor={month.recorrentes} tamanho="sm" tom="muted" />
                  </Celula>
                  <Celula numerico>
                    <ValorMonetario valor={month.parcelas} tamanho="sm" tom="muted" />
                  </Celula>
                  <Celula numerico>
                    <ValorMonetario valor={month.variavel} tamanho="sm" tom="muted" />
                  </Celula>
                  <Celula numerico>
                    <ValorMonetario valor={month.resultado} tamanho="sm" tom={month.resultado >= 0 ? 'positive' : 'negative'} sinal="auto" />
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
