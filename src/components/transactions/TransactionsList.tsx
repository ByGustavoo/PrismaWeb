import { ArrowDown, ArrowRight, ArrowUp, Trash2 } from 'lucide-react';
import { Amount } from '@/components/common';
import { Badge, Select } from '@/components/ui';
import { transactionKindLabel, transactionStatusLabel } from '@/constants/transactions';
import type { Option, Lancamento } from '@/types';
import { formatShortDate } from '@/utils/format';
import { kindIcon, kindSign, kindTone, statusTone } from './meta';
import type { SortDirection, SortField } from './query';
import styles from './TransactionsList.module.css';

interface TransactionsListProps {
  transactions: Lancamento[];
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  showCategory: boolean;
  onEdit: (transaction: Lancamento) => void;
  onDelete: (transaction: Lancamento) => void;
}

const sortOptions: Option[] = [
  { value: 'date', label: 'Data' },
  { value: 'description', label: 'Descrição' },
  { value: 'amount', label: 'Valor' },
];

export function TransactionsList({
  transactions,
  sortField,
  sortDirection,
  onSort,
  showCategory,
  onEdit,
  onDelete,
}: TransactionsListProps) {
  const ascending = sortDirection === 'asc';

  return (
    <div className={styles.wrapper}>
      <div className={styles.sortBar}>
        <span className={styles.sortLabel} aria-hidden="true">
          Ordenar por
        </span>
        <Select
          className={styles.sortSelect}
          options={sortOptions}
          value={sortField}
          onChange={(field) => onSort(field as SortField)}
          aria-label="Ordenar por"
        />
        <button
          type="button"
          className={styles.direction}
          onClick={() => onSort(sortField)}
          aria-label={ascending ? 'Ordem crescente. Inverter para decrescente' : 'Ordem decrescente. Inverter para crescente'}
        >
          {ascending ? <ArrowUp size={16} strokeWidth={2} /> : <ArrowDown size={16} strokeWidth={2} />}
        </button>
      </div>

      <ul className={styles.list}>
        {transactions.map((transaction) => {
          const Icon = kindIcon[transaction.tipo];

          return (
            <li key={transaction.id} className={styles.card}>
              <button type="button" className={styles.open} onClick={() => onEdit(transaction)}>
                <span className="visually-hidden">Editar {transaction.descricao}</span>
              </button>

              <div className={styles.content}>
                <div className={styles.top}>
                  <span className={`${styles.kindIcon} ${styles[transaction.tipo]}`} aria-hidden="true">
                    <Icon size={15} strokeWidth={2} />
                  </span>

                  <span className={styles.text}>
                    <span className={styles.description}>{transaction.descricao}</span>
                    <span className={styles.meta}>
                      <span className="tabular">{formatShortDate(transaction.data)}</span>
                      <span className={styles.separator} aria-hidden="true">
                        ·
                      </span>
                      {transaction.nomeContaDestino ? (
                        <span className={styles.route}>
                          {transaction.nomeOrigem}
                          <ArrowRight size={12} strokeWidth={2} aria-hidden="true" />
                          {transaction.nomeContaDestino}
                        </span>
                      ) : (
                        transaction.nomeOrigem
                      )}
                    </span>
                  </span>

                  <Amount
                    value={transaction.valor}
                    tone={kindTone[transaction.tipo]}
                    sign={kindSign[transaction.tipo]}
                  />
                </div>

                {transaction.observacoes ? <p className={styles.notes}>{transaction.observacoes}</p> : null}

                <div className={styles.bottom}>
                  <span className={styles.tags}>
                    {showCategory && transaction.categoria ? (
                      <span className={styles.category}>
                        <span
                          className={styles.categoryDot}
                          style={{ backgroundColor: `var(--chart-${transaction.categoria.tokenCor})` }}
                          aria-hidden="true"
                        />
                        {transaction.categoria.nome}
                      </span>
                    ) : null}
                    <Badge tone={statusTone[transaction.situacao]} dot>
                      {transactionStatusLabel[transaction.situacao]}
                    </Badge>
                    {transaction.tipo === 'TRANSFERENCIA' ? (
                      <span className={styles.kindLabel}>{transactionKindLabel[transaction.tipo]}</span>
                    ) : null}
                  </span>

                  <button
                    type="button"
                    className={styles.delete}
                    aria-label={`Excluir ${transaction.descricao}`}
                    onClick={() => onDelete(transaction)}
                  >
                    <Trash2 size={16} strokeWidth={2} />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
