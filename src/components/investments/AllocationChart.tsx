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

export function AllocationChart({ data, total }: AllocationChartProps) {
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
                rootTabIndex={-1}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.assetClass}
                    fill={classColor(entry.assetClass)}
                    fillOpacity={active && active !== entry.assetClass ? 0.4 : 1}
                    onMouseEnter={() => setActive(entry.assetClass)}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

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
