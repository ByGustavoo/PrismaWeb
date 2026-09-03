import { useCallback } from 'react';
import { CreditCard, PiggyBank, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { BalancePanel, CashflowChart, CategoryBreakdown, RecentTransactions, StatTile } from '@/components/dashboard';
import { Button, Card, EmptyState, LoadingBlock, Skeleton } from '@/components/ui';
import { useAsyncData } from '@/hooks/useAsyncData';
import { usePeriod } from '@/providers/PeriodProvider';
import { dashboardService } from '@/services';
import { monthKeyFromOffset } from '@/utils/date';
import { capitalize, formatFullDate, formatMonthLabel, formatPeriodLabel } from '@/utils/format';
import styles from './DashboardPage.module.css';

export function DashboardPage() {
  // O periodo vem do seletor no header, pelo PeriodProvider.
  const { period } = usePeriod();
  const { from, to } = period;
  const thisMonth = monthKeyFromOffset(0);

  const fetchSummary = useCallback(
    (signal: AbortSignal) => dashboardService.getSummary({ from, to }, signal),
    [from, to],
  );
  const { data, loading, error, reload } = useAsyncData(fetchSummary, [from, to]);

  // Fora do mes corrente, "atual" e "recente" deixam de ser verdade nos rotulos,
  // e num recorte de varios meses "do mes" tambem deixa.
  const isCurrentMonth = from === thisMonth && to === thisMonth;
  const periodLabel = formatPeriodLabel(from, to);
  const periodNoun = from === to ? 'mês' : 'período';

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Visão geral de ${periodLabel}`}
        actions={
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={reload} loading={loading}>
            Atualizar
          </Button>
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
      ) : loading || !data ? (
        <DashboardSkeleton />
      ) : (
        <div className={styles.grid}>
          <BalancePanel
            label={isCurrentMonth ? 'Saldo atual' : `Saldo no fim de ${capitalize(formatMonthLabel(to))}`}
            balance={data.currentBalance}
            delta={data.balanceDelta}
            income={data.monthIncome}
            expense={data.monthExpense}
            periodNoun={periodNoun}
            history={data.balanceHistory}
          />

          <div className={styles.tiles}>
            <StatTile
              label={`Receitas do ${periodNoun}`}
              value={data.monthIncome}
              icon={TrendingUp}
              delta={data.incomeDelta}
            />
            <StatTile
              label={`Despesas do ${periodNoun}`}
              value={data.monthExpense}
              icon={TrendingDown}
              delta={data.expenseDelta}
            />
            <StatTile
              label="Investimentos"
              value={data.investmentsTotal}
              icon={PiggyBank}
              delta={data.investmentsDelta}
              footnote="Rentabilidade acumulada"
            />
            <StatTile
              label={from === to ? 'Fatura do mês' : `Fatura de ${capitalize(formatMonthLabel(to))}`}
              value={data.currentInvoice.total}
              icon={CreditCard}
              footnote={`${data.currentInvoice.cardName} · vence em ${formatFullDate(data.currentInvoice.dueDate)}`}
            />
          </div>

          <div className={styles.charts}>
            <CashflowChart
              data={data.cashflow}
              description={
                from === to
                  ? isCurrentMonth
                    ? 'Comparativo dos últimos seis meses'
                    : `Seis meses até ${capitalize(formatMonthLabel(to))}`
                  : `Comparativo mês a mês de ${periodLabel}`
              }
            />
            <CategoryBreakdown data={data.spendingByCategory} periodNoun={periodNoun} />
          </div>

          <RecentTransactions
            transactions={data.recentTransactions}
            description={
              isCurrentMonth ? 'Movimentações mais recentes das suas contas' : `Movimentações de ${periodLabel}`
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
    </div>
  );
}
