import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard as CreditCardIcon, Plus } from 'lucide-react';
import { CardFormModal, CardTile } from '@/components/cards';
import { Amount, SummaryBar } from '@/components/common';
import { PageHeader } from '@/components/layout';
import { Button, Card, ConfirmDialog, EmptyState, LoadingBlock } from '@/components/ui';
import { cardTypeLabel, isCreditCard } from '@/constants/cards';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/providers/ToastProvider';
import { CARD_PARAM, paths } from '@/routes/paths';
import { accountsService, cardsService } from '@/services';
import type { Card as CardModel, CardPayload, Invoice } from '@/types';
import styles from './CardsPage.module.css';

export function CardsPage() {
  const [editing, setEditing] = useState<CardModel | null>(null);
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState<CardModel | null>(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const fetchData = useCallback(
    (signal: AbortSignal) =>
      Promise.all([
        cardsService.list(signal),
        cardsService.listInvoices(undefined, signal),
        accountsService.list(signal),
      ]),
    [],
  );

  const { data, loading, error, reload } = useAsyncData(fetchData);

  const cards = useMemo(() => data?.[0] ?? [], [data]);
  const invoices = useMemo(() => data?.[1] ?? [], [data]);
  const accounts = useMemo(() => data?.[2] ?? [], [data]);

  /** Fatura em curso de cada cartao: a aberta, ou a fechada ainda a pagar. */
  const currentInvoices = useMemo(() => {
    const map = new Map<string, Invoice>();
    for (const invoice of invoices) {
      if (invoice.status !== 'ABERTA' && invoice.status !== 'FECHADA') continue;
      const existing = map.get(invoice.cardId);
      if (!existing || invoice.dueDate < existing.dueDate) map.set(invoice.cardId, invoice);
    }
    return map;
  }, [invoices]);

  const creditCards = useMemo(() => cards.filter(isCreditCard), [cards]);
  const otherCards = useMemo(() => cards.filter((card) => card.type !== 'CREDITO'), [cards]);

  const summary = useMemo(() => {
    const limit = creditCards.reduce((sum, card) => sum + card.limit, 0);
    const used = creditCards.reduce((sum, card) => sum + (card.used ?? 0), 0);
    const openTotal = [...currentInvoices.values()].reduce((sum, invoice) => sum + invoice.total, 0);
    return { limit, used, available: Math.max(limit - used, 0), openTotal };
  }, [creditCards, currentInvoices]);

  const formOpen = creating || editing !== null;

  const closeForm = () => {
    setCreating(false);
    setEditing(null);
  };

  const handleSubmit = async (payload: CardPayload) => {
    setSaving(true);

    try {
      if (editing) {
        await cardsService.update(editing.id, payload);
        toast.success('Cartão atualizado', payload.name);
      } else {
        await cardsService.create(payload);
        toast.success('Cartão cadastrado', payload.name);
      }
      closeForm();
      reload();
    } catch (submitError) {
      toast.error(
        'Não foi possível salvar o cartão',
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
      await cardsService.remove(removing.id);
      toast.success('Cartão excluído', removing.name);
      setRemoving(null);
      reload();
    } catch (deleteError) {
      toast.error(
        'Não foi possível excluir o cartão',
        deleteError instanceof Error ? deleteError.message : undefined,
      );
      setRemoving(null);
    } finally {
      setSaving(false);
    }
  };

  /* O cartao escolhido viaja como parametro transitorio; a tela de faturas o le
     e limpa a URL, como fazem os atalhos da busca global. */
  const openInvoices = (card: CardModel) => navigate(`${paths.invoices}?${CARD_PARAM}=${card.id}`);

  /* O saldo da conta vinculada da ao cartao de debito o numero que ele nao tem. */
  const accountBalances = new Map(accounts.map((account) => [account.id, account.balance]));

  const renderTile = (card: CardModel) => (
    <CardTile
      key={card.id}
      card={card}
      invoice={currentInvoices.get(card.id)}
      accountBalance={card.accountId ? accountBalances.get(card.accountId) : undefined}
      onEdit={setEditing}
      onDelete={setRemoving}
      onOpenInvoices={openInvoices}
    />
  );

  return (
    <>
      <PageHeader
        title="Cartões"
        description="Limites, faturas e saldos dos seus cartões"
        actions={
          <Button size="sm" icon={Plus} onClick={() => setCreating(true)}>
            Novo cartão
          </Button>
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
            <LoadingBlock lines={5} height={300} />
          </Card>
        </div>
      ) : error ? (
        <Card padding="none">
          <EmptyState
            title="Não foi possível carregar os cartões"
            description={error.message}
            action={
              <Button variant="secondary" onClick={reload}>
                Tentar de novo
              </Button>
            }
          />
        </Card>
      ) : cards.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={CreditCardIcon}
            title="Nenhum cartão cadastrado"
            description="Cadastre um cartão de crédito, débito ou vale para acompanhar limites, faturas e saldos."
            action={
              <Button icon={Plus} onClick={() => setCreating(true)}>
                Novo cartão
              </Button>
            }
          />
        </Card>
      ) : (
        <div className={`${styles.stack} refreshing`} aria-busy={loading}>
          {creditCards.length > 0 ? (
            <SummaryBar
              items={[
                {
                  label: 'Limite disponível',
                  value: <Amount value={summary.available} size="lg" countUp />,
                  hint: 'Somando todos os cartões de crédito',
                },
                {
                  label: 'Limite comprometido',
                  value: <Amount value={summary.used} tone="muted" countUp />,
                  hint: 'Faturas em aberto e parcelas a vencer',
                },
                {
                  label: 'Faturas atuais',
                  value: <Amount value={summary.openTotal} tone="muted" countUp />,
                  hint: 'Total dos ciclos ainda não pagos',
                },
              ]}
            />
          ) : null}

          {creditCards.length > 0 ? (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Cartões de crédito</h2>
              <ul className={styles.grid}>{creditCards.map(renderTile)}</ul>
            </section>
          ) : null}

          {otherCards.length > 0 ? (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Débito e vales</h2>
              {/*
                Separados porque o conteudo e outro: sem limite, sem fechamento e
                sem fatura, eles ficariam com tres quartos do cartao vazios se
                dividissem a mesma grade dos de credito.
              */}
              <ul className={styles.grid}>{otherCards.map(renderTile)}</ul>
            </section>
          ) : null}
        </div>
      )}

      <CardFormModal
        open={formOpen}
        card={editing}
        accounts={accounts}
        saving={saving}
        onSubmit={handleSubmit}
        onClose={closeForm}
      />

      <ConfirmDialog
        open={removing !== null}
        title="Excluir cartão"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        loading={saving}
        onConfirm={handleDelete}
        onCancel={() => setRemoving(null)}
      >
        {removing ? (
          <>
            <strong className={styles.confirmTitle}>{removing.name}</strong>
            <span className={styles.confirmMeta}>
              {removing.institution} · {cardTypeLabel[removing.type]}
            </span>
          </>
        ) : null}
      </ConfirmDialog>
    </>
  );
}
