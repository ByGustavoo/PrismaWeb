import { useCallback, useMemo, useState } from 'react';
import { Plus, Repeat } from 'lucide-react';
import { Amount, SummaryBar } from '@/components/common';
import { PageHeader } from '@/components/layout';
import { RecurringCard, RecurringFormModal } from '@/components/recurring';
import { Button, Card, ConfirmDialog, EmptyState, LoadingBlock } from '@/components/ui';
import { RECURRING_DUE_SOON_DAYS, recurrenceLabel } from '@/constants/recurring';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/providers/ToastProvider';
import { accountsService, categoriesService, recurringService } from '@/services';
import type { RecurringExpense, RecurringPayload } from '@/types';
import { capitalize, formatDueLabel } from '@/utils/format';
import styles from './RecurringPage.module.css';

export function RecurringPage() {
  const [editing, setEditing] = useState<RecurringExpense | null>(null);
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState<RecurringExpense | null>(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const fetchData = useCallback(
    (signal: AbortSignal) =>
      Promise.all([
        recurringService.getSummary(signal),
        categoriesService.list('expense', signal),
        accountsService.listSources(signal),
      ]),
    [],
  );

  const { data, loading, error, reload } = useAsyncData(fetchData);

  const summary = data?.[0];
  const categories = useMemo(() => data?.[1] ?? [], [data]);
  const sources = useMemo(() => data?.[2] ?? [], [data]);

  const items = useMemo(() => summary?.items ?? [], [summary]);
  const activeCount = useMemo(() => items.filter((item) => item.status === 'active').length, [items]);
  const nextDue = useMemo(() => items.find((item) => item.status === 'active'), [items]);

  const formOpen = creating || editing !== null;

  const closeForm = () => {
    setCreating(false);
    setEditing(null);
  };

  const toPayload = (expense: RecurringExpense): RecurringPayload => ({
    description: expense.description,
    amount: expense.amount,
    categoryId: expense.category?.id,
    frequency: expense.frequency,
    nextDueDate: expense.nextDueDate,
    accountId: expense.accountId,
    status: expense.status,
    notes: expense.notes,
  });

  const handleSubmit = async (payload: RecurringPayload) => {
    setSaving(true);

    try {
      if (editing) {
        await recurringService.update(editing.id, payload);
        toast.success('Despesa atualizada', payload.description);
      } else {
        await recurringService.create(payload);
        toast.success('Despesa recorrente cadastrada', `${recurrenceLabel[payload.frequency]} · ${payload.description}`);
      }
      closeForm();
      reload();
    } catch (submitError) {
      toast.error('Não foi possível salvar a despesa', submitError instanceof Error ? submitError.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  /** Pausar e retomar sem abrir o formulario: e a operacao mais comum da tela. */
  const handleToggle = async (expense: RecurringExpense) => {
    const status = expense.status === 'active' ? 'paused' : 'active';
    setSaving(true);

    try {
      await recurringService.update(expense.id, { ...toPayload(expense), status });
      toast.success(status === 'paused' ? 'Despesa pausada' : 'Despesa retomada', expense.description);
      reload();
    } catch (toggleError) {
      toast.error('Não foi possível alterar a despesa', toggleError instanceof Error ? toggleError.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!removing) return;
    setSaving(true);

    try {
      await recurringService.remove(removing.id);
      toast.success('Despesa recorrente excluída', removing.description);
      setRemoving(null);
      reload();
    } catch (deleteError) {
      toast.error('Não foi possível excluir a despesa', deleteError instanceof Error ? deleteError.message : undefined);
      setRemoving(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Despesas recorrentes"
        description="Assinaturas e contas fixas, com o que elas custam por mês e quando vencem"
        actions={
          <Button size="sm" icon={Plus} onClick={() => setCreating(true)}>
            Nova despesa
          </Button>
        }
      />

      {/* O esqueleto e so da primeira carga; pausar ou editar mantem a lista na tela. */}
      {loading && !data ? (
        <div className={styles.stack} aria-busy="true">
          <Card padding="none">
            <LoadingBlock lines={2} height={92} />
          </Card>
          <Card padding="none">
            <LoadingBlock lines={5} height={280} />
          </Card>
        </div>
      ) : error ? (
        <Card padding="none">
          <EmptyState
            title="Não foi possível carregar as despesas recorrentes"
            description={error.message}
            action={
              <Button variant="secondary" onClick={reload}>
                Tentar de novo
              </Button>
            }
          />
        </Card>
      ) : !summary || items.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={Repeat}
            title="Nenhuma despesa recorrente"
            description="Cadastre aluguel, assinaturas e contas fixas para saber quanto elas custam por mês e ver a previsão dos próximos meses."
            action={
              <Button icon={Plus} onClick={() => setCreating(true)}>
                Nova despesa
              </Button>
            }
          />
        </Card>
      ) : (
        <div className={`${styles.stack} refreshing`} aria-busy={loading}>
          <SummaryBar
            items={[
              {
                label: 'Custo mensal',
                value: <Amount value={summary.monthlyCost} size="lg" animate countUp />,
                hint: 'Equivalente por mês, com anuais e semestrais diluídas',
              },
              {
                label: 'Custo anual',
                value: <Amount value={summary.yearlyCost} countUp />,
                hint: 'Doze vezes o custo mensal equivalente',
              },
              {
                label: 'Ativas',
                value: <span className={styles.count}>{activeCount}</span>,
                hint: `${items.length} ${items.length === 1 ? 'despesa cadastrada' : 'despesas cadastradas'}`,
              },
              {
                label: 'Próximo vencimento',
                value: nextDue ? (
                  <Amount value={nextDue.amount} countUp />
                ) : (
                  <span className={styles.count}>—</span>
                ),
                hint: nextDue
                  ? `${nextDue.description} · ${formatDueLabel(nextDue.nextDueDate)}`
                  : 'Nenhuma despesa ativa',
              },
            ]}
          />

          {/*
            O bloco de vencimentos proximos existe porque a lista inteira ja e
            ordenada por data: sem ele, saber "o que vence nesta semana" exigiria
            ler data por data ate encontrar a fronteira.
          */}
          {summary.dueSoon.length > 0 ? (
            <div className={styles.dueSoon} role="status">
              <span className={styles.dueSoonTitle}>
                {summary.dueSoon.length === 1
                  ? '1 despesa vence nos próximos'
                  : `${summary.dueSoon.length} despesas vencem nos próximos`}{' '}
                {RECURRING_DUE_SOON_DAYS} dias
              </span>
              <span className={styles.dueSoonList}>
                {summary.dueSoon
                  .map((item) => `${item.description} (${capitalize(formatDueLabel(item.nextDueDate))})`)
                  .join(' · ')}
              </span>
            </div>
          ) : null}

          <ul className={styles.grid}>
            {items.map((expense) => (
              <RecurringCard
                key={expense.id}
                expense={expense}
                onEdit={setEditing}
                onToggle={handleToggle}
                onDelete={setRemoving}
              />
            ))}
          </ul>
        </div>
      )}

      <RecurringFormModal
        open={formOpen}
        expense={editing}
        categories={categories}
        sources={sources}
        saving={saving}
        onSubmit={handleSubmit}
        onClose={closeForm}
      />

      <ConfirmDialog
        open={removing !== null}
        title="Excluir despesa recorrente"
        description="Ela sai da previsão dos próximos meses. Os lançamentos que já aconteceram continuam no histórico."
        confirmLabel="Excluir"
        loading={saving}
        onConfirm={handleDelete}
        onCancel={() => setRemoving(null)}
      >
        {removing ? (
          <>
            <strong className={styles.confirmTitle}>{removing.description}</strong>
            <span className={styles.confirmMeta}>
              {recurrenceLabel[removing.frequency]} · {removing.accountName}
            </span>
            <Amount value={removing.amount} />
          </>
        ) : null}
      </ConfirmDialog>
    </>
  );
}
