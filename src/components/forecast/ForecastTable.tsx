import { Amount } from '@/components/common';
import { Card, CardBody, CardHeader, TBody, THead, Table, TableWrapper, Td, Th, Tr } from '@/components/ui';
import type { ForecastMonth } from '@/types';
import { capitalize, formatMonthLabel } from '@/utils/format';
import styles from './ForecastTable.module.css';

interface ForecastTableProps {
  months: ForecastMonth[];
  /** Mes de menor saldo projetado; ele ganha destaque na linha. */
  lowestMonth: string;
}

/**
 * A previsao aberta em suas partes. O grafico responde a forma da curva; esta
 * tabela responde de onde vem cada numero — sem ela, "R$ 6.480 de despesa" e
 * uma afirmacao que nao da para conferir nem contestar.
 */
export function ForecastTable({ months, lowestMonth }: ForecastTableProps) {
  return (
    <Card padding="none">
      <div className={styles.header}>
        <CardHeader
          title="Mês a mês"
          description="Cada despesa somada em sua própria linha. A faixa marca o mês de menor saldo."
        />
      </div>

      <CardBody className={styles.body}>
        <TableWrapper>
          <Table className={styles.table}>
            <THead>
              <Tr>
                <Th scope="col">Mês</Th>
                <Th scope="col" numeric>
                  Receitas
                </Th>
                <Th scope="col" numeric>
                  Recorrentes
                </Th>
                <Th scope="col" numeric>
                  Parcelas
                </Th>
                <Th scope="col" numeric>
                  Variável
                </Th>
                <Th scope="col" numeric>
                  Resultado
                </Th>
                <Th scope="col" numeric>
                  Saldo previsto
                </Th>
              </Tr>
            </THead>
            <TBody>
              {months.map((month) => (
                <Tr key={month.month} className={month.month === lowestMonth ? styles.lowest : undefined}>
                  <Td>
                    <span className={styles.month}>{capitalize(formatMonthLabel(month.month))}</span>
                    {/* A faixa lateral e so cor; quem le por audio precisa da mesma informacao. */}
                    {month.month === lowestMonth ? (
                      <span className="visually-hidden"> — mês de menor saldo previsto</span>
                    ) : null}
                  </Td>
                  <Td numeric>
                    <Amount value={month.income} size="sm" tone="positive" />
                  </Td>
                  <Td numeric>
                    <Amount value={month.recurring} size="sm" tone="muted" />
                  </Td>
                  <Td numeric>
                    <Amount value={month.installments} size="sm" tone="muted" />
                  </Td>
                  <Td numeric>
                    <Amount value={month.variable} size="sm" tone="muted" />
                  </Td>
                  <Td numeric>
                    <Amount value={month.net} size="sm" tone={month.net >= 0 ? 'positive' : 'negative'} sign="auto" />
                  </Td>
                  <Td numeric>
                    <Amount value={month.endingBalance} tone={month.endingBalance < 0 ? 'negative' : 'default'} />
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </TableWrapper>
      </CardBody>
    </Card>
  );
}
