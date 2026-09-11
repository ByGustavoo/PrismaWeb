import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CreditCard, Layers, Plus } from 'lucide-react';
import { ValorMonetario, BarraResumo } from '@/components/comum';
import { CartaoParcelamento, ModalFormularioParcelamento } from '@/components/parcelamentos';
import { CabecalhoPagina } from '@/components/layout';
import { Botao, Painel, DialogoConfirmacao, EstadoVazio, BlocoCarregando, CampoSelecao } from '@/components/ui';
import { ehCartaoCredito } from '@/constants/cartoes';
import { useDadosAssincronos } from '@/hooks/useDadosAssincronos';
import { useNotificacoes } from '@/providers/ProvedorNotificacoes';
import { PARAMETRO_CARTAO } from '@/routes/caminhos';
import { cartoesService, categoriasService } from '@/services';
import type { CompraParceladaDTO, Opcao, SalvarCompraParceladaDTO } from '@/types';
import { formatarMesCurto } from '@/utils/formatacao';
import styles from './PaginaParcelamentos.module.css';

const TODOS_CARTOES = 'all';

export function PaginaParcelamentos() {
  const [cardId, setCardId] = useState<string>(TODOS_CARTOES);
  const [editing, setEditing] = useState<CompraParceladaDTO | null>(null);
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState<CompraParceladaDTO | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useNotificacoes();

  useEffect(() => {
    const requested = searchParams.get(PARAMETRO_CARTAO);
    if (!requested) return;
    setCardId(requested);
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

  const summary = useMemo(() => {
    const active = plans.filter((plan) => plan.parcelasRestantes > 0);
    const lastMonth = active
      .map((plan) => plan.cronograma[plan.cronograma.length - 1]?.mes ?? '')
      .filter(Boolean)
      .sort()
      .at(-1);

    return {
      remaining: active.reduce((sum, plan) => sum + plan.valorRestante, 0),
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

    try {
      if (editing) {
        await cartoesService.atualizarCompraParcelada(editing.id, payload);
        toast.sucesso('Compra atualizada', payload.descricao);
      } else {
        await cartoesService.criarCompraParcelada(payload);
        toast.sucesso('Compra parcelada cadastrada', `${payload.parcelas}x · ${payload.descricao}`);
      }
      closeForm();
      recarregar();
    } catch (submitError) {
      toast.erro(
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
      await cartoesService.excluirCompraParcelada(removing.id);
      toast.sucesso('Compra parcelada excluída', removing.descricao);
      setRemoving(null);
      recarregar();
    } catch (deleteError) {
      toast.erro(
        'Não foi possível excluir a compra',
        deleteError instanceof Error ? deleteError.message : undefined,
      );
      setRemoving(null);
    } finally {
      setSaving(false);
    }
  };

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
                tamanho="sm"
                prefixo="Cartão:"
                icone={CreditCard}
                opcoes={cardOptions}
                value={cardId}
                onChange={setCardId}
                aria-label="Filtrar compras por cartão"
              />
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
            titulo="Nenhuma compra parcelada"
            descricao="Cadastre uma compra em várias vezes para acompanhar as parcelas pagas, as que faltam e em quais meses elas caem."
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
                  ? `Última parcela em ${formatarMesCurto(summary.lastMonth)}`
                  : 'Nenhuma parcela em aberto',
              },
              {
                rotulo: 'Já pago',
                valor: <ValorMonetario valor={summary.paid} tom="positive" contarAoAparecer />,
                dica: 'Somando todas as compras da lista',
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
                titulo="Nenhuma compra parcelada neste cartão"
                descricao="Escolha outro cartão ou cadastre uma compra em várias vezes."
              />
            </Painel>
          ) : (
            <ul className={styles.list}>
              {plans.map((plan) => (
                <CartaoParcelamento
                  key={plan.compra.id}
                  plano={plan}
                  aoEditar={setEditing}
                  aoExcluir={setRemoving}
                />
              ))}
            </ul>
          )}
        </div>
      )}

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
        titulo="Excluir compra parcelada"
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
              {removing.parcelas}x · {removing.nomeCartao}
            </span>
            <ValorMonetario valor={removing.valorTotal} />
          </>
        ) : null}
      </DialogoConfirmacao>
    </>
  );
}
