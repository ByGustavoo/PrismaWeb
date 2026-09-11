import { useCallback, useState } from 'react';
import { ChartPie } from 'lucide-react';
import { ValorMonetario, IndicadorVariacao, BarraResumo } from '@/components/comum';
import { GraficoFluxoCaixa, DistribuicaoCategorias } from '@/components/dashboard';
import { CabecalhoPagina } from '@/components/layout';
import { GraficoEvolucaoSaldo, GraficoPatrimonio, SeletorPeriodoRelatorio, DistribuicaoOrigens } from '@/components/relatorios';
import { Botao, Painel, EstadoVazio, BlocoCarregando } from '@/components/ui';
import { periodoRelatorioDe } from '@/constants/relatorios';
import type { ChavePeriodoRelatorio } from '@/constants/relatorios';
import { useDadosAssincronos } from '@/hooks/useDadosAssincronos';
import { relatoriosService } from '@/services';
import type { PeriodoRelatorio } from '@/types';
import { formatarDataNumerica } from '@/utils/formatacao';
import styles from './PaginaRelatorios.module.css';

const CHAVE_INICIAL = 'month' satisfies Exclude<ChavePeriodoRelatorio, 'custom'>;

export function PaginaRelatorios() {
  const [rangeKey, setRangeKey] = useState<ChavePeriodoRelatorio>(CHAVE_INICIAL);
  const [range, setRange] = useState<PeriodoRelatorio>(() => periodoRelatorioDe(CHAVE_INICIAL));

  const handleSelect = (key: ChavePeriodoRelatorio) => {
    setRangeKey(key);
    if (key !== 'custom') setRange(periodoRelatorioDe(key));
  };

  const handleRangeChange = (next: PeriodoRelatorio) => {
    setRangeKey('custom');
    setRange(next);
  };

  const fetchData = useCallback(
    (signal: AbortSignal) => relatoriosService.buscarResumo(range, signal),
    [range.dataInicial, range.dataFinal],
  );

  const { dados, carregando, erro, recarregar } = useDadosAssincronos(fetchData, [range.dataInicial, range.dataFinal]);

  return (
    <>
      <CabecalhoPagina
        titulo="Relatórios"
        descricao={`Análise de ${formatarDataNumerica(range.dataInicial)} a ${formatarDataNumerica(range.dataFinal)}`}
        acoes={
          <SeletorPeriodoRelatorio
            valor={rangeKey}
            periodo={range}
            aoSelecionar={handleSelect}
            aoMudarPeriodo={handleRangeChange}
          />
        }
      />

      {carregando && !dados ? (
        <div className={styles.stack} aria-busy="true">
          <Painel espacamento="none">
            <BlocoCarregando linhas={2} altura={92} />
          </Painel>
          <div className={styles.grid}>
            <Painel espacamento="none">
              <BlocoCarregando linhas={3} altura={260} />
            </Painel>
            <Painel espacamento="none">
              <BlocoCarregando linhas={3} altura={260} />
            </Painel>
          </div>
        </div>
      ) : erro ? (
        <Painel espacamento="none">
          <EstadoVazio
            titulo="Não foi possível carregar o relatório"
            descricao={erro.message}
            acao={
              <Botao variante="secondary" onClick={recarregar}>
                Tentar de novo
              </Botao>
            }
          />
        </Painel>
      ) : !dados ? null : dados.quantidadeLancamentos === 0 ? (
        <Painel espacamento="none">
          <EstadoVazio
            icone={ChartPie}
            titulo="Nenhum lançamento neste período"
            descricao="Escolha um recorte maior ou outro intervalo para ver os gráficos deste relatório."
          />
        </Painel>
      ) : (
        <div className={`${styles.stack} refreshing`} aria-busy={carregando}>
          <BarraResumo
            itens={[
              {
                rotulo: 'Receitas',
                valor: <ValorMonetario valor={dados.receitas} tom="positive" animar contarAoAparecer />,
                dica: 'No período selecionado',
              },
              {
                rotulo: 'Despesas',
                valor: <ValorMonetario valor={dados.despesas} tom="negative" animar contarAoAparecer />,
                dica: 'Transferências não entram na conta',
              },
              {
                rotulo: 'Resultado',
                valor: (
                  <ValorMonetario
                    valor={dados.resultado}
                    tamanho="lg"
                    tom={dados.resultado >= 0 ? 'positive' : 'negative'}
                    sinal="auto"
                    animar
                    contarAoAparecer
                  />
                ),
                dica: 'Receitas menos despesas',
              },
              {
                rotulo: 'Lançamentos',
                valor: <span className={styles.count}>{dados.quantidadeLancamentos}</span>,
                dica: 'Registrados no período',
              },
            ]}
          />

          <div className={styles.deltas}>
            <span className={styles.delta}>
              <span className={styles.deltaLabel}>Receitas</span>
              <IndicadorVariacao variacao={dados.variacaoReceitas} legenda="em relação ao período anterior" />
            </span>
            <span className={styles.delta}>
              <span className={styles.deltaLabel}>Despesas</span>
              <IndicadorVariacao variacao={dados.variacaoDespesas} legenda="em relação ao período anterior" />
            </span>
          </div>

          <GraficoFluxoCaixa
            dados={dados.fluxoCaixa}
            titulo="Receitas e despesas"
            descricao="Entradas e saídas agrupadas dentro do período"
            larguraMaximaBarra={dados.fluxoCaixa.length <= 6 ? 56 : 32}
          />

          <div className={styles.grid}>
            <DistribuicaoCategorias dados={dados.despesasPorCategoria} substantivoPeriodo="período" />
            <DistribuicaoCategorias
              dados={dados.receitasPorCategoria}
              substantivoPeriodo="período"
              titulo="Receitas por categoria"
              descricao="Participação no total de receitas do período"
              rotuloVazio="Nenhuma receita com categoria neste período."
            />
          </div>

          <div className={styles.grid}>
            <DistribuicaoOrigens dados={dados.despesasPorOrigem} />
            <GraficoEvolucaoSaldo dados={dados.historicoSaldo} />
          </div>

          <GraficoPatrimonio dados={dados.patrimonio} />
        </div>
      )}
    </>
  );
}
