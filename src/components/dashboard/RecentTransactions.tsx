import { Link } from 'react-router-dom';
import { Amount } from '@/components/common';
import { kindIcon, kindSign, kindTone, statusTone } from '@/components/transactions/meta';
import { Badge, Card, CardBody, CardHeader, TBody, THead, Table, TableWrapper, Td, Th, Tr } from '@/components/ui';
import { transactionStatusLabel } from '@/constants/transactions';
import { paths } from '@/routes/paths';
import type { Transaction } from '@/types';
import { formatShortDate } from '@/utils/format';
import styles from './RecentTransactions.module.css';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <Card padding="sm">
      <div className={styles.header}>
        <CardHeader title="Últimos lançamentos" description="Movimentações mais recentes das suas contas" />
        <Link className={styles.link} to={paths.transactions}>
          Ver todos
        </Link>
      </div>

      <CardBody>
        <TableWrapper>
          <Table>
            <THead>
              <Tr>
                <Th>Descrição</Th>
                <Th>Categoria</Th>
                <Th>Conta</Th>
                <Th>Data</Th>
                <Th>Situação</Th>
                <Th numeric>Valor</Th>
              </Tr>
            </THead>
            <TBody>
              {transactions.map((transaction) => (
                <TransactionRow key={transaction.id} transaction={transaction} />
              ))}
            </TBody>
          </Table>
        </TableWrapper>
      </CardBody>
    </Card>
  );
}

export function TransactionRow({ transaction }: { transaction: Transaction }) {
  const Icon = kindIcon[transaction.kind];

  return (
    <Tr interactive>
      <Td>
        <div className={styles.description}>
          <span className={`${styles.kindIcon} ${styles[transaction.kind]}`} aria-hidden="true">
            <Icon size={15} strokeWidth={2} />
          </span>
          {transaction.description}
        </div>
      </Td>
      <Td>
        {transaction.category ? (
          <span className={styles.category}>
            <span
              className={styles.categoryDot}
              style={{ backgroundColor: `var(--chart-${transaction.category.colorToken})` }}
              aria-hidden="true"
            />
            {transaction.category.name}
          </span>
        ) : (
          <span className={styles.muted}>—</span>
        )}
      </Td>
      <Td className={styles.muted}>
        {transaction.toAccountName ? `${transaction.accountName} → ${transaction.toAccountName}` : transaction.accountName}
      </Td>
      <Td className={`${styles.muted} tabular`}>{formatShortDate(transaction.date)}</Td>
      <Td>
        <Badge tone={statusTone[transaction.status]} dot>
          {transactionStatusLabel[transaction.status]}
        </Badge>
      </Td>
      <Td numeric>
        <Amount
          value={transaction.amount}
          tone={kindTone[transaction.kind]}
          size="sm"
          sign={kindSign[transaction.kind]}
        />
      </Td>
    </Tr>
  );
}
