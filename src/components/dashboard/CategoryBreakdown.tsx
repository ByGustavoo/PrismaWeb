import { Card, CardBody, CardHeader } from '@/components/ui';
import { Amount } from '@/components/common';
import type { CategorySpending } from '@/types';
import { formatPercent } from '@/utils/format';
import styles from './CategoryBreakdown.module.css';

interface CategoryBreakdownProps {
  data: CategorySpending[];
  /** "mês" ou "período", conforme o recorte escolhido no header. */
  periodNoun: string;
}

export function CategoryBreakdown({ data, periodNoun }: CategoryBreakdownProps) {
  const largest = data[0]?.share ?? 1;

  /*
   * O cartao para onde o conteudo acaba, em vez de esticar ate a altura do
   * grafico ao lado: com poucas categorias o excedente virava um vazio dentro
   * de uma moldura, que se le como bloco quebrado e nao como cartao curto.
   */
  return (
    <Card className={styles.card}>
      <CardHeader title="Gastos por categoria" description={`Participação no total de despesas do ${periodNoun}`} />
      <CardBody>
        {data.length === 0 ? (
          <p className={styles.empty}>Nenhuma despesa com categoria neste período.</p>
        ) : (
          <ul className={styles.list}>
            {data.map((entry) => (
              <li key={entry.category.id} className={styles.row}>
                <div className={styles.info}>
                  <span
                    className={styles.marker}
                    style={{ backgroundColor: `var(--chart-${entry.category.colorToken})` }}
                    aria-hidden="true"
                  />
                  <span className={styles.name}>{entry.category.name}</span>
                  <span className={`${styles.share} tabular`}>{formatPercent(entry.share * 100, 0)}</span>
                  <Amount value={entry.amount} size="sm" tone="muted" />
                </div>

                <div className={styles.track}>
                  <div
                    className={styles.bar}
                    style={{
                      width: `${(entry.share / largest) * 100}%`,
                      backgroundColor: `var(--chart-${entry.category.colorToken})`,
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
