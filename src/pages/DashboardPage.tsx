import { useCallback } from 'react';
import { CreditCard, PiggyBank, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { BalancePanel, CashflowChart, CategoryBreakdown, RecentTransactions, StatTile } from '@/components/dashboard';
import { Button, Card, EmptyState, LoadingBlock, Skeleton } from '@/components/ui';
import { useAsyncData } from '@/hooks/useAsyncData';
import { dashboardService } from '@/services';
import { capitalize, formatFullDate, formatMonthLabel } from '@/utils/format';
import styles from './DashboardPage.module.css';

export function DashboardPage() {
  const fetchSummary = useCallback((signal: AbortSignal) => dashboardService.getSummary(signal), []);
  const { data, loading, error, reload } = useAsyncData(fetchSummary);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={
          data
            ? `Visão geral de ${capitalize(formatMonthLabel(data.month))}`
            : 'Visão geral das suas finanças'
        }
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
            balance={data.currentBalance}
            delta={data.balanceDelta}
            income={data.monthIncome}
            expense={data.monthExpense}
            history={data.balanceHistory}
          />

          <div className={styles.tiles}>
            <StatTile label="Receitas do mês" value={data.monthIncome} icon={TrendingUp} delta={data.incomeDelta} />
            <StatTile
              label="Despesas do mês"
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
              label="Fatura atual"
              value={data.currentInvoice.total}
              icon={CreditCard}
              footnote={`${data.currentInvoice.cardName} · vence em ${formatFullDate(data.currentInvoice.dueDate)}`}
            />
          </div>

          <div className={styles.charts}>
            <CashflowChart data={data.cashflow} />
            <CategoryBreakdown data={data.spendingByCategory} />
          </div>

          <RecentTransactions transactions={data.recentTransactions} />
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
