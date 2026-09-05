import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { Amount } from '@/components/common';
import { kindIcon, kindSign, kindTone, statusTone } from '@/components/transactions/meta';
import { Badge, Card, CardBody, CardHeader, TBody, THead, Table, TableWrapper, Td, Th, Tr } from '@/components/ui';
import { transactionStatusLabel } from '@/constants/transactions';
import { paths } from '@/routes/paths';
import type { Lancamento } from '@/types';
import { formatShortDate } from '@/utils/format';
import styles from './RecentTransactions.module.css';

interface RecentTransactionsProps {
  transactions: Lancamento[];
  description: string;
}

export function RecentTransactions({ transactions, description }: RecentTransactionsProps) {
  return (
    <Card padding="sm">
      <div className={styles.header}>
        <CardHeader title="Últimos lançamentos" description={description} />
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
              {transactions.map((transaction, index) => (
                <TransactionRow key={transaction.id} transaction={transaction} index={index} />
              ))}
            </TBody>
          </Table>
        </TableWrapper>
      </CardBody>
    </Card>
  );
}

interface TransactionRowProps {
  transaction: Lancamento;
  /** Posicao na lista: e o que escalona a entrada da linha. */
  index?: number;
}

export function TransactionRow({ transaction, index = 0 }: TransactionRowProps) {
  const Icon = kindIcon[transaction.tipo];

  // `list-item-in` e uma classe global (global.css): entrada escalonada por `--i`.
  return (
    <Tr interactive className="list-item-in" style={{ '--i': index } as CSSProperties}>
      <Td>
        <div className={styles.description}>
          <span className={`${styles.kindIcon} ${styles[transaction.tipo]}`} aria-hidden="true">
            <Icon size={15} strokeWidth={2} />
          </span>
          {transaction.descricao}
        </div>
      </Td>
      <Td>
        {transaction.categoria ? (
          <span className={styles.category}>
            <span
              className={styles.categoryDot}
              style={{ backgroundColor: `var(--chart-${transaction.categoria.tokenCor})` }}
              aria-hidden="true"
            />
            {transaction.categoria.nome}
          </span>
        ) : (
          <span className={styles.muted}>—</span>
        )}
      </Td>
      <Td className={styles.muted}>
        {transaction.nomeContaDestino ? `${transaction.nomeOrigem} → ${transaction.nomeContaDestino}` : transaction.nomeOrigem}
      </Td>
      <Td className={`${styles.muted} tabular`}>{formatShortDate(transaction.data)}</Td>
      <Td>
        <Badge tone={statusTone[transaction.situacao]} dot>
          {transactionStatusLabel[transaction.situacao]}
        </Badge>
      </Td>
      <Td numeric>
        <Amount
          value={transaction.valor}
          tone={kindTone[transaction.tipo]}
          size="sm"
          sign={kindSign[transaction.tipo]}
        />
      </Td>
    </Tr>
  );
}
