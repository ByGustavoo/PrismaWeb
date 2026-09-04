import { useCallback } from 'react';
import { LineChart } from 'lucide-react';
import { Amount, SummaryBar } from '@/components/common';
import { ForecastChart, ForecastList, ForecastTable } from '@/components/forecast';
import { PageHeader } from '@/components/layout';
import { Button, Card, EmptyState, LoadingBlock } from '@/components/ui';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useIsCompact } from '@/hooks/useMediaQuery';
import { forecastService } from '@/services';
import { capitalize, formatMonthLabel } from '@/utils/format';
import styles from './ForecastPage.module.css';

export function ForecastPage() {
  const compact = useIsCompact();

  const fetchData = useCallback((signal: AbortSignal) => forecastService.getSummary(undefined, signal), []);
  const { data, loading, error, reload } = useAsyncData(fetchData);

  const lastMonth = data?.months[data.months.length - 1];

  return (
    <>
      <PageHeader
        title="Previsão financeira"
        description="Como o saldo caminha nos próximos meses se o padrão atual se mantiver"
      />

      {loading && !data ? (
        <div className={styles.stack} aria-busy="true">
          <Card padding="none">
            <LoadingBlock lines={2} height={92} />
          </Card>
          <Card padding="none">
            <LoadingBlock lines={3} height={300} />
          </Card>
        </div>
      ) : error ? (
        <Card padding="none">
          <EmptyState
            title="Não foi possível carregar a previsão"
            description={error.message}
            action={
              <Button variant="secondary" onClick={reload}>
                Tentar de novo
              </Button>
            }
          />
        </Card>
      ) : !data || data.months.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={LineChart}
            title="Ainda não há histórico suficiente"
            description="A previsão usa a média dos últimos meses fechados, as despesas recorrentes e as parcelas já assumidas. Cadastre lançamentos para que ela apareça."
          />
        </Card>
      ) : (
        <div className={`${styles.stack} refreshing`} aria-busy={loading}>
          <SummaryBar
            items={[
              {
                label: 'Saldo de hoje',
                value: <Amount value={data.startingBalance} countUp />,
                hint: 'Ponto de partida da projeção',
              },
              {
                label: lastMonth ? `Saldo em ${capitalize(formatMonthLabel(lastMonth.month))}` : 'Saldo previsto',
                value: (
                  <Amount
                    value={data.endingBalance}
                    size="lg"
                    tone={data.endingBalance < 0 ? 'negative' : 'default'}
                    animate
                    countUp
                  />
                ),
                hint: `Ao fim dos ${data.months.length} meses projetados`,
              },
              {
                label: 'Resultado médio',
                value: (
                  <Amount
                    value={data.averageNet}
                    tone={data.averageNet >= 0 ? 'positive' : 'negative'}
                    sign="auto"
                    countUp
                  />
                ),
                hint: 'Quanto sobra (ou falta) por mês, em média',
              },
              {
                label: 'Mês mais apertado',
                value: (
                  <Amount
                    value={data.lowest.balance}
                    tone={data.lowest.balance < 0 ? 'negative' : 'default'}
                    countUp
                  />
                ),
                hint: capitalize(formatMonthLabel(data.lowest.month)),
              },
            ]}
          />

          <ForecastChart data={data.months} />

          {compact ? (
            <ForecastList months={data.months} lowestMonth={data.lowest.month} />
          ) : (
            <ForecastTable months={data.months} lowestMonth={data.lowest.month} />
          )}

          {/*
            A projecao e uma suposicao, e dizer isso e parte do produto: um
            numero apresentado como certeza vira decisao errada quando erra.
          */}
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
