import { useCallback } from 'react';
import { LineChart } from 'lucide-react';
import { ValorMonetario, BarraResumo } from '@/components/comum';
import { GraficoPrevisao, ListaPrevisao, TabelaPrevisao } from '@/components/previsao';
import { CabecalhoPagina } from '@/components/layout';
import { Botao, Painel, EstadoVazio, BlocoCarregando } from '@/components/ui';
import { useDadosAssincronos } from '@/hooks/useDadosAssincronos';
import { useEhCompacto } from '@/hooks/useConsultaMidia';
import { previsaoService } from '@/services';
import { capitalizar, formatarRotuloMes } from '@/utils/formatacao';
import styles from './PaginaPrevisao.module.css';

export function PaginaPrevisao() {
  const compact = useEhCompacto();

  const fetchData = useCallback((signal: AbortSignal) => previsaoService.buscarResumo(undefined, signal), []);
  const { dados, carregando, erro, recarregar } = useDadosAssincronos(fetchData);

  const lastMonth = dados?.meses[dados.meses.length - 1];

  return (
    <>
      <CabecalhoPagina
        titulo="Previsão financeira"
        descricao="Como o saldo caminha nos próximos meses se o padrão atual se mantiver"
      />

      {carregando && !dados ? (
        <div className={styles.stack} aria-busy="true">
          <Painel espacamento="none">
            <BlocoCarregando linhas={2} altura={92} />
          </Painel>
          <Painel espacamento="none">
            <BlocoCarregando linhas={3} altura={300} />
          </Painel>
        </div>
      ) : erro ? (
        <Painel espacamento="none">
          <EstadoVazio
            titulo="Não foi possível carregar a previsão"
            descricao={erro.message}
            acao={
              <Botao variante="secondary" onClick={recarregar}>
                Tentar de novo
              </Botao>
            }
          />
        </Painel>
      ) : !dados || dados.meses.length === 0 ? (
        <Painel espacamento="none">
          <EstadoVazio
            icone={LineChart}
            titulo="Ainda não há histórico suficiente"
            descricao="A previsão usa a média dos últimos meses fechados, as despesas recorrentes e as parcelas já assumidas. Cadastre lançamentos para que ela apareça."
          />
        </Painel>
      ) : (
        <div className={`${styles.stack} refreshing`} aria-busy={carregando}>
          <BarraResumo
            itens={[
              {
                rotulo: 'Saldo de hoje',
                valor: <ValorMonetario valor={dados.saldoInicial} contarAoAparecer />,
                dica: 'Ponto de partida da projeção',
              },
              {
                rotulo: lastMonth ? `Saldo em ${capitalizar(formatarRotuloMes(lastMonth.mes))}` : 'Saldo previsto',
                valor: (
                  <ValorMonetario
                    valor={dados.saldoFinal}
                    tamanho="lg"
                    tom={dados.saldoFinal < 0 ? 'negative' : 'default'}
                    animar
                    contarAoAparecer
                  />
                ),
                dica: `Ao fim dos ${dados.meses.length} meses projetados`,
              },
              {
                rotulo: 'Resultado médio',
                valor: (
                  <ValorMonetario
                    valor={dados.resultadoMedio}
                    tom={dados.resultadoMedio >= 0 ? 'positive' : 'negative'}
                    sinal="auto"
                    contarAoAparecer
                  />
                ),
                dica: 'Quanto sobra (ou falta) por mês, em média',
              },
              {
                rotulo: 'Mês mais apertado',
                valor: (
                  <ValorMonetario
                    valor={dados.menorSaldo.saldo}
                    tom={dados.menorSaldo.saldo < 0 ? 'negative' : 'default'}
                    contarAoAparecer
                  />
                ),
                dica: capitalizar(formatarRotuloMes(dados.menorSaldo.mes)),
              },
            ]}
          />

          <GraficoPrevisao dados={dados.meses} />

          {compact ? (
            <ListaPrevisao meses={dados.meses} mesMaisBaixo={dados.menorSaldo.mes} />
          ) : (
            <TabelaPrevisao meses={dados.meses} mesMaisBaixo={dados.menorSaldo.mes} />
          )}

          <p className={styles.method}>
            A previsão parte do saldo de hoje e começa no mês que vem — o mês corrente já está no dashboard. As
            receitas e o gasto variável usam a média dos três meses fechados anteriores; as recorrentes e as parcelas
            entram no mês exato em que caem.
          </p>
        </div>
      )}
    </>
  );
}
