import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard as CreditCardIcon, Plus } from 'lucide-react';
import { ModalFormularioCartao, BlocoCartao } from '@/components/cartoes';
import { ValorMonetario, BarraResumo } from '@/components/comum';
import { CabecalhoPagina } from '@/components/layout';
import { Botao, Painel, DialogoConfirmacao, EstadoVazio, BlocoCarregando } from '@/components/ui';
import { rotuloTipoCartao, ehCartaoCredito } from '@/constants/cartoes';
import { useDadosAssincronos } from '@/hooks/useDadosAssincronos';
import { useNotificacoes } from '@/providers/ProvedorNotificacoes';
import { PARAMETRO_CARTAO, caminhos } from '@/routes/caminhos';
import { contasService, cartoesService } from '@/services';
import type { CartaoDTO as CardModel, FaturaCartaoDTO, SalvarCartaoDTO } from '@/types';
import styles from './PaginaCartoes.module.css';

export function PaginaCartoes() {
  const [editing, setEditing] = useState<CardModel | null>(null);
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState<CardModel | null>(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const toast = useNotificacoes();

  const fetchData = useCallback(
    (signal: AbortSignal) =>
      Promise.all([
        cartoesService.listar(signal),
        cartoesService.listarFaturas(undefined, signal),
        contasService.listar(signal),
      ]),
    [],
  );

  const { dados, carregando, erro, recarregar } = useDadosAssincronos(fetchData);

  const cards = useMemo(() => dados?.[0] ?? [], [dados]);
  const invoices = useMemo(() => dados?.[1] ?? [], [dados]);
  const accounts = useMemo(() => dados?.[2] ?? [], [dados]);

  const currentInvoices = useMemo(() => {
    const map = new Map<string, FaturaCartaoDTO>();
    for (const invoice of invoices) {
      if (invoice.situacao !== 'ABERTA' && invoice.situacao !== 'FECHADA') continue;
      const existing = map.get(invoice.idCartao);
      if (!existing || invoice.dataVencimento < existing.dataVencimento) map.set(invoice.idCartao, invoice);
    }
    return map;
  }, [invoices]);

  const creditCards = useMemo(() => cards.filter(ehCartaoCredito), [cards]);
  const otherCards = useMemo(() => cards.filter((card) => card.tipo !== 'CREDITO'), [cards]);

  const summary = useMemo(() => {
    const limit = creditCards.reduce((sum, card) => sum + card.limiteCredito, 0);
    const used = creditCards.reduce((sum, card) => sum + (card.limiteComprometido ?? 0), 0);
    const openTotal = [...currentInvoices.values()].reduce((sum, invoice) => sum + invoice.total, 0);
    return { limit, used, available: Math.max(limit - used, 0), openTotal };
  }, [creditCards, currentInvoices]);

  const formOpen = creating || editing !== null;

  const closeForm = () => {
    setCreating(false);
    setEditing(null);
  };

  const handleSubmit = async (payload: SalvarCartaoDTO) => {
    setSaving(true);

    try {
      if (editing) {
        await cartoesService.atualizar(editing.id, payload);
        toast.sucesso('Cartão atualizado com sucesso!', payload.nome);
      } else {
        await cartoesService.criar(payload);
        toast.sucesso('Cartão cadastrado com sucesso!', payload.nome);
      }
      closeForm();
      recarregar();
    } catch (submitError) {
      toast.erro('Não foi possível salvar o cartão.', submitError);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!removing) return;
    setSaving(true);

    try {
      await cartoesService.excluir(removing.id);
      toast.sucesso('Cartão excluído com sucesso!', removing.nome);
      setRemoving(null);
      recarregar();
    } catch (deleteError) {
      toast.erro('Não foi possível excluir o cartão.', deleteError);
      setRemoving(null);
    } finally {
      setSaving(false);
    }
  };

  const openInvoices = (card: CardModel) => navigate(`${caminhos.faturas}?${PARAMETRO_CARTAO}=${card.id}`);

  const accountBalances = new Map(accounts.map((account) => [account.id, account.saldo]));

  const renderTile = (card: CardModel) => (
    <BlocoCartao
      key={card.id}
      cartao={card}
      fatura={currentInvoices.get(card.id)}
      saldoConta={card.idConta ? accountBalances.get(card.idConta) : undefined}
      aoEditar={setEditing}
      aoExcluir={setRemoving}
      aoAbrirFaturas={openInvoices}
    />
  );

  return (
    <>
      <CabecalhoPagina
        titulo="Cartões"
        descricao="Limites, faturas e saldos dos seus cartões"
        acoes={
          <Botao tamanho="sm" icone={Plus} onClick={() => setCreating(true)}>
            Novo cartão
          </Botao>
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
            titulo="Não foi possível carregar os cartões"
            descricao={erro.message}
            acao={
              <Botao variante="secondary" onClick={recarregar}>
                Tentar de novo
              </Botao>
            }
          />
        </Painel>
      ) : cards.length === 0 ? (
        <Painel espacamento="none">
          <EstadoVazio
            icone={CreditCardIcon}
            titulo="Nenhum cartão cadastrado"
            descricao="Cadastre um cartão de crédito, débito ou vale para acompanhar limites, faturas e saldos."
            acao={
              <Botao icone={Plus} onClick={() => setCreating(true)}>
                Novo cartão
              </Botao>
            }
          />
        </Painel>
      ) : (
        <div className={`${styles.stack} refreshing`} aria-busy={carregando}>
          {creditCards.length > 0 ? (
            <BarraResumo
              itens={[
                {
                  rotulo: 'Limite disponível',
                  valor: <ValorMonetario valor={summary.available} tamanho="lg" contarAoAparecer />,
                  dica: 'Somando todos os cartões de crédito',
                },
                {
                  rotulo: 'Limite comprometido',
                  valor: <ValorMonetario valor={summary.used} tom="muted" contarAoAparecer />,
                  dica: 'Faturas em aberto e parcelas a vencer',
                },
                {
                  rotulo: 'Faturas atuais',
                  valor: <ValorMonetario valor={summary.openTotal} tom="muted" contarAoAparecer />,
                  dica: 'Total dos ciclos ainda não pagos',
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
              <ul className={styles.grid}>{otherCards.map(renderTile)}</ul>
            </section>
          ) : null}
        </div>
      )}

      <ModalFormularioCartao
        aberto={formOpen}
        cartao={editing}
        contas={accounts}
        salvando={saving}
        aoEnviar={handleSubmit}
        aoFechar={closeForm}
      />

      <DialogoConfirmacao
        aberto={removing !== null}
        titulo="Excluir cartão"
        descricao="Esta ação não pode ser desfeita."
        rotuloConfirmar="Excluir"
        carregando={saving}
        aoConfirmar={handleDelete}
        aoCancelar={() => setRemoving(null)}
      >
        {removing ? (
          <>
            <strong className={styles.confirmTitle}>{removing.nome}</strong>
            <span className={styles.confirmMeta}>
              {removing.instituicao} · {rotuloTipoCartao[removing.tipo]}
            </span>
          </>
        ) : null}
      </DialogoConfirmacao>
    </>
  );
}
