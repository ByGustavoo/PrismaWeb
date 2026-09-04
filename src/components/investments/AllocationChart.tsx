import { useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Amount } from '@/components/common';
import { Card, CardBody, CardHeader } from '@/components/ui';
import { investmentClassLabel } from '@/constants/investments';
import type { InvestmentAllocation } from '@/types';
import { cn } from '@/utils/cn';
import { formatCurrency, formatPercent } from '@/utils/format';
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
   * O total no centro sai de cena enquanto o cursor esta sobre uma fatia. O
   * tooltip nasce junto do cursor, que anda pela borda do anel, e cai
   * justamente sobre o centro: com os dois visiveis, um texto atravessava o
   * outro e nenhum se lia. Ou se le o total, ou se le a fatia — nunca os dois
   * empilhados.
   */
  const [hovering, setHovering] = useState(false);

  return (
    <Card className={styles.card}>
      <CardHeader title="Distribuição por tipo" description="Participação de cada classe no patrimônio atual" />
      <CardBody className={styles.body}>
        <div className={styles.chart}>
          <ResponsiveContainer width="100%" height={196}>
            <PieChart>
              <Pie
                data={data}
                dataKey="currentValue"
                nameKey="assetClass"
                innerRadius="66%"
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
                onMouseEnter={() => setHovering(true)}
                onMouseLeave={() => setHovering(false)}
              >
                {data.map((entry) => (
                  <Cell key={entry.assetClass} fill={classColor(entry.assetClass)} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  const slice = active ? (payload?.[0]?.payload as InvestmentAllocation | undefined) : undefined;
                  if (!slice) return null;

                  return (
                    <div className={styles.tooltip}>
                      <span className={styles.tooltipName}>{investmentClassLabel[slice.assetClass]}</span>
                      <span className={`${styles.tooltipValue} tabular`}>{formatCurrency(slice.currentValue)}</span>
                      <span className={`${styles.tooltipShare} tabular`}>{formatPercent(slice.share * 100, 1)}</span>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* O total mora no vazio da rosca; ver o comentario do componente. */}
          <div className={cn(styles.center, hovering && styles.centerHidden)} aria-hidden="true">
            <span className={styles.centerLabel}>Patrimônio</span>
            <Amount value={total} size="md" />
          </div>
        </div>

        <ul className={styles.legend}>
          {data.map((entry) => (
            <li key={entry.assetClass} className={styles.item}>
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
