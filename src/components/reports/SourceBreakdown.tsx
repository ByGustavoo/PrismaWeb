import { CreditCard, Wallet } from 'lucide-react';
import { Amount } from '@/components/common';
import { Card, CardBody, CardHeader } from '@/components/ui';
import type { SourceSpending } from '@/types';
import { formatPercent } from '@/utils/format';
import styles from './SourceBreakdown.module.css';

interface SourceBreakdownProps {
  data: SourceSpending[];
}

/**
 * De onde saiu o dinheiro no periodo. Cada origem tem sua barra medida contra a
 * maior, e nao contra o total: com uma conta respondendo por 70% do gasto, as
 * demais virariam tracinhos indistinguiveis numa escala absoluta.
 */
export function SourceBreakdown({ data }: SourceBreakdownProps) {
  const largest = data[0]?.share ?? 1;

  return (
    <Card className={styles.card}>
      <CardHeader title="Gastos por conta e cartão" description="Participação de cada origem no total de despesas" />
      <CardBody>
        {data.length === 0 ? (
          <p className={styles.empty}>Nenhuma despesa registrada neste período.</p>
        ) : (
          <ul className={styles.list}>
            {data.map((entry) => {
              const Icon = entry.group === 'CARTAO' ? CreditCard : Wallet;

              return (
                <li key={entry.id} className={styles.row}>
                  <div className={styles.info}>
                    <span className={styles.iconBox} aria-hidden="true">
                      <Icon size={14} strokeWidth={2} />
                    </span>
                    <span className={styles.name}>{entry.name}</span>
                    <span className={`${styles.share} tabular`}>{formatPercent(entry.share * 100, 0)}</span>
                    <Amount value={entry.amount} size="sm" tone="muted" />
                  </div>

                  <div className={styles.track}>
                    <div className={styles.bar} style={{ width: `${(entry.share / largest) * 100}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
