import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CreditCard, Receipt } from 'lucide-react';
import { ValorMonetario, BarraResumo } from '@/components/comum';
import { ModalDetalheFatura, DestaqueFatura, LinhaFatura } from '@/components/faturas';
import { CabecalhoPagina } from '@/components/layout';
import { Botao, Painel, EstadoVazio, BlocoCarregando, CampoSelecao } from '@/components/ui';
import { ehCartaoCredito } from '@/constants/cartoes';
import { useDadosAssincronos } from '@/hooks/useDadosAssincronos';
import { PARAMETRO_CARTAO } from '@/routes/caminhos';
import { cartoesService } from '@/services';
import type { FaturaCartaoDTO, Opcao } from '@/types';
import { chaveMesPorDeslocamento, mesesEntre } from '@/utils/data';
import { capitalizar, formatarRotuloVencimento } from '@/utils/formatacao';
import styles from './PaginaFaturas.module.css';

const TODOS_CARTOES = 'all';

const TODOS_MESES = 'all';

const opcoesJanelaProximas: Opcao[] = [
  { valor: '3', rotulo: 'Próximos 3 meses' },
  { valor: '6', rotulo: 'Próximos 6 meses' },
  { valor: TODOS_MESES, rotulo: 'Todas as futuras' },
];

const opcoesJanelaAnteriores: Opcao[] = [
  { valor: '3', rotulo: 'Últimos 3 meses' },
  { valor: '6', rotulo: 'Últimos 6 meses' },
  { valor: TODOS_MESES, rotulo: 'Todas as anteriores' },
];

function dentroDaJanela(month: string, thisMonth: string, range: string): boolean {
  if (range === TODOS_MESES) return true;
  return Math.abs(mesesEntre(thisMonth, month) - 1) <= Number(range);
}

function rotuloQuantidade(count: number): string {
  return `${count} ${count === 1 ? 'fatura' : 'faturas'}`;
}

