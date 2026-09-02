import { useCallback, useMemo, useState } from 'react';
import { Filter, Plus, Search, SlidersHorizontal } from 'lucide-react';
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
import type { Option, TransactionKind } from '@/types';
import styles from './TransactionsPage.module.css';

interface TransactionsPageProps {
  kind?: TransactionKind;
  title: string;
  description: string;
}

const accountOptions: Option[] = [
  { value: 'all', label: 'Todas as contas' },
  { value: 'checking', label: 'Conta corrente' },
  { value: 'savings', label: 'Reserva de emergencia' },
  { value: 'card', label: 'Cartoes' },
];

export function TransactionsPage({ kind, title, description }: TransactionsPageProps) {
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const toast = useToast();

  const fetchTransactions = useCallback(
    (signal: AbortSignal) => transactionsService.list(kind ? { kind } : {}, signal),
    [kind],
  );

  const { data, loading, error } = useAsyncData(fetchTransactions, [kind]);

  const transactions = useMemo(() => {
    if (!data) return [];
    const term = search.trim().toLowerCase();
    if (!term) return data;
    return data.filter(
      (item) =>
        item.description.toLowerCase().includes(term) ||
        item.category.name.toLowerCase().includes(term) ||
        item.accountName.toLowerCase().includes(term),
    );
  }, [data, search]);

  const total = transactions.reduce(
    (sum, item) => sum + (item.kind === 'expense' ? -item.amount : item.amount),
    0,
  );

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        actions={
          <>
            <Button variant="secondary" size="sm" icon={SlidersHorizontal} onClick={() => setShowFilters(true)}>
              Filtros
            </Button>
            <Button
              size="sm"
              icon={Plus}
              onClick={() => toast.notify({ title: 'Cadastro de lancamentos entra na proxima etapa', variant: 'info' })}
            >
              Novo lancamento
            </Button>
          </>
        }
      />

      <Card padding="sm">
        <div className={styles.toolbar}>
          <Input
            className={styles.search}
            icon={Search}
            placeholder="Buscar por descricao, categoria ou conta"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Buscar lancamentos"
          />
          <div className={styles.total}>
            <span>Resultado do periodo</span>
            <Amount value={total} tone={total >= 0 ? 'positive' : 'negative'} sign="auto" />
          </div>
        </div>

        {loading ? (
          <LoadingBlock lines={6} height={320} />
        ) : error ? (
          <EmptyState title="Nao foi possivel carregar os lancamentos" description={error.message} />
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={Filter}
            title="Nenhum lancamento encontrado"
            description="Ajuste a busca ou registre um novo lancamento para ver os dados aqui."
          />
        ) : (
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
        )}
      </Card>

      <Modal
        open={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filtrar lancamentos"
        description="Os filtros avancados serao ligados a API na proxima etapa."
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowFilters(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setShowFilters(false);
                toast.success('Filtros aplicados', 'Por enquanto os dados vem da camada de mocks.');
              }}
            >
              Aplicar filtros
            </Button>
          </>
        }
      >
        <div className={styles.filters}>
          <Select label="Conta" options={accountOptions} defaultValue="all" />
          <Input label="Valor minimo" type="number" placeholder="0,00" />
          <Input label="Valor maximo" type="number" placeholder="0,00" />
        </div>
      </Modal>
    </>
  );
}
