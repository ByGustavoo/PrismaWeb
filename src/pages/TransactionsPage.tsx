import { useCallback, useMemo, useState } from 'react';
import { ArrowLeftRight, CircleDot, Filter, Plus, Search, SlidersHorizontal, Tag, Wallet, X } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { TransactionRow } from '@/components/dashboard';
import { Amount } from '@/components/common';
import {
  Button,
  Card,
  EmptyState,
  Input,
  LoadingBlock,
  Modal,
  Select,
  TBody,
  THead,
  Table,
  TableWrapper,
  Th,
  Tr,
} from '@/components/ui';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/providers/ToastProvider';
import { transactionsService } from '@/services';
import { transactionKindPluralLabel, transactionStatusLabel } from '@/constants/transactions';
import { LOCALE } from '@/constants/app';
import type { Option, Transaction, TransactionKind } from '@/types';
import styles from './TransactionsPage.module.css';

interface TransactionsPageProps {
  kind?: TransactionKind;
  title: string;
  description: string;
}

/** Valor usado por todo select de filtro para "sem restricao". */
const ALL = 'all';

const kindOptions: Option[] = [
  { value: ALL, label: 'Todos' },
  { value: 'income', label: transactionKindPluralLabel.income },
  { value: 'expense', label: transactionKindPluralLabel.expense },
  { value: 'transfer', label: transactionKindPluralLabel.transfer },
];

const statusOptions: Option[] = [
  { value: ALL, label: 'Todas' },
  { value: 'paid', label: transactionStatusLabel.paid },
  { value: 'pending', label: transactionStatusLabel.pending },
  { value: 'scheduled', label: transactionStatusLabel.scheduled },
];

/** Opcoes derivadas dos proprios dados: a lista nunca oferece o que nao existe. */
function buildOptions(values: string[], allLabel: string): Option[] {
  const unique = [...new Set(values)].sort((a, b) => a.localeCompare(b, LOCALE));
  return [{ value: ALL, label: allLabel }, ...unique.map((item) => ({ value: item, label: item }))];
}

