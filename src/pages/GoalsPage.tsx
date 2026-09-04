import { useCallback, useMemo, useState } from 'react';
import { Plus, ShoppingBag } from 'lucide-react';
import { Amount, SummaryBar } from '@/components/common';
import {
  GoalCard,
  GoalDetailModal,
  GoalFilters,
  GoalFormModal,
  applyGoalQuery,
  emptyGoalQuery,
  hasActiveGoalFilters,
  priceTone,
} from '@/components/goals';
import type { GoalFormResult, GoalQuery } from '@/components/goals';
import { PageHeader } from '@/components/layout';
import { Button, Card, ConfirmDialog, EmptyState, LoadingBlock } from '@/components/ui';
import { goalStatusToast } from '@/constants/goals';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/providers/ToastProvider';
import { goalsService } from '@/services';
import type { Goal, GoalPricePayload, GoalStatus, GoalTracking, Trend } from '@/types';
import { formatPercent } from '@/utils/format';
import styles from './GoalsPage.module.css';

/** Direcao do conjunto: barateou, encareceu ou nao se moveu. */
function totalTrend(change: number, base: number): Trend {
  if (base <= 0 || Math.abs(change / base) <= 0.005) return 'flat';
  return change > 0 ? 'up' : 'down';
}

export function GoalsPage() {
  const [query, setQuery] = useState<GoalQuery>(emptyGoalQuery);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [focusPriceForm, setFocusPriceForm] = useState(false);
  const [removing, setRemoving] = useState<GoalTracking | null>(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const fetchData = useCallback((signal: AbortSignal) => goalsService.list({}, signal), []);
  const { data, loading, error, reload } = useAsyncData(fetchData);

  const items = useMemo(() => data?.items ?? [], [data]);
  const visible = useMemo(() => applyGoalQuery(items, query), [items, query]);

  /*
   * O detalhe guarda o id, e nao o objeto: depois de registrar um preco a lista
   * recarrega, e um retrato preso no estado continuaria mostrando o historico
   * de antes — justamente o que o usuario acabou de mudar.
   */
  const detail = useMemo(
    () => (detailId ? items.find((item) => item.goal.id === detailId) ?? null : null),
    [detailId, items],
  );

  const formOpen = creating || editing !== null;

  const closeForm = () => {
    setCreating(false);
    setEditing(null);
  };

  const openDetail = (tracking: GoalTracking, focusPrice = false) => {
    setDetailId(tracking.goal.id);
    setFocusPriceForm(focusPrice);
  };

  const handleSubmit = async (result: GoalFormResult) => {
    setSaving(true);

    try {
      if (result.mode === 'update' && editing) {
        await goalsService.update(editing.id, result.data);
        toast.success('Meta atualizada', result.data.name);
      } else if (result.mode === 'create') {
        await goalsService.create(result.data);
        toast.success('Meta cadastrada', result.data.name);
      }
      closeForm();
      reload();
    } catch (submitError) {
      toast.error('Não foi possível salvar a meta', submitError instanceof Error ? submitError.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  /** Devolve `true` quando o preco entrou, para o formulario se limpar. */
  const handleAddPrice = async (tracking: GoalTracking, payload: GoalPricePayload): Promise<boolean> => {
    setSaving(true);

    try {
      await goalsService.addPrice(tracking.goal.id, payload);
      toast.success('Preço registrado', tracking.goal.name);
      reload();
      return true;
    } catch (priceError) {
      toast.error('Não foi possível registrar o preço', priceError instanceof Error ? priceError.message : undefined);
      return false;
    } finally {
      setSaving(false);
    }
  };

  /** Marcar como comprada, cancelar ou voltar a acompanhar sem abrir o formulario. */
  const handleStatusChange = async (tracking: GoalTracking, status: GoalStatus) => {
    const { goal } = tracking;
    setSaving(true);

    try {
      await goalsService.update(goal.id, {
        name: goal.name,
        status,
        ...(goal.url ? { url: goal.url } : {}),
        ...(goal.imageUrl ? { imageUrl: goal.imageUrl } : {}),
        ...(goal.notes ? { notes: goal.notes } : {}),
      });
      toast.success(goalStatusToast[status], goal.name);
      reload();
    } catch (statusError) {
      toast.error('Não foi possível alterar a meta', statusError instanceof Error ? statusError.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!removing) return;
    setSaving(true);

    try {
      await goalsService.remove(removing.goal.id);
      toast.success('Meta excluída', removing.goal.name);
      setRemoving(null);
      reload();
    } catch (deleteError) {
      toast.error('Não foi possível excluir a meta', deleteError instanceof Error ? deleteError.message : undefined);
      setRemoving(null);
    } finally {
      setSaving(false);
    }
  };

  const change = data?.totalChange ?? 0;
  const trend = totalTrend(change, data?.initialTotal ?? 0);
  const changePercent = data && data.initialTotal > 0 ? (change / data.initialTotal) * 100 : 0;

  return (
    <>
      <PageHeader
        title="Metas e desejos"
        description="O que você pretende comprar, por quanto viu da primeira vez e para onde o preço está indo"
        actions={
          <Button size="sm" icon={Plus} onClick={() => setCreating(true)}>
            Nova meta
          </Button>
        }
      />

      {/* O esqueleto e so da primeira carga: registrar um preco mantem a lista na tela. */}
      {loading && !data ? (
        <div className={styles.stack} aria-busy="true">
          <Card padding="none">
            <LoadingBlock lines={2} height={92} />
          </Card>
          <Card padding="none">
            <LoadingBlock lines={4} height={320} />
          </Card>
        </div>
      ) : error ? (
        <Card padding="none">
          <EmptyState
            title="Não foi possível carregar as metas"
            description={error.message}
            action={
              <Button variant="secondary" onClick={reload}>
                Tentar de novo
              </Button>
            }
          />
        </Card>
      ) : !data || items.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={ShoppingBag}
            title="Nenhuma meta cadastrada"
            description="Cadastre o que você pretende comprar e registre o preço sempre que consultar. Com dois ou três registros a tela já mostra se o momento é bom."
            action={
              <Button icon={Plus} onClick={() => setCreating(true)}>
                Nova meta
              </Button>
            }
          />
        </Card>
      ) : (
        <div className={`${styles.stack} refreshing`} aria-busy={loading}>
          <SummaryBar
            items={[
              {
                label: 'Em acompanhamento',
                value: <span className={`${styles.count} tabular`}>{data.trackingCount}</span>,
                hint:
                  data.purchasedCount > 0
                    ? `${data.purchasedCount} ${data.purchasedCount === 1 ? 'já comprada' : 'já compradas'}`
                    : 'Metas ainda em observação',
              },
              {
                label: 'Custo da lista hoje',
                value: <Amount value={data.currentTotal} size="lg" animate countUp />,
                hint: 'Soma dos preços atuais das metas em acompanhamento',
              },
              {
                label: 'Desde o primeiro registro',
                value: (
                  <span className={styles.pair}>
                    <Amount value={change} tone={priceTone(trend)} sign="auto" countUp />
                    <span className={`${styles.percent} tabular`}>{formatPercent(Math.abs(changePercent))}</span>
                  </span>
                ),
                hint: trend === 'up' ? 'A lista ficou mais cara' : trend === 'down' ? 'A lista ficou mais barata' : 'A lista não mudou de preço',
              },
              {
                label: 'Abaixo do maior preço',
                value: <Amount value={data.totalSavings} tone={data.totalSavings > 0 ? 'positive' : 'muted'} countUp />,
                hint: 'O quanto os preços de hoje estão abaixo dos picos já registrados',
              },
            ]}
          />

          <section className={styles.section}>
            <GoalFilters
              query={query}
              onChange={(patch) => setQuery((current) => ({ ...current, ...patch }))}
              onClear={() => setQuery(emptyGoalQuery)}
              resultCount={visible.length}
            />

            {visible.length === 0 ? (
              <Card padding="none">
                <EmptyState
                  icon={ShoppingBag}
                  title="Nenhuma meta encontrada"
                  description="Nenhuma meta corresponde à busca e aos filtros escolhidos."
                  action={
                    hasActiveGoalFilters(query) ? (
                      <Button variant="secondary" onClick={() => setQuery(emptyGoalQuery)}>
                        Limpar filtros
                      </Button>
                    ) : null
                  }
                />
              </Card>
            ) : (
              <ul className={styles.grid}>
                {visible.map((tracking, index) => (
                  <GoalCard
                    key={tracking.goal.id}
                    tracking={tracking}
                    index={index}
                    onOpen={(item) => openDetail(item)}
                    onRegisterPrice={(item) => openDetail(item, true)}
                    onDelete={setRemoving}
                  />
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      <GoalFormModal
        open={formOpen}
        goal={editing}
        saving={saving}
        onSubmit={handleSubmit}
        onClose={closeForm}
      />

      {/*
        Editar e excluir fecham o detalhe antes de abrir o proximo painel: dois
        modais empilhados disputariam a trava de Tab e o Escape fecharia os dois
        de uma vez.
      */}
      <GoalDetailModal
        tracking={detail}
        saving={saving}
        focusPriceForm={focusPriceForm}
        onClose={() => setDetailId(null)}
        onEdit={(tracking) => {
          setDetailId(null);
          setEditing(tracking.goal);
        }}
        onDelete={(tracking) => {
          setDetailId(null);
          setRemoving(tracking);
        }}
        onStatusChange={handleStatusChange}
        onAddPrice={handleAddPrice}
      />

      <ConfirmDialog
        open={removing !== null}
        title="Excluir meta"
        description="O histórico de preços dessa meta é apagado junto. Se a ideia é só tirá-la da lista, marque como comprada ou cancelada."
        confirmLabel="Excluir"
        loading={saving}
        onConfirm={handleDelete}
        onCancel={() => setRemoving(null)}
      >
        {removing ? (
          <>
            <strong className={styles.confirmTitle}>{removing.goal.name}</strong>
            <span className={styles.confirmMeta}>
              {removing.analysis.entryCount}{' '}
              {removing.analysis.entryCount === 1 ? 'preço registrado' : 'preços registrados'}
            </span>
            <Amount value={removing.analysis.currentPrice} />
          </>
        ) : null}
      </ConfirmDialog>
    </>
  );
}
