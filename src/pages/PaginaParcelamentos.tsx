import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowDownUp, CircleDot, CreditCard, Layers, Plus } from 'lucide-react';
import { ValorMonetario, BarraResumo } from '@/components/comum';
import {
  CartaoParcelamento,
  ModalFormularioParcelamento,
  ModalParcelasCompra,
  aplicarConsultaCompra,
  consultaCompraPadrao,
  opcoesOrdenacaoCompra,
  opcoesSituacaoCompra,
} from '@/components/parcelamentos';
import type { ConsultaCompra, OrdenacaoCompra, SituacaoCompraFiltro } from '@/components/parcelamentos';
import { CabecalhoPagina } from '@/components/layout';
import { Botao, Painel, DialogoConfirmacao, EstadoVazio, BlocoCarregando, CampoSelecao } from '@/components/ui';
import { ehCartaoCredito, rotuloQuantidadeParcelas } from '@/constants/cartoes';
import { useDadosAssincronos } from '@/hooks/useDadosAssincronos';
import { usePagamentoParcela } from '@/hooks/usePagamentoParcela';
import { useNotificacoes } from '@/providers/ProvedorNotificacoes';
import { PARAMETRO_CARTAO, PARAMETRO_COMPRA } from '@/routes/caminhos';
import { cartoesService, categoriasService } from '@/services';
import type { CompraParceladaDTO, ID, Opcao, ParcelaDTO, PlanoCompraParceladaDTO, SalvarCompraParceladaDTO } from '@/types';
import { formatarMesCurto } from '@/utils/formatacao';
import styles from './PaginaParcelamentos.module.css';

const TODOS_CARTOES = 'all';

export function PaginaParcelamentos() {
  const [cardId, setCardId] = useState<string>(TODOS_CARTOES);
  const [query, setQuery] = useState<ConsultaCompra>(consultaCompraPadrao);
  const [editing, setEditing] = useState<CompraParceladaDTO | null>(null);
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState<CompraParceladaDTO | null>(null);
  const [scheduleId, setScheduleId] = useState<ID | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useNotificacoes();

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
        cartoesService.listarComprasParceladas(undefined, signal),
        cartoesService.listar(signal),
        categoriasService.listar('DESPESA', signal),
      ]),
    [],
  );

  const { dados, carregando, erro, recarregar } = useDadosAssincronos(fetchData);
  const pagamento = usePagamentoParcela(dados, recarregar);

  const allPlans = useMemo(() => dados?.[0] ?? [], [dados]);
  const cards = useMemo(() => dados?.[1] ?? [], [dados]);
  const categories = useMemo(() => dados?.[2] ?? [], [dados]);

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
    const installmentPlans = active.filter((plan) => plan.compra.parcelas > 1);
    const monthly = installmentPlans.reduce((sum, plan) => sum + (plan.parcelaAtual?.valor ?? 0), 0);

    return {
      remaining: active.reduce((sum, plan) => sum + plan.valorRestante, 0),
      monthly: Math.round(monthly * 100) / 100,
      paid: plans.reduce((sum, plan) => sum + plan.valorPago, 0),
      activeCount: active.length,
      installmentCount: installmentPlans.length,
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
        await cartoesService.atualizarCompraParcelada(editing.id, payload);
        toast.sucesso(`${noun} atualizada com sucesso!`, payload.descricao);
      } else {
        await cartoesService.criarCompraParcelada(payload);
        toast.sucesso(
          `${noun} cadastrada com sucesso!`,
          `${rotuloQuantidadeParcelas(payload.parcelas)} · ${payload.descricao}`,
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
      await cartoesService.excluirCompraParcelada(removing.id);
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

  return (
    <>
      <CabecalhoPagina
        titulo="Compras parceladas"
        descricao="Quanto já foi pago, quanto falta e em quais faturas as parcelas caem"
        acoes={
          <>
            {creditCards.length > 1 ? (
              <CampoSelecao
                className={styles.filter}
                larguraPelaMaiorOpcao
                tamanho="sm"
                prefixo="Cartão:"
                icone={CreditCard}
                opcoes={cardOptions}
                value={cardId}
                onChange={setCardId}
                aria-label="Filtrar compras por cartão"
              />
            ) : null}
            {plans.length > 0 ? (
              <>
                <CampoSelecao
                  className={styles.filter}
                  larguraPelaMaiorOpcao
                  tamanho="sm"
                  icone={CircleDot}
                  prefixo="Situação:"
                  opcoes={opcoesSituacaoCompra}
                  value={query.situacao}
                  onChange={(situacao) =>
                    setQuery((current) => ({ ...current, situacao: situacao as SituacaoCompraFiltro }))
                  }
                  aria-label="Filtrar compras por situação"
                />
                <CampoSelecao
                  className={styles.filter}
                  larguraPelaMaiorOpcao
                  tamanho="sm"
                  icone={ArrowDownUp}
                  prefixo="Ordenar:"
                  opcoes={opcoesOrdenacaoCompra}
                  value={query.ordenacao}
                  onChange={(ordenacao) =>
                    setQuery((current) => ({ ...current, ordenacao: ordenacao as OrdenacaoCompra }))
                  }
                  aria-label="Ordenar compras"
                />
              </>
            ) : null}
            <Botao tamanho="sm" icone={Plus} disabled={noCreditCard} onClick={() => setCreating(true)}>
              Nova compra
            </Botao>
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
                rotulo: 'Total mensal em parcelas',
                valor: <ValorMonetario valor={summary.monthly} tamanho="lg" contarAoAparecer />,
                dica:
                  summary.installmentCount > 0
                    ? `O que ${summary.installmentCount === 1 ? 'a compra parcelada em aberto soma' : `as ${summary.installmentCount} compras parceladas em aberto somam`} por mês nas faturas`
                    : 'Nenhuma compra parcelada em aberto',
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

              {visiblePlans.length === 0 ? (
                <Painel espacamento="none">
                  <EstadoVazio
                    icone={Layers}
                    titulo={query.situacao === 'QUITADAS' ? 'Nenhuma compra quitada' : 'Nenhuma compra em andamento'}
                    descricao="Troque a situação no filtro acima para ver as demais compras."
                    acao={
                      <Botao variante="secondary" onClick={() => setQuery(consultaCompraPadrao)}>
                        Mostrar todas
                      </Botao>
                    }
                  />
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
              {rotuloQuantidadeParcelas(removing.parcelas)} · {removing.nomeCartao}
            </span>
            <ValorMonetario valor={removing.valorTotal} />
          </>
        ) : null}
      </DialogoConfirmacao>
    </>
  );
}
