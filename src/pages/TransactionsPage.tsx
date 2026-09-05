import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Plus } from 'lucide-react';
import { Amount } from '@/components/common';
import { PageHeader } from '@/components/layout';
import {
  TransactionFilters,
  TransactionFormModal,
  TransactionsList,
  TransactionsTable,
  TransferFormModal,
  ViewToggle,
  applyQuery,
  emptyQuery,
  hasActiveFilters,
  initialSortDirection,
  netTotal,
} from '@/components/transactions';
import type { SortField, TransactionQuery, TransactionsView } from '@/components/transactions';
import { Button, Card, ConfirmDialog, EmptyState, LoadingBlock } from '@/components/ui';
import { TRANSACTIONS_VIEW_STORAGE_KEY } from '@/constants/app';
import { transactionKindLabel } from '@/constants/transactions';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useIsCompact } from '@/hooks/useMediaQuery';
import { useToast } from '@/providers/ToastProvider';
import {
  ACCOUNT_PARAM,
  CATEGORY_PARAM,
  EDIT_TRANSACTION_PARAM,
  NEW_TRANSACTION_PARAM,
  SEARCH_PARAM,
  newTransactionValues,
} from '@/routes/paths';
import { accountsService, categoriesService, transactionsService } from '@/services';
import type { Lancamento, TipoLancamento, LancamentoPayload } from '@/types';
import { formatFullDate } from '@/utils/format';
import styles from './TransactionsPage.module.css';

interface TransactionsPageProps {
  /** Ausente na tela "Lançamentos", que mostra todos os tipos. */
  kind?: TipoLancamento;
  title: string;
  description: string;
}

/** Qual formulario abrir quando a tela mostra todos os tipos. */
type FormMode = 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA';

