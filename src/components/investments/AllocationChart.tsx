import { useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { Amount } from '@/components/common';
import { Card, CardBody, CardHeader } from '@/components/ui';
import { investmentClassLabel } from '@/constants/investments';
import type { InvestmentAllocation, InvestmentClass } from '@/types';
import { cn } from '@/utils/cn';
import { formatPercent } from '@/utils/format';
import { classColor } from './meta';
import styles from './AllocationChart.module.css';

interface AllocationChartProps {
  data: InvestmentAllocation[];
  total: number;
}

/**
 * Distribuicao por tipo de ativo. A rosca — e nao a pizza cheia — porque o
 * centro vazio guarda o total: sem ele, quem le a proporcao teria de procurar o
 * patrimonio em outro bloco para saber de quanto sao aqueles 32%.
 *
 * A legenda e uma lista ao lado, nao a legenda embutida do Recharts: com oito
 * classes, os rotulos em volta do circulo se sobrepoem, e a lista ainda cabe o
 * valor em reais de cada fatia.
 */
export function AllocationChart({ data, total }: AllocationChartProps) {
  /*
   * O centro e o leitor da rosca, e por isso nao ha tooltip aqui. O painel
   * flutuante do Recharts nasce junto do cursor, que anda pela borda do anel:
   * ele cobria justamente a fatia sob inspecao e as vizinhas dela. Trazer a
   * leitura para o vazio do meio resolve as duas coisas de uma vez — nada
   * encobre o grafico, e o buraco da rosca deixa de ficar mudo durante o hover.
   */
  const [active, setActive] = useState<InvestmentClass | null>(null);
  const activeEntry = data.find((entry) => entry.assetClass === active) ?? null;

  return (
    <Card className={styles.card}>
      <CardHeader title="Distribuição por tipo" description="Participação de cada classe no patrimônio atual" />
      <CardBody className={styles.body}>
        <div className={styles.chart} onMouseLeave={() => setActive(null)}>
          <ResponsiveContainer width="100%" height={232}>
            <PieChart>
              <Pie
                data={data}
                dataKey="currentValue"
                nameKey="assetClass"
                innerRadius="64%"
                outerRadius="100%"
                paddingAngle={data.length > 1 ? 2 : 0}
                stroke="none"
                isAnimationActive={false}
                /*
                 * O Recharts poe a rosca na ordem de tabulacao. Sem rotulo, ela
                 * vira uma parada muda entre o botao da tela e o primeiro
                 * cartao — e o que ela mostra ja esta escrito na legenda ao
                 * lado, que e texto de verdade.
                 */
                rootTabIndex={-1}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.assetClass}
                    fill={classColor(entry.assetClass)}
                    /*
                     * Apagar as outras, em vez de crescer a ativa: com oito
                     * fatias e duas delas abaixo de 5%, mexer no raio muda a
                     * geometria inteira do anel a cada milimetro do cursor.
                     */
                    fillOpacity={active && active !== entry.assetClass ? 0.4 : 1}
                    onMouseEnter={() => setActive(entry.assetClass)}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/*
            O leitor mora no vazio da rosca. `aria-hidden` porque ele e eco
            visual: a legenda ao lado ja diz tudo isto em texto, e o patrimonio
            tambem esta na faixa de resumo no topo da tela.
          */}
          <div className={styles.center} aria-hidden="true">
            {activeEntry ? (
              <>
                <span className={styles.centerLabel}>{investmentClassLabel[activeEntry.assetClass]}</span>
                <Amount value={activeEntry.currentValue} size="md" />
                <span className={`${styles.centerShare} tabular`}>
                  {formatPercent(activeEntry.share * 100, 1)} do patrimônio
                </span>
              </>
            ) : (
              <>
                <span className={styles.centerLabel}>Patrimônio</span>
                <Amount value={total} size="md" />
              </>
            )}
          </div>
        </div>

        <ul className={styles.legend}>
          {data.map((entry) => (
            <li
              key={entry.assetClass}
              /*
               * A legenda acende a fatia, e nao so o contrario: com oito cores
               * proximas, achar no anel a fatia de "Outros" era o trabalho que
               * sobrava para o usuario. Vale ainda mais para as classes de 3%,
               * pequenas demais para acertar com o cursor.
               */
              className={cn(styles.item, active === entry.assetClass && styles.itemActive)}
              onMouseEnter={() => setActive(entry.assetClass)}
              onMouseLeave={() => setActive(null)}
            >
              <span
                className={styles.marker}
                style={{ backgroundColor: classColor(entry.assetClass) }}
                aria-hidden="true"
              />
              <span className={styles.name}>{investmentClassLabel[entry.assetClass]}</span>
              <span className={`${styles.share} tabular`}>{formatPercent(entry.share * 100, 0)}</span>
              <Amount className={styles.value} value={entry.currentValue} size="sm" tone="muted" />
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