/** Aceita "1.200,50" e "1200.50" — o usuario digita do jeito brasileiro. */
function parseAmountInput(raw: string): number | undefined {
  const normalized = raw.trim().replace(/\./g, '').replace(',', '.');
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function TransactionsPage({ kind, title, description }: TransactionsPageProps) {
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState<string>(ALL);
  const [accountFilter, setAccountFilter] = useState<string>(ALL);
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL);
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const toast = useToast();

  const fetchTransactions = useCallback(
    (signal: AbortSignal) => transactionsService.list(kind ? { kind } : {}, signal),
    [kind],
  );

  const { data, loading, error } = useAsyncData(fetchTransactions, [kind]);

  const accountOptions = useMemo(
    () => buildOptions((data ?? []).map((item) => item.accountName), 'Todas'),
    [data],
  );

  const categoryOptions = useMemo(
    () => buildOptions((data ?? []).map((item) => item.category.name), 'Todas'),
    [data],
  );

  const transactions = useMemo(() => {
    if (!data) return [];

    const term = search.trim().toLowerCase();
    const min = parseAmountInput(minAmount);
    const max = parseAmountInput(maxAmount);

    return data.filter((item: Transaction) => {
      if (kindFilter !== ALL && item.kind !== kindFilter) return false;
      if (accountFilter !== ALL && item.accountName !== accountFilter) return false;
      if (categoryFilter !== ALL && item.category.name !== categoryFilter) return false;
      if (statusFilter !== ALL && item.status !== statusFilter) return false;
      if (min !== undefined && item.amount < min) return false;
      if (max !== undefined && item.amount > max) return false;

      if (!term) return true;
      return (
        item.description.toLowerCase().includes(term) ||
        item.category.name.toLowerCase().includes(term) ||
        item.accountName.toLowerCase().includes(term) ||
        transactionStatusLabel[item.status].toLowerCase().includes(term)
      );
    });
  }, [data, search, kindFilter, accountFilter, categoryFilter, statusFilter, minAmount, maxAmount]);

  const total = transactions.reduce(
    (sum, item) => sum + (item.kind === 'expense' ? -item.amount : item.amount),
    0,
  );

  const hasActiveFilters =
    search.trim() !== '' ||
    kindFilter !== ALL ||
    accountFilter !== ALL ||
    categoryFilter !== ALL ||
    statusFilter !== ALL ||
    minAmount !== '' ||
    maxAmount !== '';

  const clearFilters = () => {
    setSearch('');
    setKindFilter(ALL);
    setAccountFilter(ALL);
    setCategoryFilter(ALL);
    setStatusFilter(ALL);
    setMinAmount('');
    setMaxAmount('');
  };

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        actions={
          <>
            <Button variant="secondary" size="sm" icon={SlidersHorizontal} onClick={() => setShowFilters(true)}>
              Filtro por valor
            </Button>
            <Button
              size="sm"
              icon={Plus}
              onClick={() =>
                toast.notify({ title: 'O cadastro de lançamentos entra na próxima etapa', variant: 'info' })
              }
            >
              Novo lançamento
            </Button>
          </>
        }
      />

      <Card padding="sm">
        <div className={styles.toolbar}>
          <div className={styles.controls}>
            <Input
              className={styles.search}
              icon={Search}
              placeholder="Buscar lançamento"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Buscar lançamentos"
            />

            {kind ? null : (
              <Select
                className={styles.filter}
                icon={ArrowLeftRight}
                prefix="Tipo:"
                options={kindOptions}
                value={kindFilter}
                onChange={setKindFilter}
                aria-label="Filtrar por tipo"
              />
            )}
            <Select
              className={styles.filter}
              icon={Wallet}
              prefix="Conta:"
              options={accountOptions}
              value={accountFilter}
              onChange={setAccountFilter}
              aria-label="Filtrar por conta"
            />
            <Select
              className={styles.filter}
              icon={Tag}
              prefix="Categoria:"
              options={categoryOptions}
              value={categoryFilter}
              onChange={setCategoryFilter}
              aria-label="Filtrar por categoria"
            />
            <Select
              className={styles.filter}
              icon={CircleDot}
              prefix="Situação:"
              options={statusOptions}
              value={statusFilter}
              onChange={setStatusFilter}
              aria-label="Filtrar por situação"
            />

            {hasActiveFilters ? (
              <Button className={styles.clear} variant="ghost" size="sm" icon={X} onClick={clearFilters}>
                Limpar
              </Button>
            ) : null}
          </div>

          <div className={styles.summary}>
            <span className={styles.summaryLabel}>
              {transactions.length} {transactions.length === 1 ? 'lançamento' : 'lançamentos'}
            </span>
            <span className={styles.summaryTotal}>
              <span className={styles.summaryLabel}>Resultado do período</span>
              <Amount value={total} tone={total >= 0 ? 'positive' : 'negative'} sign="auto" />
            </span>
          </div>
        </div>

        {loading ? (
          <LoadingBlock lines={6} height={320} />
        ) : error ? (
          <EmptyState title="Não foi possível carregar os lançamentos" description={error.message} />
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={Filter}
            title="Nenhum lançamento encontrado"
            description={
              hasActiveFilters
                ? 'Nenhum lançamento atende aos filtros selecionados.'
                : 'Registre um novo lançamento para ver os dados aqui.'
            }
            action={
              hasActiveFilters ? (
                <Button variant="secondary" icon={X} onClick={clearFilters}>
                  Limpar filtros
                </Button>
              ) : null
            }
          />
        ) : (
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
        )}
      </Card>

      <Modal
        open={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filtrar por valor"
        description="Restringe o resultado a uma faixa de valores. Deixe em branco para não limitar."
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setMinAmount('');
                setMaxAmount('');
              }}
            >
              Limpar faixa
            </Button>
            <Button onClick={() => setShowFilters(false)}>Aplicar</Button>
          </>
        }
      >
        <div className={styles.amountRange}>
          <Input
            label="Valor mínimo"
            inputMode="decimal"
            placeholder="0,00"
            value={minAmount}
            onChange={(event) => setMinAmount(event.target.value)}
          />
          <Input
            label="Valor máximo"
            inputMode="decimal"
            placeholder="0,00"
            value={maxAmount}
            onChange={(event) => setMaxAmount(event.target.value)}
          />
        </div>
      </Modal>
    </>
  );
}
