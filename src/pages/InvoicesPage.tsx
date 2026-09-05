import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CreditCard, Receipt } from 'lucide-react';
import { Amount, SummaryBar } from '@/components/common';
import { InvoiceDetailModal, InvoiceHighlight, InvoiceRow } from '@/components/invoices';
import { PageHeader } from '@/components/layout';
import { Button, Card, EmptyState, LoadingBlock, Select } from '@/components/ui';
import { isCreditCard } from '@/constants/cards';
import { useAsyncData } from '@/hooks/useAsyncData';
import { CARD_PARAM } from '@/routes/paths';
import { cardsService } from '@/services';
import type { Invoice, Option } from '@/types';
import { monthKeyFromOffset, monthsBetween } from '@/utils/date';
import { capitalize, formatDueLabel } from '@/utils/format';
import styles from './InvoicesPage.module.css';

/** Valor do filtro para "sem restricao de cartao". */
const ALL_CARDS = 'all';

/** Sem restricao de meses num bloco de faturas. */
const ALL_MONTHS = 'all';

/**
 * Janela de meses de cada bloco. Com dois cartoes, o historico e a projecao
 * passam de vinte linhas somadas — mais do que se le de uma vez, e a maioria
 * delas nem e o que se veio procurar. Tres meses cobre o que interessa no dia a
 * dia, e "Todas" continua a um clique.
 */
const upcomingRangeOptions: Option[] = [
  { value: '3', label: 'Próximos 3 meses' },
  { value: '6', label: 'Próximos 6 meses' },
  { value: ALL_MONTHS, label: 'Todas as futuras' },
];

const pastRangeOptions: Option[] = [
  { value: '3', label: 'Últimos 3 meses' },
  { value: '6', label: 'Últimos 6 meses' },
  { value: ALL_MONTHS, label: 'Todas as anteriores' },
];

/** Distancia em meses entre a fatura e o mes corrente, em qualquer direcao. */
function withinRange(month: string, thisMonth: string, range: string): boolean {
  if (range === ALL_MONTHS) return true;
  return Math.abs(monthsBetween(thisMonth, month) - 1) <= Number(range);
}

function countLabel(count: number): string {
  return `${count} ${count === 1 ? 'fatura' : 'faturas'}`;
}