export function PaginaFaturas() {
  const [cardId, setCardId] = useState<string>(TODOS_CARTOES);
  const [upcomingRange, setUpcomingRange] = useState('3');
  const [pastRange, setPastRange] = useState('3');
  const [openInvoice, setOpenInvoice] = useState<FaturaCartaoDTO | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const requested = searchParams.get(PARAMETRO_CARTAO);
    if (!requested) return;
    setCardId(requested);
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  const fetchData = useCallback(
    (signal: AbortSignal) =>
      Promise.all([cartoesService.listarFaturas(undefined, signal), cartoesService.listar(signal)]),
    [],
  );

  const { dados, carregando, erro, recarregar } = useDadosAssincronos(fetchData);

  const allInvoices = useMemo(() => dados?.[0] ?? [], [dados]);
  const creditCards = useMemo(() => (dados?.[1] ?? []).filter(ehCartaoCredito), [dados]);

  const cardOptions = useMemo<Opcao[]>(
    () => [
      { valor: TODOS_CARTOES, rotulo: 'Todos' },
      ...creditCards.map((card) => ({ valor: card.id, rotulo: card.nome })),
    ],
    [creditCards],
  );

  const invoices = useMemo(
    () => (cardId === TODOS_CARTOES ? allInvoices : allInvoices.filter((invoice) => invoice.idCartao === cardId)),
    [allInvoices, cardId],
  );

  const groups = useMemo(() => {
    const toPay = invoices.filter((item) => item.situacao === 'FECHADA' || item.situacao === 'VENCIDA');
    const current = invoices.filter((item) => item.situacao === 'ABERTA');
    const upcoming = invoices.filter((item) => item.situacao === 'FUTURA');
    const past = invoices.filter((item) => item.situacao === 'PAGA').slice().reverse();

    return { toPay, current, upcoming, past };
  }, [invoices]);

  const sum = (list: FaturaCartaoDTO[]) => list.reduce((total, item) => total + item.total, 0);

  const summary = useMemo(() => {
    const nextDue = groups.toPay[0]?.dataVencimento ?? groups.current[0]?.dataVencimento;

    return {
      toPay: sum(groups.toPay),
      current: sum(groups.current),
      upcoming: sum(groups.upcoming),
      upcomingCount: groups.upcoming.length,
      nextDue,
    };
  }, [groups]);

  const thisMonth = chaveMesPorDeslocamento(0);

  const visibleUpcoming = useMemo(
    () => groups.upcoming.filter((invoice) => dentroDaJanela(invoice.mes, thisMonth, upcomingRange)),
    [groups.upcoming, thisMonth, upcomingRange],
  );

  const visiblePast = useMemo(
    () => groups.past.filter((invoice) => dentroDaJanela(invoice.mes, thisMonth, pastRange)),
    [groups.past, thisMonth, pastRange],
  );

  return (
    <>
      <CabecalhoPagina
        titulo="Faturas"
        descricao="O ciclo em aberto, o que ainda vem e o que já foi pago"
        acoes={
          !carregando && !erro && creditCards.length > 1 ? (
            <CampoSelecao
              className={styles.filter}
              tamanho="sm"
              prefixo="Cartão:"
              icone={CreditCard}
              opcoes={cardOptions}
              value={cardId}
              onChange={setCardId}
              aria-label="Filtrar faturas por cartão"
            />
          ) : null
        }
      />

      {carregando && !dados ? (
        <div className={styles.stack} aria-busy="true">
          <Painel espacamento="none">
            <BlocoCarregando linhas={2} altura={92} />
          </Painel>
          <Painel espacamento="none">
            <BlocoCarregando linhas={5} altura={300} />
          </Painel>
        </div>
      ) : erro ? (
        <Painel espacamento="none">
          <EstadoVazio
            titulo="Não foi possível carregar as faturas"
            descricao={erro.message}
            acao={
              <Botao variante="secondary" onClick={recarregar}>
                Tentar de novo
              </Botao>
            }
          />
        </Painel>
      ) : creditCards.length === 0 ? (
        <Painel espacamento="none">
          <EstadoVazio
            icone={CreditCard}
            titulo="Nenhum cartão de crédito cadastrado"
            descricao="Faturas nascem de um cartão de crédito. Cadastre um em Cartões para acompanhar fechamento, vencimento e compras."
          />
        </Painel>
      ) : (
        <div className={`${styles.stack} refreshing`} aria-busy={carregando}>
          <BarraResumo
            itens={[
              {
                rotulo: 'A pagar agora',
                valor: <ValorMonetario valor={summary.toPay} tamanho="lg" contarAoAparecer />,
                dica: summary.nextDue
                  ? capitalizar(formatarRotuloVencimento(summary.nextDue))
                  : 'Nenhuma fatura fechada',
              },
              {
                rotulo: 'Ciclo em aberto',
                valor: <ValorMonetario valor={summary.current} tom="muted" contarAoAparecer />,
                dica: 'Ainda acumulando compras',
              },
              {
                rotulo: 'Já comprometido',
                valor: <ValorMonetario valor={summary.upcoming} tom="muted" contarAoAparecer />,
                dica: `${summary.upcomingCount} ${summary.upcomingCount === 1 ? 'fatura futura' : 'faturas futuras'}`,
              },
            ]}
          />

          {invoices.length === 0 ? (
            <Painel espacamento="none">
              <EstadoVazio
                icone={Receipt}
                titulo="Nenhuma fatura para este cartão"
                descricao="Assim que houver uma compra, a fatura do ciclo aparece aqui."
              />
            </Painel>
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
                  <DestaqueFatura key={invoice.id} fatura={invoice} aoAbrir={setOpenInvoice} />
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
                  <DestaqueFatura key={invoice.id} fatura={invoice} aoAbrir={setOpenInvoice} />
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
                    {rotuloQuantidade(visibleUpcoming.length)}
                    <span className={styles.separator} aria-hidden="true">
                      ·
                    </span>
                    Total <ValorMonetario valor={sum(visibleUpcoming)} tamanho="sm" tom="muted" />
                  </span>
                </div>
                <CampoSelecao
                  className={styles.rangeFilter}
                  opcoes={opcoesJanelaProximas}
                  value={upcomingRange}
                  onChange={setUpcomingRange}
                  aria-label="Período das próximas faturas"
                />
              </div>
              {visibleUpcoming.length > 0 ? (
                <ul className={styles.rows}>
                  {visibleUpcoming.map((invoice) => (
                    <LinhaFatura key={invoice.id} fatura={invoice} aoAbrir={setOpenInvoice} />
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
                    {rotuloQuantidade(visiblePast.length)}
                    <span className={styles.separator} aria-hidden="true">
                      ·
                    </span>
                    Total <ValorMonetario valor={sum(visiblePast)} tamanho="sm" tom="muted" />
                  </span>
                </div>
                <CampoSelecao
                  className={styles.rangeFilter}
                  opcoes={opcoesJanelaAnteriores}
                  value={pastRange}
                  onChange={setPastRange}
                  aria-label="Período das faturas anteriores"
                />
              </div>
              {visiblePast.length > 0 ? (
                <ul className={styles.rows}>
                  {visiblePast.map((invoice) => (
                    <LinhaFatura key={invoice.id} fatura={invoice} aoAbrir={setOpenInvoice} />
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

      <ModalDetalheFatura fatura={openInvoice} aoFechar={() => setOpenInvoice(null)} />
    </>
  );
}
