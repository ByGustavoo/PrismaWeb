import { useCallback, useState } from 'react';
import { ChartPie } from 'lucide-react';
import { Amount, DeltaIndicator, SummaryBar } from '@/components/common';
import { CashflowChart, CategoryBreakdown } from '@/components/dashboard';
import { PageHeader } from '@/components/layout';
import { BalanceTrendChart, NetWorthChart, ReportRangePicker, SourceBreakdown } from '@/components/reports';
import { Button, Card, EmptyState, LoadingBlock } from '@/components/ui';
import { reportRangeOf } from '@/constants/reports';
import type { ReportRangeKey } from '@/constants/reports';
import { useAsyncData } from '@/hooks/useAsyncData';
import { reportsService } from '@/services';
import type { ReportRange } from '@/types';
import { formatNumericDate } from '@/utils/format';
import styles from './ReportsPage.module.css';

/** Recorte de abertura: o mes corrente responde a pergunta mais frequente. */
const INITIAL_KEY = 'month' satisfies Exclude<ReportRangeKey, 'custom'>;

export function ReportsPage() {
  const [rangeKey, setRangeKey] = useState<ReportRangeKey>(INITIAL_KEY);
  const [range, setRange] = useState<ReportRange>(() => reportRangeOf(INITIAL_KEY));

  /*
   * Escolher um atalho troca as datas; escolher "Personalizado" mantem as do
   * recorte anterior. Zerar o intervalo ali deixaria a tela vazia no exato
   * momento em que o usuario quer ajustar o que ja estava vendo.
   */
  const handleSelect = (key: ReportRangeKey) => {
    setRangeKey(key);
    if (key !== 'custom') setRange(reportRangeOf(key));
  };

  const handleRangeChange = (next: ReportRange) => {
    setRangeKey('custom');
    setRange(next);
  };

  const fetchData = useCallback(
    (signal: AbortSignal) => reportsService.getSummary(range, signal),
    [range.from, range.to],
  );

  const { data, loading, error, reload } = useAsyncData(fetchData, [range.from, range.to]);

  return (
    <>
      <PageHeader
        title="Relatórios"
        description={`Análise de ${formatNumericDate(range.from)} a ${formatNumericDate(range.to)}`}
        actions={
          <ReportRangePicker
            value={rangeKey}
            range={range}
            onSelect={handleSelect}
            onRangeChange={handleRangeChange}
          />
        }
      />

      {/* O esqueleto e so da primeira carga; trocar o recorte mantem os numeros na tela. */}
      {loading && !data ? (
        <div className={styles.stack} aria-busy="true">
          <Card padding="none">
            <LoadingBlock lines={2} height={92} />
          </Card>
          <div className={styles.grid}>
            <Card padding="none">
              <LoadingBlock lines={3} height={260} />
            </Card>
            <Card padding="none">
              <LoadingBlock lines={3} height={260} />
            </Card>
          </div>
        </div>
      ) : error ? (
        <Card padding="none">
          <EmptyState
            title="Não foi possível carregar o relatório"
            description={error.message}
            action={
              <Button variant="secondary" onClick={reload}>
                Tentar de novo
              </Button>
            }
          />
        </Card>
      ) : !data ? null : data.transactionCount === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={ChartPie}
            title="Nenhum lançamento neste período"
            description="Escolha um recorte maior ou outro intervalo para ver os gráficos deste relatório."
          />
        </Card>
      ) : (
        <div className={`${styles.stack} refreshing`} aria-busy={loading}>
          <SummaryBar
            items={[
              {
                label: 'Receitas',
                value: <Amount value={data.income} tone="positive" animate countUp />,
                hint: 'No período selecionado',
              },
              {
                label: 'Despesas',
                value: <Amount value={data.expense} tone="negative" animate countUp />,
                hint: 'Transferências não entram na conta',
              },
              {
                label: 'Resultado',
                value: (
                  <Amount
                    value={data.net}
                    size="lg"
                    tone={data.net >= 0 ? 'positive' : 'negative'}
                    sign="auto"
                    animate
                    countUp
                  />
                ),
                hint: 'Receitas menos despesas',
              },
              {
                label: 'Lançamentos',
                value: <span className={styles.count}>{data.transactionCount}</span>,
                hint: 'Registrados no período',
              },
            ]}
          />

          {/*
            As duas variacoes ficam juntas, abaixo da faixa: comparadas com o
            periodo anterior de mesma duracao, elas respondem "melhorou ou
            piorou?" — a pergunta que a faixa sozinha nao responde.
          */}
          <div className={styles.deltas}>
            <span className={styles.delta}>
              <span className={styles.deltaLabel}>Receitas</span>
              <DeltaIndicator delta={data.incomeDelta} caption="em relação ao período anterior" />
            </span>
            <span className={styles.delta}>
              <span className={styles.deltaLabel}>Despesas</span>
              <DeltaIndicator delta={data.expenseDelta} caption="em relação ao período anterior" />
            </span>
          </div>

          {/*
            A barra engorda quando ha poucos baldes: um recorte de quatro dias
            desenhado com a espessura de doze meses vira quatro tracinhos numa
            faixa vazia.
          */}
          <CashflowChart
            data={data.cashflow}
            title="Receitas e despesas"
            description="Entradas e saídas agrupadas dentro do período"
            maxBarSize={data.cashflow.length <= 6 ? 56 : 32}
          />

          <div className={styles.grid}>
            <CategoryBreakdown data={data.expenseByCategory} periodNoun="período" />
            <CategoryBreakdown
              data={data.incomeByCategory}
              periodNoun="período"
              title="Receitas por categoria"
              description="Participação no total de receitas do período"
              emptyLabel="Nenhuma receita com categoria neste período."
            />
          </div>

          <div className={styles.grid}>
            <SourceBreakdown data={data.expenseBySource} />
            <BalanceTrendChart data={data.balanceHistory} />
          </div>

          <NetWorthChart data={data.netWorth} />
        </div>
      )}
    </>
  );
}
