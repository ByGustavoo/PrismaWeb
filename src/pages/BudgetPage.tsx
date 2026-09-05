import { useCallback, useMemo, useState } from 'react';
import { Plus, Target } from 'lucide-react';
import { Amount, SummaryBar } from '@/components/common';
import { BudgetFormModal, BudgetRow, MonthNavigator } from '@/components/budget';
import { PageHeader } from '@/components/layout';
import { Button, Card, CardBody, CardHeader, ConfirmDialog, EmptyState, LoadingBlock, ProgressBar } from '@/components/ui';
import { BUDGET_PROJECTION_MIN_DAYS, budgetProgressTone, budgetStatusOf } from '@/constants/budget';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/providers/ToastProvider';
import { budgetService, categoriesService } from '@/services';
import type { Budget, BudgetPayload, BudgetUsage } from '@/types';
import { monthKeyFromOffset, shiftMonthKey } from '@/utils/date';
import { capitalize, formatMonthLabel, formatPercent } from '@/utils/format';
import styles from './BudgetPage.module.css';

/** Ate onde as setas voltam. Doze meses cobrem o ciclo que se compara. */
const HISTORY_MONTHS = 11;

export function BudgetPage() {
  const currentMonth = monthKeyFromOffset(0);
  const [month, setMonth] = useState(currentMonth);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState<BudgetUsage | null>(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const fetchData = useCallback(
    (signal: AbortSignal) =>
      Promise.all([budgetService.getOverview(month, signal), categoriesService.list('DESPESA', signal)]),
    [month],
  );

  const { data, loading, error, reload } = useAsyncData(fetchData, [month]);

  const overview = data?.[0];
  const categories = useMemo(() => data?.[1] ?? [], [data]);

  const usedCategoryIds = useMemo(
    () => (overview?.items ?? []).map((item) => item.budget.category.id),
    [overview],
  );

  const inProgress = Boolean(overview && overview.daysLeft > 0 && overview.daysElapsed > 0);
  // Um mes em andamento nem sempre da para projetar: nos primeiros dias a regra
  // de tres multiplica o que acontece uma vez so (ver BUDGET_PROJECTION_MIN_DAYS).
  const showProjection = inProgress && (overview?.daysElapsed ?? 0) >= BUDGET_PROJECTION_MIN_DAYS;

  const formOpen = creating || editing !== null;

  const closeForm = () => {
    setCreating(false);
    setEditing(null);
  };

  const handleSubmit = async (payload: BudgetPayload) => {
    setSaving(true);

    try {
      if (editing) {
        await budgetService.update(editing.id, payload);
        toast.success('Limite atualizado', editing.category.nome);
      } else {
        await budgetService.create(payload);
        toast.success('Limite definido', 'O orçamento vale a partir deste mês.');
      }
      closeForm();
      reload();
    } catch (submitError) {
      toast.error('Não foi possível salvar o limite', submitError instanceof Error ? submitError.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!removing) return;
    setSaving(true);

    try {
      await budgetService.remove(removing.budget.id);
      toast.success('Limite excluído', removing.budget.category.nome);
      setRemoving(null);
      reload();
    } catch (deleteError) {
      toast.error('Não foi possível excluir o limite', deleteError instanceof Error ? deleteError.message : undefined);
      setRemoving(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Orçamento"
        description="Quanto você planejou gastar em cada categoria e quanto já foi"
        actions={
          <>
            <MonthNavigator
              month={month}
              onChange={setMonth}
              max={currentMonth}
              min={shiftMonthKey(currentMonth, -HISTORY_MONTHS)}
            />
            <Button size="sm" icon={Plus} onClick={() => setCreating(true)}>
              Novo limite
            </Button>
          </>
        }
      />

      {/* O esqueleto e so da primeira carga; trocar de mes mantem os numeros na tela. */}
      {loading && !data ? (
        <div className={styles.stack} aria-busy="true">
          <Card padding="none">
            <LoadingBlock lines={2} height={92} />
          </Card>
          <Card padding="none">
            <LoadingBlock lines={5} height={320} />
          </Card>
        </div>
      ) : error ? (
        <Card padding="none">
          <EmptyState
            title="Não foi possível carregar o orçamento"
            description={error.message}
            action={
              <Button variant="secondary" onClick={reload}>
                Tentar de novo
              </Button>
            }
          />
        </Card>
      ) : !overview || overview.items.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={Target}
            title="Nenhum limite definido"
            description="Defina quanto pretende gastar em cada categoria para acompanhar o consumo do mês e ser avisado antes de estourar."
            action={
              <Button icon={Plus} onClick={() => setCreating(true)}>
                Novo limite
              </Button>
            }
          />
        </Card>
      ) : (
        <div className={`${styles.stack} refreshing`} aria-busy={loading}>
          <SummaryBar
            items={[
              {
                label: 'Planejado',
                value: <Amount value={overview.planned} countUp />,
                hint: `${overview.items.length} ${overview.items.length === 1 ? 'categoria com limite' : 'categorias com limite'}`,
              },
              {
                label: 'Gasto',
                value: <Amount value={overview.spent} size="lg" animate countUp />,
                hint: `${formatPercent(overview.ratio * 100, 0)} do planejado`,
              },
              {
                label: overview.remaining >= 0 ? 'Disponível' : 'Acima do planejado',
                value: (
                  <Amount
                    value={Math.abs(overview.remaining)}
                    tone={overview.remaining >= 0 ? 'positive' : 'negative'}
                    countUp
                  />
                ),
                hint:
                  overview.daysLeft > 0
                    ? `Faltam ${overview.daysLeft} ${overview.daysLeft === 1 ? 'dia' : 'dias'} para o fim do mês`
                    : 'Mês encerrado',
              },
              {
                label: 'Fora do orçamento',
                value: (
                  <Amount
                    value={overview.unplanned.reduce((total, item) => total + item.valor, 0)}
                    tone="muted"
                    countUp
                  />
                ),
                hint:
                  overview.unplanned.length === 0
                    ? 'Todo gasto do mês tem limite'
                    : `${overview.unplanned.length} ${overview.unplanned.length === 1 ? 'categoria sem limite' : 'categorias sem limite'}`,
              },
            ]}
          />

          <Card>
            <CardHeader
              title={`Consumo de ${capitalize(formatMonthLabel(overview.month))}`}
              description={
                inProgress
                  ? `${overview.daysElapsed} de ${overview.daysInMonth} dias vividos`
                  : 'Mês fechado'
              }
            />
            <CardBody className={styles.total}>
              <ProgressBar
                value={overview.ratio}
                tone={budgetProgressTone[budgetStatusOf(overview.ratio)]}
                label={`Consumo do orçamento de ${capitalize(formatMonthLabel(overview.month))}`}
              />
              <p className={styles.totalNote}>
                <Amount className={styles.inline} value={overview.spent} size="sm" /> de{' '}
                <Amount className={styles.inline} value={overview.planned} size="sm" tone="muted" /> planejados.
                {/*
                  Num mes que mal comecou, toda barra esta vazia e nenhum limite
                  disparou — a projecao e o que torna a tela util no dia 5.
                */}
                {showProjection ? (
                  <span>
                    No ritmo atual, o mês fecha em{' '}
                    <Amount
                      className={styles.inline}
                      value={(overview.spent / overview.daysElapsed) * overview.daysInMonth}
                      size="sm"
                    />
                    .
                  </span>
                ) : null}
              </p>
            </CardBody>
          </Card>

          <ul className={styles.list}>
            {overview.items.map((usage) => (
              <BudgetRow
                key={usage.budget.id}
                usage={usage}
                showProjection={showProjection}
                onEdit={(item) => setEditing(item.budget)}
                onDelete={setRemoving}
              />
            ))}
          </ul>

          {/*
            Sem este bloco, a soma dos limites seria lida como o gasto total do
            mes — e ela nao e: o que nao tem limite tambem saiu da conta.
          */}
          {overview.unplanned.length > 0 ? (
            <Card>
              <CardHeader
                title="Gasto fora do orçamento"
                description="Categorias que ainda não têm limite definido"
              />
              <CardBody>
                <ul className={styles.unplanned}>
                  {overview.unplanned.map((entry) => (
                    <li key={entry.categoria.id} className={styles.unplannedItem}>
                      <span
                        className={styles.marker}
                        style={{ backgroundColor: `var(--chart-${entry.categoria.tokenCor})` }}
                        aria-hidden="true"
                      />
                      <span className={styles.unplannedName}>{entry.categoria.nome}</span>
                      <Amount value={entry.valor} size="sm" tone="muted" />
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          ) : null}
        </div>
      )}

      <BudgetFormModal
        open={formOpen}
        budget={editing}
        categories={categories}
        usedCategoryIds={usedCategoryIds}
        saving={saving}
        onSubmit={handleSubmit}
        onClose={closeForm}
      />

      <ConfirmDialog
        open={removing !== null}
        title="Excluir limite"
        description="A categoria continua recebendo lançamentos, mas deixa de ser acompanhada pelo orçamento."
        confirmLabel="Excluir"
        loading={saving}
        onConfirm={handleDelete}
        onCancel={() => setRemoving(null)}
      >
        {removing ? (
          <>
            <strong className={styles.confirmTitle}>{removing.budget.category.nome}</strong>
            <span className={styles.confirmMeta}>Limite mensal</span>
            <Amount value={removing.budget.limit} />
          </>
        ) : null}
      </ConfirmDialog>
    </>
  );
}
