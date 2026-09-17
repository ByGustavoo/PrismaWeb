import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Plus } from 'lucide-react';
import { ValorMonetario } from '@/components/comum';
import { CabecalhoPagina } from '@/components/layout';
import {
  FiltrosLancamentos,
  ModalFormularioLancamento,
  ListaLancamentos,
  TabelaLancamentos,
  ModalFormularioTransferencia,
  AlternadorVisualizacao,
  aplicarConsulta,
  consultaVazia,
  temFiltrosAtivos,
  direcaoInicialOrdenacao,
  totalLiquido,
} from '@/components/lancamentos';
import type { CampoOrdenacao, ConsultaLancamento, VisualizacaoLancamentos } from '@/components/lancamentos';
import { Botao, Painel, DialogoConfirmacao, EstadoVazio, BlocoCarregando } from '@/components/ui';
import { CHAVE_VISUALIZACAO_LANCAMENTOS } from '@/constants/aplicacao';
import { rotuloTipoLancamento } from '@/constants/lancamentos';
import { useDadosAssincronos } from '@/hooks/useDadosAssincronos';
import { useArmazenamentoLocal } from '@/hooks/useArmazenamentoLocal';
import { useEhCompacto } from '@/hooks/useConsultaMidia';
import { useNotificacoes } from '@/providers/ProvedorNotificacoes';
import {
  PARAMETRO_CONTA,
  PARAMETRO_CATEGORIA,
  PARAMETRO_EDITAR_LANCAMENTO,
  PARAMETRO_NOVO_LANCAMENTO,
  PARAMETRO_BUSCA,
  valoresNovoLancamento,
} from '@/routes/caminhos';
import { contasService, categoriasService, lancamentosService } from '@/services';
import type { LancamentoDTO, SalvarLancamentoDTO, TipoLancamento } from '@/types';
import { formatarDataCompleta } from '@/utils/formatacao';
import styles from './PaginaLancamentos.module.css';

interface PaginaLancamentosProps {
  tipo?: TipoLancamento;
  titulo: string;
  descricao: string;
}

type ModoFormulario = 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA';