export function TransactionsPage({ kind, title, description }: TransactionsPageProps) {
  const [query, setQuery] = useState<TransactionQuery>(emptyQuery);
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [editing, setEditing] = useState<Lancamento | null>(null);
  const [removing, setRemoving] = useState<Lancamento | null>(null);
  const [pendingEditId, setPendingEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  // A tabela de oito colunas so cabe no desktop; abaixo disso a lista vira cartoes.
  const isCompact = useIsCompact();
  const [preferredView, setPreferredView] = useLocalStorage<TransactionsView>(
    TRANSACTIONS_VIEW_STORAGE_KEY,
    'table',
  );
  /*
   * A largura tem a ultima palavra: onde a tabela nao cabe, preferir tabela
   * devolveria uma tela que rola 1000px de lado ate o valor. A escolha fica
   * guardada e volta a valer assim que houver espaco para ela.
   */
  const view = isCompact ? 'cards' : preferredView;

  // A URL e o canal de entrada da tela: `?novo=despesa` abre o cadastro,
  // `?editar=<id>` abre a edicao e `?busca`, `?categoria` e `?conta` chegam da
  // busca do header ja como filtro. Os parametros saem da URL assim que sao
  // lidos, para que voltar no historico nao reabra nem refiltre nada.
  useEffect(() => {
    const requestedForm = searchParams.get(NEW_TRANSACTION_PARAM);
    const requestedEdit = searchParams.get(EDIT_TRANSACTION_PARAM);
    const search = searchParams.get(SEARCH_PARAM);
    const categoryId = searchParams.get(CATEGORY_PARAM);
    const accountId = searchParams.get(ACCOUNT_PARAM);

    if (!requestedForm && !requestedEdit && !search && !categoryId && !accountId) return;

    const mode = requestedForm
      ? newTransactionValues[requestedForm as keyof typeof newTransactionValues]
      : undefined;

    if (mode) {
      setEditing(null);
      setFormMode(mode);
    }

    if (requestedEdit) setPendingEditId(requestedEdit);

    // Cada chegada da busca e uma consulta nova: um filtro que sobrou da
    // navegacao anterior estreitaria o resultado que o usuario acabou de pedir.
    if (search || categoryId || accountId) {
      setQuery((current) => ({
        ...emptyQuery,
        sortField: current.sortField,
        sortDirection: current.sortDirection,
        ...(search ? { search } : {}),
        ...(categoryId ? { categoryId } : {}),
        ...(accountId ? { accountId } : {}),
      }));
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

  // A edicao pedida pela URL so pode abrir depois que a lista chega do service.
  useEffect(() => {
    if (!pendingEditId || !data) return;

    const found = data.find((item) => item.id === pendingEditId);
    setPendingEditId(null);

    if (found) {
      setEditing(found);
      setFormMode(found.tipo);
    }
  }, [pendingEditId, data]);

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

  const openEdit = (transaction: Lancamento) => {
    setEditing(transaction);
    setFormMode(transaction.tipo);
  };

  const handleSubmit = async (payload: LancamentoPayload) => {
    setSaving(true);
    const noun = transactionKindLabel[payload.tipo];

    try {
      if (editing) {
        await transactionsService.update(editing.id, payload);
        toast.success(`${noun} atualizada`, payload.descricao);
      } else {
        await transactionsService.create(payload);
        toast.success(`${noun} cadastrada`, payload.descricao);
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
      toast.success('Lançamento excluído', removing.descricao);
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
              <Button variant="secondary" size="sm" icon={Plus} onClick={() => openCreate('RECEITA')}>
                Receita
              </Button>
              <Button variant="secondary" size="sm" icon={Plus} onClick={() => openCreate('DESPESA')}>
                Despesa
              </Button>
              <Button size="sm" icon={Plus} onClick={() => openCreate('TRANSFERENCIA')}>
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
            showCategoryFilter={kind !== 'TRANSFERENCIA'}
          />

          <div className={styles.summary}>
            <div className={styles.summaryCount}>
              <span className={styles.summaryLabel}>
                {transactions.length} {transactions.length === 1 ? 'lançamento' : 'lançamentos'}
              </span>

              {/* Onde so uma das duas formas cabe, escolher entre elas nao existe. */}
              {isCompact ? null : <ViewToggle value={preferredView} onChange={setPreferredView} />}
            </div>
            {kind === 'TRANSFERENCIA' ? (
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
                <Button icon={Plus} onClick={() => openCreate(kind ?? 'DESPESA')}>
                  Novo lançamento
                </Button>
              )
            }
          />
        ) : view === 'cards' ? (
          <TransactionsList
            transactions={transactions}
            sortField={query.sortField}
            sortDirection={query.sortDirection}
            onSort={handleSort}
            showCategory={kind !== 'TRANSFERENCIA'}
            onEdit={openEdit}
            onDelete={setRemoving}
          />
        ) : (
          <TransactionsTable
            transactions={transactions}
            sortField={query.sortField}
            sortDirection={query.sortDirection}
            onSort={handleSort}
            showCategory={kind !== 'TRANSFERENCIA'}
            onEdit={openEdit}
            onDelete={setRemoving}
          />
        )}
      </Card>

      <TransactionFormModal
        open={formMode === 'RECEITA' || formMode === 'DESPESA'}
        kind={formMode === 'RECEITA' ? 'RECEITA' : 'DESPESA'}
        transaction={editing}
        categories={categories}
        sources={sources}
        saving={saving}
        onSubmit={handleSubmit}
        onClose={closeForm}
      />

      <TransferFormModal
        open={formMode === 'TRANSFERENCIA'}
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
            <strong className={styles.confirmTitle}>{removing.descricao}</strong>
            <span className={styles.confirmMeta}>
              {transactionKindLabel[removing.tipo]} · {formatFullDate(removing.data)} · {removing.nomeOrigem}
            </span>
            <Amount value={removing.valor} tone={removing.tipo === 'DESPESA' ? 'negative' : 'default'} />
          </>
        ) : null}
      </ConfirmDialog>
    </>
  );
}
