import { Link } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, Repeat } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Amount } from '@/components/common';
import { Badge, Card, CardBody, CardHeader, TBody, THead, Table, TableWrapper, Td, Th, Tr } from '@/components/ui';
import type { BadgeTone } from '@/components/ui';
import { paths } from '@/routes/paths';
import type { Transaction, TransactionKind, TransactionStatus } from '@/types';
import { formatShortDate } from '@/utils/format';
import styles from './RecentTransactions.module.css';

const kindIcon: Record<TransactionKind, LucideIcon> = {
  income: ArrowUpRight,
  expense: ArrowDownLeft,
  transfer: Repeat,
};

const statusLabel: Record<TransactionStatus, string> = {
  paid: 'Concluido',
  pending: 'Pendente',
  scheduled: 'Agendado',
};

const statusTone: Record<TransactionStatus, BadgeTone> = {
  paid: 'neutral',
  pending: 'warning',
  scheduled: 'accent',
};

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <Card padding="sm">
      <div className={styles.header}>
        <CardHeader title="Ultimos lancamentos" description="Movimentacoes mais recentes das suas contas" />
        <Link className={styles.link} to={paths.transactions}>
          Ver todos
        </Link>
      </div>

      <CardBody>
        <TableWrapper>
          <Table>
            <THead>
              <Tr>
                <Th>Descricao</Th>
                <Th>Categoria</Th>
                <Th>Conta</Th>
                <Th>Data</Th>
                <Th>Situacao</Th>
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
  const tone = transaction.kind === 'income' ? 'positive' : transaction.kind === 'expense' ? 'negative' : 'muted';
  const sign = transaction.kind === 'income' ? 'plus' : transaction.kind === 'expense' ? 'minus' : 'none';

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
        <span className={styles.category}>
          <span
            className={styles.categoryDot}
            style={{ backgroundColor: `var(--chart-${transaction.category.colorToken})` }}
            aria-hidden="true"
          />
          {transaction.category.name}
        </span>
      </Td>
      <Td className={styles.muted}>{transaction.accountName}</Td>
      <Td className={`${styles.muted} tabular`}>{formatShortDate(transaction.date)}</Td>
      <Td>
        <Badge tone={statusTone[transaction.status]}>{statusLabel[transaction.status]}</Badge>
      </Td>
      <Td numeric>
        <Amount value={transaction.amount} tone={tone} size="sm" sign={sign} />
      </Td>
    </Tr>
  );
}
