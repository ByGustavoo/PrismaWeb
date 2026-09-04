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
  // O periodo vem do seletor no header, pelo PeriodProvider.
  const { period } = usePeriod();
  const { from, to } = period;
  const thisMonth = monthKeyFromOffset(0);
  // Onde o header nao comporta o seletor, ele desce para os controles da tela.
  const isMobile = useIsMobile();

  const fetchSummary = useCallback(
    (signal: AbortSignal) => dashboardService.getSummary({ from, to }, signal),
    [from, to],
  );
  const { data, loading, error, reload } = useAsyncData(fetchSummary, [from, to]);

  /*
   * Atualizar sem trocar o periodo devolve exatamente os mesmos numeros, entao
   * nada muda na tela e o clique parece nao ter surtido efeito — o spinner de
   * 16px no canto e pouco para responder a uma acao pedida de proposito. O
   * aviso confirma que a consulta aconteceu e diz quando. So o pedido explicito
   * gera aviso: a troca de periodo se explica sozinha pelos numeros novos.
   */
  const toast = useToast();
  const refreshRequested = useRef(false);

  const handleRefresh = () => {
    refreshRequested.current = true;
    reload();
  };

  useEffect(() => {
    if (loading || !refreshRequested.current) return;
    refreshRequested.current = false;
    // O erro ja toma a tela inteira; um aviso em cima dele seria redundante.
    if (error) return;
    toast.success('Dados atualizados', `Última consulta às ${formatTime()}`);
  }, [loading, error, toast]);

  // Fora do mes corrente, "atual" e "recente" deixam de ser verdade nos rotulos,
  // e num recorte de varios meses "do mes" tambem deixa.
  const periodLabel = formatPeriodLabel(from, to);

  /*
   * Os rotulos do conteudo seguem o periodo dos dados na tela, nao o que acabou
   * de ser escolhido no seletor. Enquanto a nova carga nao chega, os numeros
   * ainda sao os do recorte anterior — e "Saldo no fim de Agosto de 2026" sobre
   * o saldo de setembro seria uma frase falsa por meio segundo. O titulo da
   * pagina e a excecao: ele fica ao lado do botao que gira, e serve justamente
   * de eco da escolha.
   */
  const shownFrom = data?.from ?? from;
  const shownTo = data?.to ?? to;
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
            {/* O rotulo muda junto com o spinner: so o giro de um icone pequeno
                no canto da tela passa despercebido. */}
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
        /*
         * O esqueleto e so da primeira carga. Trocar de periodo mantem os numeros
         * anteriores na tela enquanto os novos vem: apagar o dashboard inteiro por
         * meio segundo a cada clique na seta custava mais atencao do que informava,
         * e desmontava os valores no exato momento em que eles deveriam rolar de um
         * numero ao outro. O spinner de "Atualizar" e o `aria-busy` dizem que ainda
         * esta carregando.
         */
        <div className={`${styles.grid} refreshing`} aria-busy={loading}>
          <BalancePanel
            label={isCurrentMonth ? 'Saldo atual' : `Saldo no fim de ${capitalize(formatMonthLabel(shownTo))}`}
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
              label={shownFrom === shownTo ? 'Fatura do mês' : `Fatura de ${capitalize(formatMonthLabel(shownTo))}`}
              value={data.currentInvoice.total}
              icon={CreditCard}
              footnote={`${data.currentInvoice.cardName} · vence em ${formatFullDate(data.currentInvoice.dueDate)}`}
            />
          </div>

          <div className={styles.charts}>
            <CashflowChart
              data={data.cashflow}
              description={
                shownFrom === shownTo
                  ? isCurrentMonth
                    ? 'Comparativo dos últimos seis meses'
                    : `Seis meses até ${capitalize(formatMonthLabel(shownTo))}`
                  : `Comparativo mês a mês de ${shownLabel}`
              }
            />
            <CategoryBreakdown data={data.spendingByCategory} periodNoun={periodNoun} />
          </div>

          {/* Mesma janela do grafico de entradas e saidas, e pelo mesmo motivo. */}
          <SpendingCalendar
            days={data.dailySpending}
            description={
              shownFrom === shownTo
                ? isCurrentMonth
                  ? 'Cada dia dos últimos seis meses'
                  : `Cada dia dos seis meses até ${capitalize(formatMonthLabel(shownTo))}`
                : `Cada dia de ${shownLabel}`
            }
          />

          <RecentTransactions
            transactions={data.recentTransactions}
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
