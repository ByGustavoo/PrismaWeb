import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CreditCard, Layers, Plus } from 'lucide-react';
import { ValorMonetario, BarraResumo, ResultadoFiltros } from '@/components/comum';
import {
  CartaoParcelamento,
  FiltrosParcelamentos,
  ModalFormularioParcelamento,
  ModalParcelasCompra,
  aplicarConsultaCompra,
  consultaCompraPadrao,
  rotuloResultadoCompras,
  temConsultaCompraAtiva,
} from '@/components/compraparcelada';
import type { ConsultaCompra } from '@/components/compraparcelada';
import { CabecalhoPagina } from '@/components/layout';
import { Botao, Painel, DialogoConfirmacao, EstadoVazio, BlocoCarregando } from '@/components/ui';
import { ehCartaoCredito, TODOS_CARTOES } from '@/constants/cartao/cartao';
import { rotuloQuantidadeParcelas } from '@/constants/compraparcelada/compraParcelada';
import { useDadosAssincronos } from '@/hooks/useDadosAssincronos';
import { useCategoriasDoTipo } from '@/hooks/useCatalogo';
import { usePagamentoParcela } from '@/hooks/compraparcelada/usePagamentoParcela';
import { useFiltrosEmpilhados } from '@/hooks/useConsultaMidia';
import { useNotificacoes } from '@/providers/ProvedorNotificacoes';
import { PARAMETRO_CARTAO, PARAMETRO_COMPRA } from '@/routes/caminhos';
import { cartaoService, compraParceladaService } from '@/services';
import type { CompraParceladaDTO, ID, Opcao, ParcelaDTO, PlanoCompraParceladaDTO, SalvarCompraParceladaDTO } from '@/types';
import { hojeISO } from '@/utils/data';
import { capitalizar, formatarMesCurto, formatarRotuloMes } from '@/utils/formatacao';
import styles from './PaginaParcelamentos.module.css';

