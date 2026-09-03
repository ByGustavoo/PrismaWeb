import { ArrowDown, ArrowRight, ArrowUp, Trash2 } from 'lucide-react';
import { Amount } from '@/components/common';
import { Badge, Select } from '@/components/ui';
import { transactionKindLabel, transactionStatusLabel } from '@/constants/transactions';
import type { Option, Transaction } from '@/types';
import { formatShortDate } from '@/utils/format';
import { kindIcon, kindSign, kindTone, statusTone } from './meta';
import type { SortDirection, SortField } from './query';
import styles from './TransactionsList.module.css';

interface TransactionsListProps {
  transactions: Transaction[];
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  /** Escondida em Transferencias, onde nenhum lancamento tem categoria. */
  showCategory: boolean;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}

const sortOptions: Option[] = [
  { value: 'date', label: 'Data' },
  { value: 'description', label: 'Descrição' },
  { value: 'amount', label: 'Valor' },
];

/**
 * A mesma lista de lancamentos em cartoes, para as larguras em que a tabela de
 * oito colunas nao cabe. Rolar 1000px de lado para chegar ao valor — o dado
 * mais importante de cada linha — nao e leitura, e busca.
 *
 * Cada cartao inteiro abre a edicao: o botao que cobre a area fica atras do
 * conteudo, e so o excluir sobe acima dele, para que a acao destrutiva continue
 * exigindo um toque proprio.
 */
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
          const Icon = kindIcon[transaction.kind];

          return (
            <li key={transaction.id} className={styles.card}>
              <button type="button" className={styles.open} onClick={() => onEdit(transaction)}>
                <span className="visually-hidden">Editar {transaction.description}</span>
              </button>

              <div className={styles.content}>
                <div className={styles.top}>
                  <span className={`${styles.kindIcon} ${styles[transaction.kind]}`} aria-hidden="true">
                    <Icon size={15} strokeWidth={2} />
                  </span>

                  <span className={styles.text}>
                    <span className={styles.description}>{transaction.description}</span>
                    <span className={styles.meta}>
                      <span className="tabular">{formatShortDate(transaction.date)}</span>
                      <span className={styles.separator} aria-hidden="true">
                        ·
                      </span>
                      {transaction.toAccountName ? (
                        <span className={styles.route}>
                          {transaction.accountName}
                          <ArrowRight size={12} strokeWidth={2} aria-hidden="true" />
                          {transaction.toAccountName}
                        </span>
                      ) : (
                        transaction.accountName
                      )}
                    </span>
                  </span>

                  <Amount
                    value={transaction.amount}
                    tone={kindTone[transaction.kind]}
                    sign={kindSign[transaction.kind]}
                  />
                </div>

                {transaction.notes ? <p className={styles.notes}>{transaction.notes}</p> : null}

                <div className={styles.bottom}>
                  <span className={styles.tags}>
                    {showCategory && transaction.category ? (
                      <span className={styles.category}>
                        <span
                          className={styles.categoryDot}
                          style={{ backgroundColor: `var(--chart-${transaction.category.colorToken})` }}
                          aria-hidden="true"
                        />
                        {transaction.category.name}
                      </span>
                    ) : null}
                    <Badge tone={statusTone[transaction.status]} dot>
                      {transactionStatusLabel[transaction.status]}
                    </Badge>
                    {/*
                      Receita e despesa ja se anunciam pelo "+" e pelo "-" do
                      valor; escrever o tipo de novo so empurrava a linha para
                      uma segunda quebra. A transferencia, que sai sem sinal,
                      continua nomeada.
                    */}
                    {transaction.kind === 'transfer' ? (
                      <span className={styles.kindLabel}>{transactionKindLabel[transaction.kind]}</span>
                    ) : null}
                  </span>

                  <button
                    type="button"
                    className={styles.delete}
                    aria-label={`Excluir ${transaction.description}`}
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
