import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Plus } from 'lucide-react';
import { Amount } from '@/components/common';
import { PageHeader } from '@/components/layout';
import {
  TransactionFilters,
  TransactionFormModal,
  TransactionsTable,
  TransferFormModal,
  applyQuery,
  emptyQuery,
  hasActiveFilters,
  initialSortDirection,
  netTotal,
} from '@/components/transactions';
import type { SortField, TransactionQuery } from '@/components/transactions';
import { Button, Card, ConfirmDialog, EmptyState, LoadingBlock } from '@/components/ui';
import { transactionKindLabel } from '@/constants/transactions';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/providers/ToastProvider';
import { NEW_TRANSACTION_PARAM, newTransactionValues } from '@/routes/paths';
import { accountsService, categoriesService, transactionsService } from '@/services';
import type { Transaction, TransactionKind, TransactionPayload } from '@/types';
import { formatFullDate } from '@/utils/format';
import styles from './TransactionsPage.module.css';

interface TransactionsPageProps {
  /** Ausente na tela "Lançamentos", que mostra todos os tipos. */
  kind?: TransactionKind;
  title: string;
  description: string;
}

/** Qual formulario abrir quando a tela mostra todos os tipos. */
type FormMode = 'income' | 'expense' | 'transfer';

export function TransactionsPage({ kind, title, description }: TransactionsPageProps) {
  const [query, setQuery] = useState<TransactionQuery>(emptyQuery);
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [removing, setRemoving] = useState<Transaction | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  // `/lancamentos?novo=despesa` abre o cadastro direto. O parametro sai da URL
  // assim que e lido, para que voltar no historico nao reabra o formulario.
  useEffect(() => {
    const requested = searchParams.get(NEW_TRANSACTION_PARAM);
    if (!requested) return;

    const mode = newTransactionValues[requested as keyof typeof newTransactionValues];
    if (mode) {
      setEditing(null);
      setFormMode(mode);
    }
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  const fetchTransactions = useCallback(
    (signal: AbortSignal) => transactionsService.list(kind ? { kind } : {}, signal),
    [kind],
  );

  const fetchCatalog = useCallback(
    (signal: AbortSignal) =>
      Promise.all([categoriesService.list(undefined, signal), accountsService.listSources(signal)]),
    [],
  );

  const { data, loading, error, reload } = useAsyncData(fetchTransactions, [kind]);
  const { data: catalog } = useAsyncData(fetchCatalog);

  const categories = catalog?.[0] ?? [];
  const sources = catalog?.[1] ?? [];

  const source = useMemo(() => data ?? [], [data]);
  const transactions = useMemo(() => applyQuery(source, query), [source, query]);
  const total = netTotal(transactions);
  const filtered = hasActiveFilters(query);

  const patchQuery = (patch: Partial<TransactionQuery>) => setQuery((current) => ({ ...current, ...patch }));

  const clearFilters = () =>
    setQuery((current) => ({
      ...emptyQuery,
      // Ordenacao e preferencia de leitura, nao filtro: sobrevive ao "Limpar".
      sortField: current.sortField,
      sortDirection: current.sortDirection,
    }));

  /** Reclicar a mesma coluna inverte; trocar de coluna assume a direcao natural dela. */
  const handleSort = (field: SortField) =>
    setQuery((current) =>
      current.sortField === field
        ? { ...current, sortDirection: current.sortDirection === 'asc' ? 'desc' : 'asc' }
        : { ...current, sortField: field, sortDirection: initialSortDirection[field] },
    );

  const closeForm = () => {
    setFormMode(null);
    setEditing(null);
  };

  const openCreate = (mode: FormMode) => {
    setEditing(null);
    setFormMode(mode);
  };

  const openEdit = (transaction: Transaction) => {
    setEditing(transaction);
    setFormMode(transaction.kind);
  };

  const handleSubmit = async (payload: TransactionPayload) => {
    setSaving(true);
    const noun = transactionKindLabel[payload.kind];

    try {
      if (editing) {
        await transactionsService.update(editing.id, payload);
        toast.success(`${noun} atualizada`, payload.description);
      } else {
        await transactionsService.create(payload);
        toast.success(`${noun} cadastrada`, payload.description);
      }
      closeForm();
      reload();
    } catch (submitError) {
      toast.error(
        'Não foi possível salvar o lançamento',
        submitError instanceof Error ? submitError.message : undefined,
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!removing) return;
    setSaving(true);

    try {
      await transactionsService.remove(removing.id);
      toast.success('Lançamento excluído', removing.description);
      setRemoving(null);
      reload();
    } catch (deleteError) {
      toast.error(
        'Não foi possível excluir o lançamento',
        deleteError instanceof Error ? deleteError.message : undefined,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        actions={
          kind ? (
            <Button size="sm" icon={Plus} onClick={() => openCreate(kind)}>
              Nova {transactionKindLabel[kind].toLowerCase()}
            </Button>
          ) : (
            <>
              <Button variant="secondary" size="sm" icon={Plus} onClick={() => openCreate('income')}>
                Receita
              </Button>
              <Button variant="secondary" size="sm" icon={Plus} onClick={() => openCreate('expense')}>
                Despesa
              </Button>
              <Button size="sm" icon={Plus} onClick={() => openCreate('transfer')}>
                Transferência
              </Button>
            </>
          )
        }
      />

      <Card padding="sm">
        <div className={styles.toolbar}>
          <TransactionFilters
            query={query}
            onChange={patchQuery}
            onClear={clearFilters}
            source={source}
            showKindFilter={!kind}
            showCategoryFilter={kind !== 'transfer'}
          />

          <div className={styles.summary}>
            <span className={styles.summaryLabel}>
              {transactions.length} {transactions.length === 1 ? 'lançamento' : 'lançamentos'}
            </span>
            {kind === 'transfer' ? (
              <span className={styles.summaryLabel}>Transferências não entram no resultado do período</span>
            ) : (
              <span className={styles.summaryTotal}>
                <span className={styles.summaryLabel}>Resultado do período</span>
                <Amount value={total} tone={total >= 0 ? 'positive' : 'negative'} sign="auto" />
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <LoadingBlock lines={6} height={320} />
        ) : error ? (
          <EmptyState
            title="Não foi possível carregar os lançamentos"
            description={error.message}
            action={
              <Button variant="secondary" onClick={reload}>
                Tentar de novo
              </Button>
            }
          />
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={Filter}
            title={filtered ? 'Nenhum lançamento encontrado' : 'Nada registrado por aqui ainda'}
            description={
              filtered
                ? 'Nenhum lançamento atende aos filtros selecionados.'
                : 'Cadastre o primeiro lançamento para acompanhar suas movimentações.'
            }
            action={
              filtered ? (
                <Button variant="secondary" onClick={clearFilters}>
                  Limpar filtros
                </Button>
              ) : (
                <Button icon={Plus} onClick={() => openCreate(kind ?? 'expense')}>
                  Novo lançamento
                </Button>
              )
            }
          />
        ) : (
          <TransactionsTable
            transactions={transactions}
            sortField={query.sortField}
            sortDirection={query.sortDirection}
            onSort={handleSort}
            showCategory={kind !== 'transfer'}
            onEdit={openEdit}
            onDelete={setRemoving}
          />
        )}
      </Card>

      <TransactionFormModal
        open={formMode === 'income' || formMode === 'expense'}
        kind={formMode === 'income' ? 'income' : 'expense'}
        transaction={editing}
        categories={categories}
        sources={sources}
        saving={saving}
        onSubmit={handleSubmit}
        onClose={closeForm}
      />

      <TransferFormModal
        open={formMode === 'transfer'}
        transaction={editing}
        sources={sources}
        saving={saving}
        onSubmit={handleSubmit}
        onClose={closeForm}
      />

      <ConfirmDialog
        open={removing !== null}
        title="Excluir lançamento"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        loading={saving}
        onConfirm={handleDelete}
        onCancel={() => setRemoving(null)}
      >
        {removing ? (
          <>
            <strong className={styles.confirmTitle}>{removing.description}</strong>
            <span className={styles.confirmMeta}>
              {transactionKindLabel[removing.kind]} · {formatFullDate(removing.date)} · {removing.accountName}
            </span>
            <Amount value={removing.amount} tone={removing.kind === 'expense' ? 'negative' : 'default'} />
          </>
        ) : null}
      </ConfirmDialog>
    </>
  );
}
