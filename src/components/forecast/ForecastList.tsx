import { Amount } from '@/components/common';
import { Card, CardBody, CardHeader } from '@/components/ui';
import type { ForecastMonth } from '@/types';
import { capitalize, formatMonthLabel } from '@/utils/format';
import styles from './ForecastList.module.css';

interface ForecastListProps {
  months: ForecastMonth[];
  lowestMonth: string;
}

/**
 * A mesma previsao em cartoes, para as larguras em que a tabela de sete colunas
 * so caberia rolando de lado — e rolar ate o saldo previsto, que e o dado mais
 * importante da linha, nao e leitura.
 */
export function ForecastList({ months, lowestMonth }: ForecastListProps) {
  return (
    <Card padding="none">
      <div className={styles.header}>
        <CardHeader
          title="Mês a mês"
          description="Cada despesa somada em sua própria linha. A faixa marca o mês de menor saldo."
        />
      </div>

      <ul className={styles.list}>
        {months.map((month) => (
          <li key={month.month} className={month.month === lowestMonth ? styles.lowest : undefined}>
            <CardBody className={styles.item}>
              <div className={styles.top}>
                <span className={styles.month}>
                  {capitalize(formatMonthLabel(month.month))}
                  {/* A faixa lateral e so cor; quem le por audio precisa da mesma informacao. */}
                  {month.month === lowestMonth ? (
                    <span className="visually-hidden"> — mês de menor saldo previsto</span>
                  ) : null}
                </span>
                <span className={styles.balance}>
                  <span className={styles.balanceLabel}>Saldo previsto</span>
                  <Amount value={month.endingBalance} tone={month.endingBalance < 0 ? 'negative' : 'default'} />
                </span>
              </div>

              <dl className={styles.lines}>
                <div className={styles.line}>
                  <dt>Receitas</dt>
                  <dd>
                    <Amount value={month.income} size="sm" tone="positive" />
                  </dd>
                </div>
                <div className={styles.line}>
                  <dt>Recorrentes</dt>
                  <dd>
                    <Amount value={month.recurring} size="sm" tone="muted" />
                  </dd>
                </div>
                <div className={styles.line}>
                  <dt>Parcelas</dt>
                  <dd>
                    <Amount value={month.installments} size="sm" tone="muted" />
                  </dd>
                </div>
                <div className={styles.line}>
                  <dt>Variável</dt>
                  <dd>
                    <Amount value={month.variable} size="sm" tone="muted" />
                  </dd>
                </div>
                <div className={`${styles.line} ${styles.result}`}>
                  <dt>Resultado</dt>
                  <dd>
                    <Amount
                      value={month.net}
                      size="sm"
                      tone={month.net >= 0 ? 'positive' : 'negative'}
                      sign="auto"
                    />
                  </dd>
                </div>
              </dl>
            </CardBody>
          </li>
        ))}
      </ul>
    </Card>
  );
}
