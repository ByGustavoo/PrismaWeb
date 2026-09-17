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

function nomeMes(monthKey: string): string {
  return capitalizar(formatarRotuloMes(monthKey)).replace(/ de \d{4}$/, '');
}

function ultimoDia(monthKey: string): number {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year ?? 1970, month ?? 1, 0).getDate();
}

function rotuloBase(months: string[]): string {
  const names = months.map((month) => nomeMes(month));
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;
}

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
                valor: <ValorMonetario valor={dados.saldoAtual} contarAoAparecer />,
                dica: 'Contas que entram no saldo total',
              },
              {
                rotulo: `Fim de ${nomeMes(dados.restanteMesAtual.mes)}`,
                valor: (
                  <ValorMonetario
                    valor={dados.saldoInicial}
                    tom={dados.saldoInicial < 0 ? 'negative' : 'default'}
                    contarAoAparecer
                  />
                ),
                dica: 'Hoje, mais o que ainda cai neste mês. É o ponto de partida.',
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
                dica: (
                  <>
                    Resultado médio de{' '}
                    <ValorMonetario
                      valor={dados.resultadoMedio}
                      tamanho="sm"
                      tom={dados.resultadoMedio >= 0 ? 'positive' : 'negative'}
                      sinal="auto"
                    />{' '}
                    por mês
                  </>
                ),
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
                dica:
                  dados.menorSaldo.mes === dados.restanteMesAtual.mes
                    ? `Fim de ${nomeMes(dados.menorSaldo.mes)}, antes do próximo salário`
                    : capitalizar(formatarRotuloMes(dados.menorSaldo.mes)),
              },
            ]}
          />

          <GraficoPrevisao dados={dados.meses} />

          {compact ? (
            <ListaPrevisao restante={dados.restanteMesAtual} meses={dados.meses} mesMaisBaixo={dados.menorSaldo.mes} />
          ) : (
            <TabelaPrevisao restante={dados.restanteMesAtual} meses={dados.meses} mesMaisBaixo={dados.menorSaldo.mes} />
          )}

          <section className={styles.method} aria-labelledby="titulo-metodo">
            <h2 id="titulo-metodo" className={styles.methodTitle}>
              Como a previsão é feita
            </h2>
            <ul className={styles.methodList}>
              <li>
                <strong>Ponto de partida.</strong> O saldo de hoje, somado ao que ainda falta neste mês: lançamentos
                agendados ou pendentes, recorrentes que ainda vão vencer, parcelas com vencimento até o dia{' '}
                {ultimoDia(dados.restanteMesAtual.mes)} e a parte proporcional do gasto variável.
              </li>
              <li>
                <strong>Receitas e gasto variável.</strong> Médias de {rotuloBase(dados.base.meses)}: receitas de{' '}
                <ValorMonetario valor={dados.base.receitaMedia} tamanho="sm" /> e despesas de{' '}
                <ValorMonetario valor={dados.base.despesaMedia} tamanho="sm" />. Das despesas sai o que já é recorrente (
                <ValorMonetario valor={dados.base.recorrentesMedia} tamanho="sm" />
                ), para o aluguel não contar duas vezes.
              </li>
              <li>
                <strong>Recorrentes e parcelas.</strong> Entram no mês exato em que vencem: o seguro anual aparece no
                mês dele, e cada parcela no mês em que a fatura vence.
              </li>
              <li>
                <strong>Aportes.</strong> Transferências para contas que ficam fora do saldo total, como a corretora. Em
                média, <ValorMonetario valor={dados.base.aportesMedia} tamanho="sm" /> por mês: o dinheiro continua seu,
                mas sai do saldo que a previsão acompanha.
              </li>
            </ul>
          </section>
        </div>
      )}
    </>
  );
}