export function PaginaParcelamentos() {
  const [cardId, setCardId] = useState<string>(TODOS_CARTOES);
  const [query, setQuery] = useState<ConsultaCompra>(consultaCompraPadrao);
  const [editing, setEditing] = useState<CompraParceladaDTO | null>(null);
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState<CompraParceladaDTO | null>(null);
  const [scheduleId, setScheduleId] = useState<ID | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const filtrosEmpilhados = useFiltrosEmpilhados();
  const toast = useNotificacoes();
  const searchRef = useRef<HTMLInputElement>(null);

  const limparFiltros = () => {
    setQuery(consultaCompraPadrao);
    searchRef.current?.focus();
  };

  useEffect(() => {
    const requestedCard = searchParams.get(PARAMETRO_CARTAO);
    const requestedPurchase = searchParams.get(PARAMETRO_COMPRA);
    if (!requestedCard && !requestedPurchase) return;
    if (requestedCard) setCardId(requestedCard);
    if (requestedPurchase) setScheduleId(requestedPurchase);
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  const fetchData = useCallback(
    (signal: AbortSignal) =>
      Promise.all([
        compraParceladaService.listar(undefined, signal),
        cartaoService.listar(signal),
      ]),
    [],
  );

  const { dados, carregando, erro, recarregar } = useDadosAssincronos(fetchData);
  const pagamento = usePagamentoParcela(dados, recarregar);

  const allPlans = useMemo(() => dados?.[0] ?? [], [dados]);
  const cards = useMemo(() => dados?.[1] ?? [], [dados]);
  const categories = useCategoriasDoTipo('DESPESA');

  const creditCards = useMemo(() => cards.filter(ehCartaoCredito), [cards]);

  const cardOptions = useMemo<Opcao[]>(
    () => [
      { valor: TODOS_CARTOES, rotulo: 'Todos' },
      ...creditCards.map((card) => ({ valor: card.id, rotulo: card.nome })),
    ],
    [creditCards],
  );

  const plans = useMemo(
    () => (cardId === TODOS_CARTOES ? allPlans : allPlans.filter((plan) => plan.compra.idCartao === cardId)),
    [allPlans, cardId],
  );

  const schedulePlan = useMemo(
    () => allPlans.find((plan) => plan.compra.id === scheduleId) ?? null,
    [allPlans, scheduleId],
  );

  const visiblePlans = useMemo(() => aplicarConsultaCompra(plans, query), [plans, query]);

  const summary = useMemo(() => {
    const active = plans.filter((plan) => plan.parcelasRestantes > 0);
    const lastMonth = active
      .map((plan) => plan.cronograma[plan.cronograma.length - 1]?.mes ?? '')
      .filter(Boolean)
      .sort()
      .at(-1);
    const unpaidInstallments = active.flatMap((plan) =>
      plan.cronograma.filter((installment) => installment.situacao !== 'PAGA'),
    );
    const nextInvoiceMonth = unpaidInstallments
      .map((installment) => installment.mes)
      .sort()
      .at(0);
    const nextInvoiceInstallments = unpaidInstallments.filter((installment) => installment.mes === nextInvoiceMonth);
    const nextInvoiceTotal = nextInvoiceInstallments.reduce((sum, installment) => sum + installment.valor, 0);

    return {
      remaining: active.reduce((sum, plan) => sum + plan.valorRestante, 0),
      nextInvoiceTotal: Math.round(nextInvoiceTotal * 100) / 100,
      nextInvoiceMonth,
      nextInvoiceCount: nextInvoiceInstallments.length,
      paid: plans.reduce((sum, plan) => sum + plan.valorPago, 0),
      activeCount: active.length,
      lastMonth,
    };
  }, [plans]);

  const formOpen = creating || editing !== null;

  const closeForm = () => {
    setCreating(false);
    setEditing(null);
  };

  const handleSubmit = async (payload: SalvarCompraParceladaDTO) => {
    setSaving(true);
    const noun = payload.parcelas === 1 ? 'Compra à vista' : 'Compra parcelada';

    try {
      if (editing) {
        await compraParceladaService.atualizar(editing.id, payload);
        toast.sucesso(`${noun} atualizada com sucesso!`, payload.descricao);
      } else {
        await compraParceladaService.criar(payload);
        toast.sucesso(
          `${noun} cadastrada com sucesso!`,
          `${rotuloQuantidadeParcelas(payload.parcelas)} — ${payload.descricao}`,
        );
      }
      closeForm();
      recarregar();
    } catch (submitError) {
      toast.erro('Não foi possível salvar a compra.', submitError);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!removing) return;
    setSaving(true);

    try {
      await compraParceladaService.excluir(removing.id);
      toast.sucesso('Compra excluída com sucesso!', removing.descricao);
      setRemoving(null);
      recarregar();
    } catch (deleteError) {
      toast.erro('Não foi possível excluir a compra.', deleteError);
      setRemoving(null);
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePayment = (plan: PlanoCompraParceladaDTO, installment: ParcelaDTO) =>
    pagamento.alternar({
      idCompra: plan.compra.id,
      descricao: plan.compra.descricao,
      numero: installment.numero,
      totalParcelas: plan.compra.parcelas,
      pagamentoAntecipado: installment.pagamentoAntecipado,
    });

  const noCreditCard = !carregando && !erro && creditCards.length === 0;
  const newPurchaseButton = (
    <Botao tamanho="sm" icone={Plus} disabled={noCreditCard} onClick={() => setCreating(true)}>
      Nova compra
    </Botao>
  );

  return (
    <>
      <CabecalhoPagina
        titulo="Compras parceladas"
        descricao="Quanto já foi pago, quanto falta e em quais faturas as parcelas caem"
        acoes={
          <>
            {filtrosEmpilhados ? newPurchaseButton : null}
            <FiltrosParcelamentos
              consulta={query}
              aoAlterar={(patch) => setQuery((current) => ({ ...current, ...patch }))}
              cartao={creditCards.length > 1 ? { opcoes: cardOptions, valor: cardId, aoAlterar: setCardId } : undefined}
              mostrarConsulta={plans.length > 0}
              refBusca={searchRef}
            />
            {filtrosEmpilhados ? null : newPurchaseButton}
          </>
        }
      />

      {carregando && !dados ? (
        <div className={styles.stack} aria-busy="true">
          <Painel espacamento="none">
            <BlocoCarregando linhas={2} altura={92} />
          </Painel>
          <Painel espacamento="none">
            <BlocoCarregando linhas={5} altura={280} />
          </Painel>
        </div>
      ) : erro ? (
        <Painel espacamento="none">
          <EstadoVazio
            titulo="Não foi possível carregar as compras parceladas"
            descricao={erro.message}
            acao={
              <Botao variante="secondary" onClick={recarregar}>
                Tentar de novo
              </Botao>
            }
          />
        </Painel>
      ) : noCreditCard ? (
        <Painel espacamento="none">
          <EstadoVazio
            icone={CreditCard}
            titulo="Nenhum cartão de crédito cadastrado"
            descricao="Compras parceladas dependem de um cartão de crédito. Cadastre um em Cartões para começar."
          />
        </Painel>
      ) : allPlans.length === 0 ? (
        <Painel espacamento="none">
          <EstadoVazio
            icone={Layers}
            titulo="Nenhuma compra no cartão"
            descricao="Cadastre uma compra à vista ou parcelada para acompanhar as parcelas pagas, as que faltam e em quais faturas elas caem."
            acao={
              <Botao icone={Plus} onClick={() => setCreating(true)}>
                Nova compra
              </Botao>
            }
          />
        </Painel>
      ) : (
        <div className={`${styles.stack} refreshing`} aria-busy={carregando}>
          <BarraResumo
            itens={[
              {
                rotulo: 'Falta pagar',
                valor: <ValorMonetario valor={summary.remaining} tamanho="lg" contarAoAparecer />,
                dica: summary.lastMonth
                  ? `Soma das parcelas ainda não pagas, até ${formatarMesCurto(summary.lastMonth)}`
                  : 'Nenhuma parcela em aberto',
              },
              {
                rotulo: summary.nextInvoiceMonth
                  ? `Fatura de ${capitalizar(
                      summary.nextInvoiceMonth.startsWith(hojeISO().slice(0, 4))
                        ? formatarRotuloMes(summary.nextInvoiceMonth).replace(/ de \d{4}$/, '')
                        : formatarRotuloMes(summary.nextInvoiceMonth),
                    )}`
                  : 'Próxima fatura',
                valor: <ValorMonetario valor={summary.nextInvoiceTotal} tamanho="lg" contarAoAparecer />,
                dica:
                  summary.nextInvoiceCount > 0
                    ? summary.nextInvoiceCount === 1
                      ? 'Só uma compra cai nela'
                      : `As ${summary.nextInvoiceCount} compras que caem nela, parceladas ou à vista`
                    : 'Nenhuma compra em aberto',
              },
              {
                rotulo: 'Já pago',
                valor: <ValorMonetario valor={summary.paid} tom="positive" contarAoAparecer />,
                dica: 'Parcelas vencidas ou marcadas como pagas',
              },
              {
                rotulo: 'Em andamento',
                valor: <span className={styles.count}>{summary.activeCount}</span>,
                dica: `${plans.length} ${plans.length === 1 ? 'compra cadastrada' : 'compras cadastradas'}`,
              },
            ]}
          />

          {plans.length === 0 ? (
            <Painel espacamento="none">
              <EstadoVazio
                icone={Layers}
                titulo="Nenhuma compra neste cartão"
                descricao="Escolha outro cartão ou cadastre uma compra à vista ou parcelada."
              />
            </Painel>
          ) : (
            <section className={styles.section} aria-labelledby="titulo-lista-compras">
              <h2 id="titulo-lista-compras" className="visually-hidden">
                Compras
              </h2>

              <ResultadoFiltros
                texto={rotuloResultadoCompras(query, visiblePlans.length)}
                visivel={temConsultaCompraAtiva(query) && visiblePlans.length > 0}
                aoLimpar={limparFiltros}
              />

              {visiblePlans.length === 0 ? (
                <Painel espacamento="none">
                  {query.busca.trim() ? (
                    <EstadoVazio
                      icone={Layers}
                      titulo="Nenhuma compra encontrada"
                      descricao="Nenhuma compra corresponde à busca e aos filtros escolhidos."
                      acao={
                        <Botao variante="secondary" onClick={limparFiltros}>
                          Limpar filtros
                        </Botao>
                      }
                    />
                  ) : (
                    <EstadoVazio
                      icone={Layers}
                      titulo={query.situacao === 'QUITADAS' ? 'Nenhuma compra quitada' : 'Nenhuma compra em andamento'}
                      descricao="Troque a situação no filtro acima para ver as demais compras."
                      acao={
                        <Botao variante="secondary" onClick={limparFiltros}>
                          Mostrar todas
                        </Botao>
                      }
                    />
                  )}
                </Painel>
              ) : (
                <ul className={styles.list}>
                  {visiblePlans.map((plan) => (
                    <CartaoParcelamento
                      key={plan.compra.id}
                      plano={plan}
                      aoEditar={setEditing}
                      aoExcluir={setRemoving}
                      aoAbrirParcelas={(opened) => setScheduleId(opened.compra.id)}
                    />
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      )}

      <ModalParcelasCompra
        plano={schedulePlan}
        atualizando={carregando}
        parcelaEmEspera={pagamento.emEspera?.idCompra === schedulePlan?.compra.id ? (pagamento.emEspera?.numero ?? null) : null}
        pagamentoBloqueado={pagamento.emEspera !== null}
        aoAlternarPagamento={handleTogglePayment}
        aoFechar={() => setScheduleId(null)}
      />

      <ModalFormularioParcelamento
        aberto={formOpen}
        compra={editing}
        cartoes={cards}
        categorias={categories}
        salvando={saving}
        aoEnviar={handleSubmit}
        aoFechar={closeForm}
      />

      <DialogoConfirmacao
        aberto={removing !== null}
        titulo="Excluir compra"
        descricao="As parcelas que ainda não venceram saem das próximas faturas."
        rotuloConfirmar="Excluir"
        carregando={saving}
        aoConfirmar={handleDelete}
        aoCancelar={() => setRemoving(null)}
      >
        {removing ? (
          <>
            <strong className={styles.confirmTitle}>{removing.descricao}</strong>
            <span className={styles.confirmMeta}>
              {rotuloQuantidadeParcelas(removing.parcelas)} — {removing.nomeCartao}
            </span>
            <ValorMonetario valor={removing.valorTotal} />
          </>
        ) : null}
      </DialogoConfirmacao>
    </>
  );
}
