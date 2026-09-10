import { Card, CardBody, CardHeader } from '@/components/ui';
import { Amount } from '@/components/common';
import type { GastoPorCategoria } from '@/types';
import { formatPercent } from '@/utils/format';
import styles from './CategoryBreakdown.module.css';

interface CategoryBreakdownProps {
  data: GastoPorCategoria[];
  periodNoun: string;
  title?: string;
  description?: string;
  emptyLabel?: string;
}

export function CategoryBreakdown({
  data,
  periodNoun,
  title = 'Gastos por categoria',
  description,
  emptyLabel = 'Nenhuma despesa com categoria neste período.',
}: CategoryBreakdownProps) {
  const largest = data[0]?.participacao ?? 1;

  return (
    <Card className={styles.card}>
      <CardHeader
        title={title}
        description={description ?? `Participação no total de despesas do ${periodNoun}`}
      />
      <CardBody>
        {data.length === 0 ? (
          <p className={styles.empty}>{emptyLabel}</p>
        ) : (
          <ul className={styles.list}>
            {data.map((entry) => (
              <li key={entry.categoria.id} className={styles.row}>
                <div className={styles.info}>
                  <span
                    className={styles.marker}
                    style={{ backgroundColor: `var(--chart-${entry.categoria.tokenCor})` }}
                    aria-hidden="true"
                  />
                  <span className={styles.name}>{entry.categoria.nome}</span>
                  <span className={`${styles.share} tabular`}>{formatPercent(entry.participacao * 100, 0)}</span>
                  <Amount value={entry.valor} size="sm" tone="muted" />
                </div>

                <div className={styles.track}>
                  <div
                    className={styles.bar}
                    style={{
                      width: `${(entry.participacao / largest) * 100}%`,
                      backgroundColor: `var(--chart-${entry.categoria.tokenCor})`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
