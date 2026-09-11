import { useCallback, useEffect, useRef } from 'react';
import { CreditCard, PiggyBank, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { CabecalhoPagina, SeletorPeriodo } from '@/components/layout';
import {
  PainelSaldo,
  GraficoFluxoCaixa,
  DistribuicaoCategorias,
  UltimosLancamentos,
  CalendarioGastos,
  BlocoIndicador,
} from '@/components/dashboard';
import { Botao, Painel, EstadoVazio, BlocoCarregando, Esqueleto } from '@/components/ui';
import { useDadosAssincronos } from '@/hooks/useDadosAssincronos';
import { useEhMobile } from '@/hooks/useConsultaMidia';
import { usePeriodo } from '@/providers/ProvedorPeriodo';
import { useNotificacoes } from '@/providers/ProvedorNotificacoes';
import { dashboardService } from '@/services';
import { chaveMesPorDeslocamento } from '@/utils/data';
import { capitalizar, formatarDataCompleta, formatarRotuloMes, formatarRotuloPeriodo, formatarHora } from '@/utils/formatacao';
import styles from './PaginaDashboard.module.css';

export function PaginaDashboard() {
  const { periodo } = usePeriodo();
  const { dataInicial: from, dataFinal: to } = periodo;
  const thisMonth = chaveMesPorDeslocamento(0);
  const isMobile = useEhMobile();

  const fetchSummary = useCallback(
    (signal: AbortSignal) => dashboardService.buscarResumo({ dataInicial: from, dataFinal: to }, signal),
    [from, to],
  );
  const { dados, carregando, erro, recarregar } = useDadosAssincronos(fetchSummary, [from, to]);

  const toast = useNotificacoes();
  const refreshRequested = useRef(false);

  const handleRefresh = () => {
    refreshRequested.current = true;
    recarregar();
  };

  useEffect(() => {
    if (carregando || !refreshRequested.current) return;
    refreshRequested.current = false;
    if (erro) return;
    toast.sucesso('Dados atualizados', `Última consulta às ${formatarHora()}`);
  }, [carregando, erro, toast]);

  const periodLabel = formatarRotuloPeriodo(from, to);

  const shownFrom = dados?.dataInicial ?? from;
  const shownTo = dados?.dataFinal ?? to;
  const isCurrentMonth = shownFrom === thisMonth && shownTo === thisMonth;
  const shownLabel = formatarRotuloPeriodo(shownFrom, shownTo);
  const periodNoun = shownFrom === shownTo ? 'mês' : 'período';

  return (
    <>
      <CabecalhoPagina
        titulo="Dashboard"
        descricao={`Visão geral de ${periodLabel}`}
        acoes={
          <>
            {isMobile ? <SeletorPeriodo /> : null}
            <Botao variante="secondary" tamanho="sm" icone={RefreshCw} onClick={handleRefresh} carregando={carregando}>
              {carregando ? 'Atualizando' : 'Atualizar'}
            </Botao>
          </>
        }
      />

      {erro ? (
        <Painel espacamento="none">
          <EstadoVazio
            titulo="Não foi possível carregar o resumo"
            descricao={erro.message}
            acao={
              <Botao variante="secondary" icone={RefreshCw} onClick={recarregar}>
                Tentar de novo
              </Botao>
            }
          />
        </Painel>
      ) : !dados ? (
        <EsqueletoDashboard />
      ) : (
        <div className={`${styles.grid} refreshing`} aria-busy={carregando}>
          <PainelSaldo
            rotulo={isCurrentMonth ? 'Saldo atual' : `Saldo no fim de ${capitalizar(formatarRotuloMes(shownTo))}`}
            saldo={dados.saldoAtual}
            variacao={dados.variacaoSaldo}
            entradas={dados.receitasMes}
            saidas={dados.despesasMes}
            substantivoPeriodo={periodNoun}
            historico={dados.historicoSaldo}
          />

          <div className={styles.tiles}>
            <BlocoIndicador
              rotulo={`Receitas do ${periodNoun}`}
              valor={dados.receitasMes}
              icone={TrendingUp}
              variacao={dados.variacaoReceitas}
            />
            <BlocoIndicador
              rotulo={`Despesas do ${periodNoun}`}
              valor={dados.despesasMes}
              icone={TrendingDown}
              variacao={dados.variacaoDespesas}
            />
            <BlocoIndicador
              rotulo="Investimentos"
              valor={dados.totalInvestido}
              icone={PiggyBank}
              variacao={dados.variacaoInvestimentos}
              notaRodape="Rentabilidade acumulada"
            />
            <BlocoIndicador
              rotulo={shownFrom === shownTo ? 'Fatura do mês' : `Fatura de ${capitalizar(formatarRotuloMes(shownTo))}`}
              valor={dados.faturaAtual.total}
              icone={CreditCard}
              notaRodape={`${dados.faturaAtual.nomeCartao} · vence em ${formatarDataCompleta(dados.faturaAtual.dataVencimento)}`}
            />
          </div>

          <div className={styles.charts}>
            <GraficoFluxoCaixa
              dados={dados.fluxoCaixa}
              descricao={
                shownFrom === shownTo
                  ? isCurrentMonth
                    ? 'Comparativo dos últimos seis meses'
                    : `Seis meses até ${capitalizar(formatarRotuloMes(shownTo))}`
                  : `Comparativo mês a mês de ${shownLabel}`
              }
            />
            <DistribuicaoCategorias dados={dados.gastoPorCategoria} substantivoPeriodo={periodNoun} />
          </div>

          <CalendarioGastos
            dias={dados.gastoDiario}
            descricao={
              shownFrom === shownTo
                ? isCurrentMonth
                  ? 'Cada dia dos últimos seis meses'
                  : `Cada dia dos seis meses até ${capitalizar(formatarRotuloMes(shownTo))}`
                : `Cada dia de ${shownLabel}`
            }
          />

          <UltimosLancamentos
            lancamentos={dados.lancamentosRecentes}
            descricao={
              isCurrentMonth ? 'Movimentações mais recentes das suas contas' : `Movimentações de ${shownLabel}`
            }
          />
        </div>
      )}
    </>
  );
}

function EsqueletoDashboard() {
  return (
    <div className={styles.grid} aria-busy="true">
      <Painel espacamento="none">
        <div className={styles.skeletonHero}>
          <div className={styles.skeletonColumn}>
            <Esqueleto largura={120} altura={14} />
            <Esqueleto largura={260} altura={44} raio="var(--radius-sm)" />
            <Esqueleto largura={180} altura={14} />
          </div>
          <Esqueleto altura={200} raio="var(--radius-md)" />
        </div>
      </Painel>

      <div className={styles.tiles}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Painel key={index} espacamento="sm">
            <Esqueleto largura={110} altura={13} />
            <Esqueleto largura={150} altura={26} className={styles.skeletonGap} />
          </Painel>
        ))}
      </div>

      <div className={styles.charts}>
        <Painel espacamento="none">
          <BlocoCarregando linhas={4} altura={320} />
        </Painel>
        <Painel espacamento="none">
          <BlocoCarregando linhas={5} altura={320} />
        </Painel>
      </div>

      <Painel espacamento="none">
        <BlocoCarregando linhas={3} altura={200} />
      </Painel>
    </div>
  );
}