export function PaginaLancamentos({ tipo, titulo, descricao }: PaginaLancamentosProps) {
  const [query, setQuery] = useState<ConsultaLancamento>(consultaVazia);
  const [formMode, setFormMode] = useState<ModoFormulario | null>(null);
  const [editing, setEditing] = useState<LancamentoDTO | null>(null);
  const [removing, setRemoving] = useState<LancamentoDTO | null>(null);
  const [pendingEditId, setPendingEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useNotificacoes();
  const isCompact = useEhCompacto();
  const [preferredView, setPreferredView] = useArmazenamentoLocal<VisualizacaoLancamentos>(
    CHAVE_VISUALIZACAO_LANCAMENTOS,
    'table',
  );
  const view = isCompact ? 'cards' : preferredView;

  useEffect(() => {
    const requestedForm = searchParams.get(PARAMETRO_NOVO_LANCAMENTO);
    const requestedEdit = searchParams.get(PARAMETRO_EDITAR_LANCAMENTO);
    const search = searchParams.get(PARAMETRO_BUSCA);
    const categoryId = searchParams.get(PARAMETRO_CATEGORIA);
    const accountId = searchParams.get(PARAMETRO_CONTA);

    if (!requestedForm && !requestedEdit && !search && !categoryId && !accountId) return;

    const mode = requestedForm
      ? valoresNovoLancamento[requestedForm as keyof typeof valoresNovoLancamento]
      : undefined;

    if (mode) {
      setEditing(null);
      setFormMode(mode);
    }

    if (requestedEdit) setPendingEditId(requestedEdit);

    if (search || categoryId || accountId) {
      setQuery((current) => ({
        ...consultaVazia,
        campoOrdenacao: current.campoOrdenacao,
        direcaoOrdenacao: current.direcaoOrdenacao,
        ...(search ? { busca: search } : {}),
        ...(categoryId ? { idCategoria: categoryId } : {}),
        ...(accountId ? { idOrigem: accountId } : {}),
      }));
    }

    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  const fetchTransactions = useCallback(
    (signal: AbortSignal) => lancamentosService.listar(tipo ? { tipo: tipo } : {}, signal),
    [tipo],
  );

  const fetchCatalog = useCallback(
    (signal: AbortSignal) =>
      Promise.all([categoriasService.listar(undefined, signal), contasService.listarOrigens(signal)]),
    [],
  );

  const { dados, carregando, erro, recarregar } = useDadosAssincronos(fetchTransactions, [tipo]);
  const { dados: catalog } = useDadosAssincronos(fetchCatalog);

  useEffect(() => {
    if (!pendingEditId || !dados) return;

    const found = dados.find((item) => item.id === pendingEditId);
    setPendingEditId(null);

    if (found) {
      setEditing(found);
      setFormMode(found.tipo);
    }
  }, [pendingEditId, dados]);

  const categories = catalog?.[0] ?? [];
  const sources = catalog?.[1] ?? [];

  const source = useMemo(() => dados ?? [], [dados]);
  const transactions = useMemo(() => aplicarConsulta(source, query), [source, query]);
  const total = totalLiquido(transactions);
  const filtered = temFiltrosAtivos(query);

  const patchQuery = (patch: Partial<ConsultaLancamento>) => setQuery((current) => ({ ...current, ...patch }));

  const clearFilters = () =>
    setQuery((current) => ({
      ...consultaVazia,
      campoOrdenacao: current.campoOrdenacao,
      direcaoOrdenacao: current.direcaoOrdenacao,
    }));

  const handleSort = (field: CampoOrdenacao) =>
    setQuery((current) =>
      current.campoOrdenacao === field
        ? { ...current, direcaoOrdenacao: current.direcaoOrdenacao === 'asc' ? 'desc' : 'asc' }
        : { ...current, campoOrdenacao: field, direcaoOrdenacao: direcaoInicialOrdenacao[field] },
    );

  const closeForm = () => {
    setFormMode(null);
    setEditing(null);
  };

  const openCreate = (mode: ModoFormulario) => {
    setEditing(null);
    setFormMode(mode);
  };

  const openEdit = (transaction: LancamentoDTO) => {
    setEditing(transaction);
    setFormMode(transaction.tipo);
  };

  const handleSubmit = async (payload: SalvarLancamentoDTO) => {
    setSaving(true);
    const noun = rotuloTipoLancamento[payload.tipo];

    try {
      if (editing) {
        await lancamentosService.atualizar(editing.id, payload);
        toast.sucesso(`${noun} atualizada com sucesso!`, payload.descricao);
      } else {
        await lancamentosService.criar(payload);
        toast.sucesso(`${noun} cadastrada com sucesso!`, payload.descricao);
      }
      closeForm();
      recarregar();
    } catch (submitError) {
      toast.erro('Não foi possível salvar o lançamento.', submitError);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!removing) return;
    setSaving(true);

    try {
      await lancamentosService.excluir(removing.id);
      toast.sucesso(`${rotuloTipoLancamento[removing.tipo]} excluída com sucesso!`, removing.descricao);
      setRemoving(null);
      recarregar();
    } catch (deleteError) {
      toast.erro('Não foi possível excluir o lançamento.', deleteError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <CabecalhoPagina
        titulo={titulo}
        descricao={descricao}
        acoes={
          tipo ? (
            <Botao tamanho="sm" icone={Plus} onClick={() => openCreate(tipo)}>
              Nova {rotuloTipoLancamento[tipo].toLowerCase()}
            </Botao>
          ) : (
            <>
              <Botao variante="secondary" tamanho="sm" icone={Plus} onClick={() => openCreate('RECEITA')}>
                Receita
              </Botao>
              <Botao variante="secondary" tamanho="sm" icone={Plus} onClick={() => openCreate('DESPESA')}>
                Despesa
              </Botao>
              <Botao tamanho="sm" icone={Plus} onClick={() => openCreate('TRANSFERENCIA')}>
                Transferência
              </Botao>
            </>
          )
        }
      />

      <Painel espacamento="sm">
        <div className={styles.toolbar}>
          <FiltrosLancamentos
            consulta={query}
            aoAlterar={patchQuery}
            aoLimpar={clearFilters}
            origem={source}
            mostrarFiltroTipo={!tipo}
            mostrarFiltroCategoria={tipo !== 'TRANSFERENCIA'}
          />

          <div className={styles.summary}>
            <div className={styles.summaryCount}>
              <span className={styles.summaryLabel}>
                {transactions.length} {transactions.length === 1 ? 'lançamento' : 'lançamentos'}
              </span>

              {isCompact ? null : <AlternadorVisualizacao valor={preferredView} aoAlterar={setPreferredView} />}
            </div>
            {tipo === 'TRANSFERENCIA' ? (
              <span className={styles.summaryLabel}>Transferências não entram no resultado do período</span>
            ) : (
              <span className={styles.summaryTotal}>
                <span className={styles.summaryLabel}>Resultado do período</span>
                <ValorMonetario valor={total} tom={total >= 0 ? 'positive' : 'negative'} sinal="auto" />
              </span>
            )}
          </div>
        </div>

        {carregando ? (
          <BlocoCarregando linhas={6} altura={320} />
        ) : erro ? (
          <EstadoVazio
            titulo="Não foi possível carregar os lançamentos"
            descricao={erro.message}
            acao={
              <Botao variante="secondary" onClick={recarregar}>
                Tentar de novo
              </Botao>
            }
          />
        ) : transactions.length === 0 ? (
          <EstadoVazio
            icone={Filter}
            titulo={filtered ? 'Nenhum lançamento encontrado' : 'Nada registrado por aqui ainda'}
            descricao={
              filtered
                ? 'Nenhum lançamento atende aos filtros selecionados.'
                : 'Cadastre o primeiro lançamento para acompanhar suas movimentações.'
            }
            acao={
              filtered ? (
                <Botao variante="secondary" onClick={clearFilters}>
                  Limpar filtros
                </Botao>
              ) : (
                <Botao icone={Plus} onClick={() => openCreate(tipo ?? 'DESPESA')}>
                  Novo lançamento
                </Botao>
              )
            }
          />
        ) : view === 'cards' ? (
          <ListaLancamentos
            lancamentos={transactions}
            campoOrdenacao={query.campoOrdenacao}
            direcaoOrdenacao={query.direcaoOrdenacao}
            aoOrdenar={handleSort}
            mostrarCategoria={tipo !== 'TRANSFERENCIA'}
            aoEditar={openEdit}
            aoExcluir={setRemoving}
          />
        ) : (
          <TabelaLancamentos
            lancamentos={transactions}
            campoOrdenacao={query.campoOrdenacao}
            direcaoOrdenacao={query.direcaoOrdenacao}
            aoOrdenar={handleSort}
            mostrarCategoria={tipo !== 'TRANSFERENCIA'}
            aoEditar={openEdit}
            aoExcluir={setRemoving}
          />
        )}
      </Painel>

      <ModalFormularioLancamento
        aberto={formMode === 'RECEITA' || formMode === 'DESPESA'}
        tipo={formMode === 'RECEITA' ? 'RECEITA' : 'DESPESA'}
        lancamento={editing}
        categorias={categories}
        origens={sources}
        salvando={saving}
        aoEnviar={handleSubmit}
        aoFechar={closeForm}
      />

      <ModalFormularioTransferencia
        aberto={formMode === 'TRANSFERENCIA'}
        lancamento={editing}
        origens={sources}
        salvando={saving}
        aoEnviar={handleSubmit}
        aoFechar={closeForm}
      />

      <DialogoConfirmacao
        aberto={removing !== null}
        titulo="Excluir lançamento"
        descricao="Esta ação não pode ser desfeita."
        rotuloConfirmar="Excluir"
        carregando={saving}
        aoConfirmar={handleDelete}
        aoCancelar={() => setRemoving(null)}
      >
        {removing ? (
          <>
            <strong className={styles.confirmTitle}>{removing.descricao}</strong>
            <span className={styles.confirmMeta}>
              {rotuloTipoLancamento[removing.tipo]} · {formatarDataCompleta(removing.data)} · {removing.nomeOrigem}
            </span>
            <ValorMonetario valor={removing.valor} tom={removing.tipo === 'DESPESA' ? 'negative' : 'default'} />
          </>
        ) : null}
      </DialogoConfirmacao>
    </>
  );
}