export function InvoicesPage() {
  const [cardId, setCardId] = useState<string>(ALL_CARDS);
  const [upcomingRange, setUpcomingRange] = useState('3');
  const [pastRange, setPastRange] = useState('3');
  const [openInvoice, setOpenInvoice] = useState<Invoice | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Chegando da tela de cartoes, o cartao vem na URL. O parametro sai assim que
  // e lido, como os da busca global: voltar no historico nao deve refiltrar.
  useEffect(() => {
    const requested = searchParams.get(CARD_PARAM);
    if (!requested) return;
    setCardId(requested);
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  const fetchData = useCallback(
    (signal: AbortSignal) =>
      Promise.all([cardsService.listInvoices(undefined, signal), cardsService.list(signal)]),
    [],
  );

  const { data, loading, error, reload } = useAsyncData(fetchData);

  const allInvoices = useMemo(() => data?.[0] ?? [], [data]);
  const creditCards = useMemo(() => (data?.[1] ?? []).filter(isCreditCard), [data]);

  const cardOptions = useMemo<Option[]>(
    () => [
      { value: ALL_CARDS, label: 'Todos' },
      ...creditCards.map((card) => ({ value: card.id, label: card.name })),
    ],
    [creditCards],
  );

  const invoices = useMemo(
    () => (cardId === ALL_CARDS ? allInvoices : allInvoices.filter((invoice) => invoice.cardId === cardId)),
    [allInvoices, cardId],
  );

  /*
   * A fatura ja fechada e a que esta em aberto sao coisas diferentes e ficam em
   * blocos diferentes: a fechada exige pagamento numa data, enquanto a aberta
   * ainda esta acumulando compras. Junta-las sob "Fatura atual" colocava duas
   * faturas do mesmo cartao lado a lado sem explicar por que sao duas.
   */
  const groups = useMemo(() => {
    const toPay = invoices.filter((item) => item.status === 'FECHADA' || item.status === 'VENCIDA');
    const current = invoices.filter((item) => item.status === 'ABERTA');
    const upcoming = invoices.filter((item) => item.status === 'FUTURA');
    // Mais recente primeiro: o passado se le de tras para frente.
    const past = invoices.filter((item) => item.status === 'PAGA').slice().reverse();

    return { toPay, current, upcoming, past };
  }, [invoices]);

  const sum = (list: Invoice[]) => list.reduce((total, item) => total + item.total, 0);

  const summary = useMemo(() => {
    const nextDue = groups.toPay[0]?.dueDate ?? groups.current[0]?.dueDate;

    return {
      toPay: sum(groups.toPay),
      current: sum(groups.current),
      upcoming: sum(groups.upcoming),
      upcomingCount: groups.upcoming.length,
      nextDue,
    };
  }, [groups]);

  /*
   * A janela de meses recorta so o que a lista mostra. O total do bloco segue o
   * recorte — um "Total" ao lado de uma lista filtrada precisa somar o que esta
   * a vista —, e o numero cheio do futuro continua na faixa do topo.
   */
  const thisMonth = monthKeyFromOffset(0);

  const visibleUpcoming = useMemo(
    () => groups.upcoming.filter((invoice) => withinRange(invoice.month, thisMonth, upcomingRange)),
    [groups.upcoming, thisMonth, upcomingRange],
  );

  const visiblePast = useMemo(
    () => groups.past.filter((invoice) => withinRange(invoice.month, thisMonth, pastRange)),
    [groups.past, thisMonth, pastRange],
  );

  return (
    <>
      <PageHeader
        title="Faturas"
        description="O ciclo em aberto, o que ainda vem e o que já foi pago"
        actions={
          // O filtro de cartao vale para a tela inteira, entao fica na linha de
          // acoes do cabecalho; os seletores de mes de cada bloco ficam no bloco.
          !loading && !error && creditCards.length > 1 ? (
            <Select
              className={styles.filter}
              size="sm"
              prefix="Cartão:"
              icon={CreditCard}
              options={cardOptions}
              value={cardId}
              onChange={setCardId}
              aria-label="Filtrar faturas por cartão"
            />
          ) : null
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
            title="Não foi possível carregar as faturas"
            description={error.message}
            action={
              <Button variant="secondary" onClick={reload}>
                Tentar de novo
              </Button>
            }
          />
        </Card>
      ) : creditCards.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={CreditCard}
            title="Nenhum cartão de crédito cadastrado"
            description="Faturas nascem de um cartão de crédito. Cadastre um em Cartões para acompanhar fechamento, vencimento e compras."
          />
        </Card>
      ) : (
        <div className={`${styles.stack} refreshing`} aria-busy={loading}>
          <SummaryBar
            items={[
              {
                label: 'A pagar agora',
                value: <Amount value={summary.toPay} size="lg" countUp />,
                hint: summary.nextDue
                  ? capitalize(formatDueLabel(summary.nextDue))
                  : 'Nenhuma fatura fechada',
              },
              {
                label: 'Ciclo em aberto',
                value: <Amount value={summary.current} tone="muted" countUp />,
                hint: 'Ainda acumulando compras',
              },
              {
                label: 'Já comprometido',
                value: <Amount value={summary.upcoming} tone="muted" countUp />,
                hint: `${summary.upcomingCount} ${summary.upcomingCount === 1 ? 'fatura futura' : 'faturas futuras'}`,
              },
            ]}
          />

          {invoices.length === 0 ? (
            <Card padding="none">
              <EmptyState
                icon={Receipt}
                title="Nenhuma fatura para este cartão"
                description="Assim que houver uma compra, a fatura do ciclo aparece aqui."
              />
            </Card>
          ) : null}

          {groups.toPay.length > 0 ? (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionText}>
                  <h2 className={styles.sectionTitle}>A pagar</h2>
                  <span className={styles.sectionMeta}>Ciclo fechado, aguardando pagamento</span>
                </div>
              </div>
              <div className={styles.highlights}>
                {groups.toPay.map((invoice) => (
                  <InvoiceHighlight key={invoice.id} invoice={invoice} onOpen={setOpenInvoice} />
                ))}
              </div>
            </section>
          ) : null}

          {groups.current.length > 0 ? (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionText}>
                  <h2 className={styles.sectionTitle}>Fatura atual</h2>
                  <span className={styles.sectionMeta}>Ciclo em andamento, ainda aceita compras</span>
                </div>
              </div>
              <div className={styles.highlights}>
                {groups.current.map((invoice) => (
                  <InvoiceHighlight key={invoice.id} invoice={invoice} onOpen={setOpenInvoice} />
                ))}
              </div>
            </section>
          ) : null}

          {groups.upcoming.length > 0 ? (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionText}>
                  <h2 className={styles.sectionTitle}>Próximas faturas</h2>
                  <span className={styles.sectionMeta}>
                    {countLabel(visibleUpcoming.length)}
                    <span className={styles.separator} aria-hidden="true">
                      ·
                    </span>
                    Total <Amount value={sum(visibleUpcoming)} size="sm" tone="muted" />
                  </span>
                </div>
                <Select
                  className={styles.rangeFilter}
                  options={upcomingRangeOptions}
                  value={upcomingRange}
                  onChange={setUpcomingRange}
                  aria-label="Período das próximas faturas"
                />
              </div>
              {visibleUpcoming.length > 0 ? (
                <ul className={styles.rows}>
                  {visibleUpcoming.map((invoice) => (
                    <InvoiceRow key={invoice.id} invoice={invoice} onOpen={setOpenInvoice} />
                  ))}
                </ul>
              ) : (
                <p className={styles.sectionEmpty}>
                  Nenhuma fatura futura nesse período. As {groups.upcoming.length} restantes aparecem em
                  &ldquo;Todas as futuras&rdquo;.
                </p>
              )}
            </section>
          ) : null}

          {groups.past.length > 0 ? (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionText}>
                  <h2 className={styles.sectionTitle}>Faturas anteriores</h2>
                  <span className={styles.sectionMeta}>
                    {countLabel(visiblePast.length)}
                    <span className={styles.separator} aria-hidden="true">
                      ·
                    </span>
                    Total <Amount value={sum(visiblePast)} size="sm" tone="muted" />
                  </span>
                </div>
                <Select
                  className={styles.rangeFilter}
                  options={pastRangeOptions}
                  value={pastRange}
                  onChange={setPastRange}
                  aria-label="Período das faturas anteriores"
                />
              </div>
              {visiblePast.length > 0 ? (
                <ul className={styles.rows}>
                  {visiblePast.map((invoice) => (
                    <InvoiceRow key={invoice.id} invoice={invoice} onOpen={setOpenInvoice} />
                  ))}
                </ul>
              ) : (
                <p className={styles.sectionEmpty}>
                  Nenhuma fatura nesse período. As {groups.past.length} anteriores aparecem em &ldquo;Todas as
                  anteriores&rdquo;.
                </p>
              )}
            </section>
          ) : null}
        </div>
      )}

      <InvoiceDetailModal invoice={openInvoice} onClose={() => setOpenInvoice(null)} />
    </>
  );
}
