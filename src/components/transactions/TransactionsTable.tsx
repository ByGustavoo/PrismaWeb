import { ArrowRight, ArrowUpDown, ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react';
import { Amount } from '@/components/common';
import { Badge, Button, TBody, THead, Table, TableWrapper, Td, Th, Tr } from '@/components/ui';
import { transactionKindLabel, transactionStatusLabel } from '@/constants/transactions';
import type { Transaction } from '@/types';
import { formatShortDate } from '@/utils/format';
import { kindIcon, kindSign, kindTone, statusTone } from './meta';
import type { SortDirection, SortField } from './query';
import styles from './TransactionsTable.module.css';

interface TransactionsTableProps {
  transactions: Transaction[];
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  /** Escondida em Transferencias, onde a coluna seria um traco em toda linha. */
  showCategory: boolean;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}

interface SortableHeaderProps {
  field: SortField;
  label: string;
  numeric?: boolean;
  active: boolean;
  direction: SortDirection;
  onSort: (field: SortField) => void;
}

/**
 * Cabecalho que ordena. A seta so aparece colorida na coluna ativa; nas outras
 * fica em cinza claro, sinalizando que sao clicaveis sem competir com a atual.
 */
function SortableHeader({ field, label, numeric = false, active, direction, onSort }: SortableHeaderProps) {
  const Icon = !active ? ArrowUpDown : direction === 'asc' ? ChevronUp : ChevronDown;

  return (
    <Th numeric={numeric} aria-sort={active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button
        type="button"
        className={`${styles.sortButton} ${active ? styles.sortActive : ''}`}
        onClick={() => onSort(field)}
      >
        {label}
        <Icon size={13} strokeWidth={2.5} aria-hidden="true" />
      </button>
    </Th>
  );
}

export function TransactionsTable({
  transactions,
  sortField,
  sortDirection,
  onSort,
  onEdit,
  onDelete,
  showCategory,
}: TransactionsTableProps) {
  return (
    <TableWrapper>
      <Table className={styles.table}>
        <THead>
          <Tr>
            <SortableHeader
              field="date"
              label="Data"
              active={sortField === 'date'}
              direction={sortDirection}
              onSort={onSort}
            />
            <SortableHeader
              field="description"
              label="Descrição"
              active={sortField === 'description'}
              direction={sortDirection}
              onSort={onSort}
            />
            {showCategory ? <Th>Categoria</Th> : null}
            <Th>Conta/cartão</Th>
            <Th>Tipo</Th>
            <SortableHeader
              field="amount"
              label="Valor"
              numeric
              active={sortField === 'amount'}
              direction={sortDirection}
              onSort={onSort}
            />
            <Th>Situação</Th>
            <Th numeric>Ações</Th>
          </Tr>
        </THead>

        <TBody>
          {transactions.map((transaction) => {
            const Icon = kindIcon[transaction.kind];

            return (
              <Tr key={transaction.id} interactive onClick={() => onEdit(transaction)}>
                <Td className={`${styles.muted} tabular`}>{formatShortDate(transaction.date)}</Td>

                <Td>
                  <span className={styles.description}>{transaction.description}</span>
                  {transaction.notes ? <span className={styles.notes}>{transaction.notes}</span> : null}
                </Td>

                {showCategory ? (
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
                      <span className={styles.empty}>—</span>
                    )}
                  </Td>
                ) : null}

                <Td className={styles.muted}>
                  {transaction.toAccountName ? (
                    <span className={styles.route}>
                      {transaction.accountName}
                      <ArrowRight size={13} strokeWidth={2} aria-hidden="true" />
                      {transaction.toAccountName}
                    </span>
                  ) : (
                    transaction.accountName
                  )}
                </Td>

                <Td>
                  <span className={`${styles.kind} ${styles[transaction.kind]}`}>
                    <Icon size={14} strokeWidth={2} aria-hidden="true" />
                    {transactionKindLabel[transaction.kind]}
                  </span>
                </Td>

                <Td numeric>
                  <Amount
                    value={transaction.amount}
                    tone={kindTone[transaction.kind]}
                    size="sm"
                    sign={kindSign[transaction.kind]}
                  />
                </Td>

                <Td>
                  <Badge tone={statusTone[transaction.status]} dot>
                    {transactionStatusLabel[transaction.status]}
                  </Badge>
                </Td>

                {/* O clique nos botoes nao pode disparar tambem a edicao da linha. */}
                <Td numeric onClick={(event) => event.stopPropagation()}>
                  <div className={styles.actions}>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Pencil}
                      aria-label={`Editar ${transaction.description}`}
                      onClick={() => onEdit(transaction)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      className={styles.delete}
                      aria-label={`Excluir ${transaction.description}`}
                      onClick={() => onDelete(transaction)}
                    />
                  </div>
                </Td>
              </Tr>
            );
          })}
        </TBody>
      </Table>
    </TableWrapper>
  );
}
