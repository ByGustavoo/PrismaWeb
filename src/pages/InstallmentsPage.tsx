import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CreditCard, Layers, Plus } from 'lucide-react';
import { Amount, SummaryBar } from '@/components/common';
import { InstallmentCard, InstallmentFormModal } from '@/components/installments';
import { PageHeader } from '@/components/layout';
import { Button, Card, ConfirmDialog, EmptyState, LoadingBlock, Select } from '@/components/ui';
import { isCreditCard } from '@/constants/cards';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/providers/ToastProvider';
import { CARD_PARAM } from '@/routes/paths';
import { cardsService, categoriesService } from '@/services';
import type { InstallmentPayload, InstallmentPurchase, Option } from '@/types';
import { formatShortMonth } from '@/utils/format';
import styles from './InstallmentsPage.module.css';

/** Valor do filtro para "sem restricao de cartao". */
const ALL_CARDS = 'all';

export function InstallmentsPage() {
  const [cardId, setCardId] = useState<string>(ALL_CARDS);
  const [editing, setEditing] = useState<InstallmentPurchase | null>(null);
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState<InstallmentPurchase | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  // Mesmo contrato das outras telas: o cartao chega pela URL e sai dela na leitura.
  useEffect(() => {
    const requested = searchParams.get(CARD_PARAM);
    if (!requested) return;
    setCardId(requested);
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  const fetchData = useCallback(
    (signal: AbortSignal) =>
      Promise.all([
        cardsService.listInstallments(undefined, signal),
        cardsService.list(signal),
        categoriesService.list('DESPESA', signal),
      ]),
    [],
  );

  const { data, loading, error, reload } = useAsyncData(fetchData);

  const allPlans = useMemo(() => data?.[0] ?? [], [data]);
  const cards = useMemo(() => data?.[1] ?? [], [data]);
  const categories = useMemo(() => data?.[2] ?? [], [data]);

  const creditCards = useMemo(() => cards.filter(isCreditCard), [cards]);

  const cardOptions = useMemo<Option[]>(
    () => [
      { value: ALL_CARDS, label: 'Todos' },
      ...creditCards.map((card) => ({ value: card.id, label: card.name })),
    ],
    [creditCards],
  );

  const plans = useMemo(
    () => (cardId === ALL_CARDS ? allPlans : allPlans.filter((plan) => plan.purchase.cardId === cardId)),
    [allPlans, cardId],
  );

  const summary = useMemo(() => {
    const active = plans.filter((plan) => plan.remainingCount > 0);
    // O ultimo mes com parcela responde "quando eu me livro disso".
    const lastMonth = active
      .map((plan) => plan.schedule[plan.schedule.length - 1]?.month ?? '')
      .filter(Boolean)
      .sort()
      .at(-1);

    return {
      remaining: active.reduce((sum, plan) => sum + plan.remainingAmount, 0),
      paid: plans.reduce((sum, plan) => sum + plan.paidAmount, 0),
      activeCount: active.length,
      lastMonth,
    };
  }, [plans]);

  const formOpen = creating || editing !== null;

  const closeForm = () => {
    setCreating(false);
    setEditing(null);
  };

  const handleSubmit = async (payload: InstallmentPayload) => {
    setSaving(true);

    try {
      if (editing) {
        await cardsService.updateInstallment(editing.id, payload);
        toast.success('Compra atualizada', payload.description);
      } else {
        await cardsService.createInstallment(payload);
        toast.success('Compra parcelada cadastrada', `${payload.count}x · ${payload.description}`);
      }
      closeForm();
      reload();
    } catch (submitError) {
      toast.error(
        'Não foi possível salvar a compra',
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
      await cardsService.removeInstallment(removing.id);
      toast.success('Compra parcelada excluída', removing.description);
      setRemoving(null);
      reload();
    } catch (deleteError) {
      toast.error(
        'Não foi possível excluir a compra',
        deleteError instanceof Error ? deleteError.message : undefined,
      );
      setRemoving(null);
    } finally {
      setSaving(false);
    }
  };

  const noCreditCard = !loading && !error && creditCards.length === 0;

  return (
    <>
      <PageHeader
        title="Compras parceladas"
        description="Quanto já foi pago, quanto falta e em quais faturas as parcelas caem"
        actions={
          <>
            {/*
             * O filtro vive na linha de acoes da tela, e nao numa faixa propria
             * entre o resumo e a lista: sozinho ali, um campo estreito ficava
             * perdido entre dois blocos largos e criava uma terceira faixa sem
             * conteudo. Aqui ele divide a linha com a acao principal, que e onde
             * os controles de tela ja moram.
             */}
            {creditCards.length > 1 ? (
              <Select
                className={styles.filter}
                size="sm"
                prefix="Cartão:"
                icon={CreditCard}
                options={cardOptions}
                value={cardId}
                onChange={setCardId}
                aria-label="Filtrar compras por cartão"
              />
            ) : null}
            <Button size="sm" icon={Plus} disabled={noCreditCard} onClick={() => setCreating(true)}>
              Nova compra
            </Button>
          </>
        }
      />

      {/*
        O esqueleto e so da primeira carga. Depois de cadastrar, editar ou trocar
        o filtro, os numeros anteriores ficam na tela ate os novos chegarem:
        apagar a tela a cada gravacao piscava o conteudo inteiro e, pior,
        remontava a faixa de resumo — o que faria a contagem de entrada
        (`Amount countUp`) recomecar do zero a cada salvamento.
      */}
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
            title="Não foi possível carregar as compras parceladas"
            description={error.message}
            action={
              <Button variant="secondary" onClick={reload}>
                Tentar de novo
              </Button>
            }
          />
        </Card>
      ) : noCreditCard ? (
        <Card padding="none">
          <EmptyState
            icon={CreditCard}
            title="Nenhum cartão de crédito cadastrado"
            description="Compras parceladas dependem de um cartão de crédito. Cadastre um em Cartões para começar."
          />
        </Card>
      ) : allPlans.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={Layers}
            title="Nenhuma compra parcelada"
            description="Cadastre uma compra em várias vezes para acompanhar as parcelas pagas, as que faltam e em quais meses elas caem."
            action={
              <Button icon={Plus} onClick={() => setCreating(true)}>
                Nova compra
              </Button>
            }
          />
        </Card>
      ) : (
        <div className={`${styles.stack} refreshing`} aria-busy={loading}>
          <SummaryBar
            items={[
              {
                label: 'Falta pagar',
                value: <Amount value={summary.remaining} size="lg" countUp />,
                hint: summary.lastMonth
                  ? `Última parcela em ${formatShortMonth(summary.lastMonth)}`
                  : 'Nenhuma parcela em aberto',
              },
              {
                label: 'Já pago',
                value: <Amount value={summary.paid} tone="positive" countUp />,
                hint: 'Somando todas as compras da lista',
              },
              {
                label: 'Em andamento',
                value: <span className={styles.count}>{summary.activeCount}</span>,
                hint: `${plans.length} ${plans.length === 1 ? 'compra cadastrada' : 'compras cadastradas'}`,
              },
            ]}
          />

          {plans.length === 0 ? (
            <Card padding="none">
              <EmptyState
                icon={Layers}
                title="Nenhuma compra parcelada neste cartão"
                description="Escolha outro cartão ou cadastre uma compra em várias vezes."
              />
            </Card>
          ) : (
            <ul className={styles.list}>
              {plans.map((plan) => (
                <InstallmentCard
                  key={plan.purchase.id}
                  plan={plan}
                  onEdit={setEditing}
                  onDelete={setRemoving}
                />
              ))}
            </ul>
          )}
        </div>
      )}

      <InstallmentFormModal
        open={formOpen}
        purchase={editing}
        cards={cards}
        categories={categories}
        saving={saving}
        onSubmit={handleSubmit}
        onClose={closeForm}
      />

      <ConfirmDialog
        open={removing !== null}
        title="Excluir compra parcelada"
        description="As parcelas que ainda não venceram saem das próximas faturas."
        confirmLabel="Excluir"
        loading={saving}
        onConfirm={handleDelete}
        onCancel={() => setRemoving(null)}
      >
        {removing ? (
          <>
            <strong className={styles.confirmTitle}>{removing.description}</strong>
            <span className={styles.confirmMeta}>
              {removing.count}x · {removing.cardName}
            </span>
            <Amount value={removing.totalAmount} />
          </>
        ) : null}
      </ConfirmDialog>
    </>
  );
}
