import { useCallback, useEffect, useRef } from 'react';
import { CreditCard, PiggyBank, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { PageHeader, PeriodSwitcher } from '@/components/layout';
import {
  BalancePanel,
  CashflowChart,
  CategoryBreakdown,
  RecentTransactions,
  SpendingCalendar,
  StatTile,
} from '@/components/dashboard';
import { Button, Card, EmptyState, LoadingBlock, Skeleton } from '@/components/ui';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { usePeriod } from '@/providers/PeriodProvider';
import { useToast } from '@/providers/ToastProvider';
import { dashboardService } from '@/services';
import { monthKeyFromOffset } from '@/utils/date';
import { capitalize, formatFullDate, formatMonthLabel, formatPeriodLabel, formatTime } from '@/utils/format';
import styles from './DashboardPage.module.css';

export function DashboardPage() {
  const { period } = usePeriod();
  const { from, to } = period;
  const thisMonth = monthKeyFromOffset(0);
  const isMobile = useIsMobile();

  const fetchSummary = useCallback(
    (signal: AbortSignal) => dashboardService.getSummary({ from, to }, signal),
    [from, to],
  );
  const { data, loading, error, reload } = useAsyncData(fetchSummary, [from, to]);

  const toast = useToast();
  const refreshRequested = useRef(false);

  const handleRefresh = () => {
    refreshRequested.current = true;
    reload();
  };

  useEffect(() => {
    if (loading || !refreshRequested.current) return;
    refreshRequested.current = false;
    if (error) return;
    toast.success('Dados atualizados', `Última consulta às ${formatTime()}`);
  }, [loading, error, toast]);

  const periodLabel = formatPeriodLabel(from, to);

  const shownFrom = data?.de ?? from;
  const shownTo = data?.ate ?? to;
  const isCurrentMonth = shownFrom === thisMonth && shownTo === thisMonth;
  const shownLabel = formatPeriodLabel(shownFrom, shownTo);
  const periodNoun = shownFrom === shownTo ? 'mês' : 'período';

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Visão geral de ${periodLabel}`}
        actions={
          <>
            {isMobile ? <PeriodSwitcher /> : null}
            <Button variant="secondary" size="sm" icon={RefreshCw} onClick={handleRefresh} loading={loading}>
              {loading ? 'Atualizando' : 'Atualizar'}
            </Button>
          </>
        }
      />

      {error ? (
        <Card padding="none">
          <EmptyState
            title="Não foi possível carregar o resumo"
            description={error.message}
            action={
              <Button variant="secondary" icon={RefreshCw} onClick={reload}>
                Tentar de novo
              </Button>
            }
          />
        </Card>
      ) : !data ? (
        <DashboardSkeleton />
      ) : (
        <div className={`${styles.grid} refreshing`} aria-busy={loading}>
          <BalancePanel
            label={isCurrentMonth ? 'Saldo atual' : `Saldo no fim de ${capitalize(formatMonthLabel(shownTo))}`}
            balance={data.saldoAtual}
            delta={data.variacaoSaldo}
            income={data.receitasMes}
            expense={data.despesasMes}
            periodNoun={periodNoun}
            history={data.historicoSaldo}
          />

          <div className={styles.tiles}>
            <StatTile
              label={`Receitas do ${periodNoun}`}
              value={data.receitasMes}
              icon={TrendingUp}
              delta={data.variacaoReceitas}
            />
            <StatTile
              label={`Despesas do ${periodNoun}`}
              value={data.despesasMes}
              icon={TrendingDown}
              delta={data.variacaoDespesas}
            />
            <StatTile
              label="Investimentos"
              value={data.totalInvestido}
              icon={PiggyBank}
              delta={data.variacaoInvestimentos}
              footnote="Rentabilidade acumulada"
            />
            <StatTile
              label={shownFrom === shownTo ? 'Fatura do mês' : `Fatura de ${capitalize(formatMonthLabel(shownTo))}`}
              value={data.faturaAtual.total}
              icon={CreditCard}
              footnote={`${data.faturaAtual.nomeCartao} · vence em ${formatFullDate(data.faturaAtual.dataVencimento)}`}
            />
          </div>

          <div className={styles.charts}>
            <CashflowChart
              data={data.fluxoCaixa}
              description={
                shownFrom === shownTo
                  ? isCurrentMonth
                    ? 'Comparativo dos últimos seis meses'
                    : `Seis meses até ${capitalize(formatMonthLabel(shownTo))}`
                  : `Comparativo mês a mês de ${shownLabel}`
              }
            />
            <CategoryBreakdown data={data.gastoPorCategoria} periodNoun={periodNoun} />
          </div>

          <SpendingCalendar
            days={data.gastoDiario}
            description={
              shownFrom === shownTo
                ? isCurrentMonth
                  ? 'Cada dia dos últimos seis meses'
                  : `Cada dia dos seis meses até ${capitalize(formatMonthLabel(shownTo))}`
                : `Cada dia de ${shownLabel}`
            }
          />

          <RecentTransactions
            transactions={data.lancamentosRecentes}
            description={
              isCurrentMonth ? 'Movimentações mais recentes das suas contas' : `Movimentações de ${shownLabel}`
            }
          />
        </div>
      )}
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div className={styles.grid} aria-busy="true">
      <Card padding="none">
        <div className={styles.skeletonHero}>
          <div className={styles.skeletonColumn}>
            <Skeleton width={120} height={14} />
            <Skeleton width={260} height={44} radius="var(--radius-sm)" />
            <Skeleton width={180} height={14} />
          </div>
          <Skeleton height={200} radius="var(--radius-md)" />
        </div>
      </Card>

      <div className={styles.tiles}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} padding="sm">
            <Skeleton width={110} height={13} />
            <Skeleton width={150} height={26} className={styles.skeletonGap} />
          </Card>
        ))}
      </div>

      <div className={styles.charts}>
        <Card padding="none">
          <LoadingBlock lines={4} height={320} />
        </Card>
        <Card padding="none">
          <LoadingBlock lines={5} height={320} />
        </Card>
      </div>

      <Card padding="none">
        <LoadingBlock lines={3} height={200} />
      </Card>
    </div>
  );
}
