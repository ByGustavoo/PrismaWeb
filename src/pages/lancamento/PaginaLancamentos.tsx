import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Filter, Plus } from 'lucide-react';
import { ValorMonetario } from '@/components/comum';
import { CabecalhoPagina } from '@/components/layout';
import {
  FiltrosLancamentos,
  ModalFormularioLancamento,
  ListaLancamentos,
  OrdenacaoLancamentos,
  TabelaLancamentos,
  ModalFormularioTransferencia,
  AlternadorVisualizacao,
  consultaVazia,
  paraFiltroDoServidor,
  temFiltrosAtivos,
  direcaoInicialOrdenacao,
} from '@/components/lancamento';
import type { ConsultaLancamento, VisualizacaoLancamentos } from '@/components/lancamento';
import { Botao, Painel, DialogoConfirmacao, EstadoVazio, BlocoCarregando, Paginacao } from '@/components/ui';
import { CHAVE_VISUALIZACAO_LANCAMENTOS, ESPERA_ENTRE_TECLAS_MS } from '@/constants/aplicacao';
import {
  TAMANHO_PAGINA_LANCAMENTOS,
  TAMANHO_PAGINA_LANCAMENTOS_CARTOES,
  DURACAO_TROCA_VISUALIZACAO_MS,
  DURACAO_SAIDA_VISUALIZACAO_MS,
  DURACAO_SAIDA_ORDENACAO_MS,
  rotuloTipoLancamento,
} from '@/constants/lancamento/lancamento';
import { rotuloFrequencia } from '@/constants/recorrente/recorrente';
import { useCatalogo } from '@/hooks/useCatalogo';
import { useDadosAssincronos } from '@/hooks/useDadosAssincronos';
import { useArmazenamentoLocal } from '@/hooks/useArmazenamentoLocal';
import { useConsultaMidia, useEhCompacto, useEhTablet } from '@/hooks/useConsultaMidia';
import { useTabelaCabe } from '@/hooks/useTabelaCabe';
import { useValorComAtraso } from '@/hooks/useValorComAtraso';
import { useNotificacoes } from '@/providers/ProvedorNotificacoes';
import { useTelas } from '@/providers/ProvedorTelas';
import {
  caminhos,
  PARAMETRO_COMPRA,
  PARAMETRO_INVESTIMENTO,
  PARAMETRO_CONTA,
  PARAMETRO_CATEGORIA,
  PARAMETRO_EDITAR_LANCAMENTO,
  PARAMETRO_NOVO_LANCAMENTO,
  PARAMETRO_BUSCA,
  valoresNovoLancamento,
} from '@/routes/caminhos';
import { lancamentoService } from '@/services';
import type { LancamentoDTO, OrdenacaoLancamento, SalvarLancamentoDTO, TipoLancamento } from '@/types';
import { formatarDataCompleta, formatarInteiro } from '@/utils/formatacao';
import { juntarClasses } from '@/utils/juntarClasses';
import styles from './PaginaLancamentos.module.css';

interface PaginaLancamentosProps {
  tipo?: TipoLancamento;
  titulo: string;
  descricao: string;
}

type ModoFormulario = 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA';

function consultaDaUrl(parametros: URLSearchParams): ConsultaLancamento {
  return {
    ...consultaVazia,
    busca: parametros.get(PARAMETRO_BUSCA) ?? consultaVazia.busca,
    idCategoria: parametros.get(PARAMETRO_CATEGORIA) ?? consultaVazia.idCategoria,
    idOrigem: parametros.get(PARAMETRO_CONTA) ?? consultaVazia.idOrigem,
  };
}

export function PaginaLancamentos({ tipo, titulo, descricao }: PaginaLancamentosProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState<ConsultaLancamento>(() => consultaDaUrl(searchParams));
  const [paginacao, setPaginacao] = useState({ chave: '', inicio: 0 });
  const [alturaReservada, setAlturaReservada] = useState<number | null>(null);
  const listaRef = useRef<HTMLDivElement>(null);
  const [formMode, setFormMode] = useState<ModoFormulario | null>(null);
  const [editing, setEditing] = useState<LancamentoDTO | null>(null);
  const [removing, setRemoving] = useState<LancamentoDTO | null>(null);
  const [pendingEditId, setPendingEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const toast = useNotificacoes();
  const { estaOculto } = useTelas();
  const isCompact = useEhCompacto();
  const movimentoReduzido = useConsultaMidia('(prefers-reduced-motion: reduce)');
  const { categorias: categories, origens: sources } = useCatalogo();
  const [preferredView, setPreferredView] = useArmazenamentoLocal<VisualizacaoLancamentos>(
    CHAVE_VISUALIZACAO_LANCAMENTOS,
    'table',
  );
  const ehTablet = useEhTablet();
  const tamanhoPagina =
    !ehTablet && preferredView === 'cards' ? TAMANHO_PAGINA_LANCAMENTOS_CARTOES : TAMANHO_PAGINA_LANCAMENTOS;

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

  const buscaComAtraso = useValorComAtraso(query.busca, ESPERA_ENTRE_TECLAS_MS);
  const buscaParaServidor = query.busca.trim() === '' ? '' : buscaComAtraso;
  const consultaServidor = useMemo(() => ({ ...query, busca: buscaParaServidor }), [query, buscaParaServidor]);
  const chaveFiltro = JSON.stringify(paraFiltroDoServidor(consultaServidor, tipo, 0, TAMANHO_PAGINA_LANCAMENTOS));
  if (paginacao.chave !== chaveFiltro) setPaginacao({ chave: chaveFiltro, inicio: 0 });
  const inicio = paginacao.chave === chaveFiltro ? paginacao.inicio : 0;
  const pagina = Math.floor(inicio / tamanhoPagina);

  const fetchTransactions = useCallback(
    (signal: AbortSignal) =>
      lancamentoService.listar(paraFiltroDoServidor(consultaServidor, tipo, pagina, tamanhoPagina), signal),
    [consultaServidor, tipo, pagina, tamanhoPagina],
  );

  const { dados, carregando, erro, recarregar } = useDadosAssincronos(fetchTransactions, [
    chaveFiltro,
    pagina,
    tamanhoPagina,
  ]);
  const trocandoPagina =
    carregando && dados !== null && dados.tamanho === tamanhoPagina && dados.pagina !== pagina;

  useEffect(() => {
    if (!trocandoPagina) setAlturaReservada(null);
  }, [trocandoPagina]);

  useEffect(() => {
    if (!dados || dados.itens.length > 0 || dados.quantidadeTotal === 0 || pagina === 0) return;
    setPaginacao({ chave: chaveFiltro, inicio: Math.max(0, dados.quantidadePaginas - 1) * dados.tamanho });
  }, [dados, pagina, chaveFiltro]);

  const irParaPagina = (destino: number) => {
    setAlturaReservada(listaRef.current?.offsetHeight ?? null);
    setPaginacao({ chave: chaveFiltro, inicio: destino * tamanhoPagina });
    listaRef.current?.scrollIntoView({ block: 'start', behavior: movimentoReduzido ? 'auto' : 'smooth' });
    listaRef.current?.focus({ preventScroll: true });
  };

  const openEdit = useCallback(
    (transaction: LancamentoDTO) => {
      if (transaction.parcela) {
        if (!estaOculto(caminhos.parcelamentos)) {
          navigate(`${caminhos.parcelamentos}?${PARAMETRO_COMPRA}=${transaction.parcela.idCompra}`);
        }
        return;
      }

      if (transaction.investimento) {
        if (!estaOculto(caminhos.investimentos)) {
          navigate(`${caminhos.investimentos}?${PARAMETRO_INVESTIMENTO}=${transaction.investimento.idInvestimento}`);
        }
        return;
      }

      setEditing(transaction);
      setFormMode(transaction.tipo);
    },
    [navigate, estaOculto],
  );

  useEffect(() => {
    if (!pendingEditId || !dados) return;

    const found = dados.itens.find((item) => item.id === pendingEditId);
    setPendingEditId(null);

    if (found) {
      openEdit(found);
      return;
    }

    lancamentoService
      .buscar(pendingEditId)
      .then(openEdit)
      .catch((causa: unknown) => toast.erro('Não foi possível abrir o lançamento.', causa));
  }, [pendingEditId, dados, openEdit, toast]);

  const transactions = useMemo(() => dados?.itens ?? [], [dados]);
  const quantidadeTotal = dados?.quantidadeTotal ?? 0;
  const total = dados?.resultado ?? 0;
  const { areaRef: toolbarRef, tabelaRef: tableRef, cabe: tableFits } = useTabelaCabe(transactions);
  const visaoDosDados: VisualizacaoLancamentos =
    dados && !ehTablet ? (dados.tamanho === TAMANHO_PAGINA_LANCAMENTOS_CARTOES ? 'cards' : 'table') : preferredView;
  const view = isCompact || !tableFits ? 'cards' : visaoDosDados;
  const filtered = temFiltrosAtivos(query);

  const [visaoPedida, setVisaoPedida] = useState<VisualizacaoLancamentos | null>(null);
  const visaoAlvo = visaoPedida ?? preferredView;
  const emTroca = !isCompact && tableFits && visaoAlvo !== view;

  useEffect(() => {
    if (!visaoPedida) return;
    const espera = window.setTimeout(() => {
      setPreferredView(visaoPedida);
      setVisaoPedida(null);
    }, DURACAO_SAIDA_VISUALIZACAO_MS);
    return () => window.clearTimeout(espera);
  }, [visaoPedida, setPreferredView]);

  const alterarVisualizacao = (visao: VisualizacaoLancamentos) => {
    if (visao === preferredView) {
      setVisaoPedida(null);
      return;
    }
    if (movimentoReduzido) {
      setPreferredView(visao);
      return;
    }
    setVisaoPedida(visao);
  };

  const [visaoExibida, setVisaoExibida] = useState(view);
  const [animandoTroca, setAnimandoTroca] = useState(false);
  if (visaoExibida !== view) {
    setVisaoExibida(view);
    setAnimandoTroca(true);
  }

  useEffect(() => {
    if (!animandoTroca) return;
    const espera = window.setTimeout(() => setAnimandoTroca(false), DURACAO_TROCA_VISUALIZACAO_MS);
    return () => window.clearTimeout(espera);
  }, [animandoTroca]);

  const mostrarOrdenacao = view === 'cards' && !isCompact && !emTroca;
  const [ordenacaoMontada, setOrdenacaoMontada] = useState(mostrarOrdenacao);
  if (mostrarOrdenacao && !ordenacaoMontada) setOrdenacaoMontada(true);

  useEffect(() => {
    if (mostrarOrdenacao || !ordenacaoMontada) return;
    const espera = window.setTimeout(
      () => setOrdenacaoMontada(false),
      movimentoReduzido ? 0 : DURACAO_SAIDA_ORDENACAO_MS,
    );
    return () => window.clearTimeout(espera);
  }, [mostrarOrdenacao, ordenacaoMontada, movimentoReduzido]);

  const patchQuery = (patch: Partial<ConsultaLancamento>) => setQuery((current) => ({ ...current, ...patch }));

  const clearFilters = () =>
    setQuery((current) => ({
      ...consultaVazia,
      campoOrdenacao: current.campoOrdenacao,
      direcaoOrdenacao: current.direcaoOrdenacao,
    }));

  const handleSort = (field: OrdenacaoLancamento) =>
    setQuery((current) =>
      current.campoOrdenacao === field
        ? { ...current, direcaoOrdenacao: current.direcaoOrdenacao === 'ASC' ? 'DESC' : 'ASC' }
        : { ...current, campoOrdenacao: field, direcaoOrdenacao: direcaoInicialOrdenacao[field] },
    );

  const ordenacao = (saindo = false) => (
    <OrdenacaoLancamentos
      campoOrdenacao={query.campoOrdenacao}
      direcaoOrdenacao={query.direcaoOrdenacao}
      aoOrdenar={handleSort}
      saindo={saindo}
    />
  );

  const closeForm = () => {
    setFormMode(null);
    setEditing(null);
  };

  const openCreate = (mode: ModoFormulario) => {
    setEditing(null);
    setFormMode(mode);
  };

  const handleSubmit = async (payload: SalvarLancamentoDTO) => {
    setSaving(true);
    const noun = rotuloTipoLancamento[payload.tipo];
    const detail = payload.repeticao ? `${rotuloFrequencia[payload.repeticao]} — ${payload.descricao}` : payload.descricao;

    try {
      if (editing) {
        await lancamentoService.atualizar(editing.id, payload);
        toast.sucesso(`${noun} atualizada com sucesso!`, detail);
      } else {
        await lancamentoService.criar(payload);
        toast.sucesso(`${noun} cadastrada com sucesso!`, detail);
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
      await lancamentoService.excluir(removing.id);
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
    <div className={styles.tela}>
      <CabecalhoPagina
        titulo={titulo}
        descricao={descricao}
        acoes={
          tipo ? (
            <Botao tamanho="sm" icone={Plus} onClick={() => openCreate(tipo)}>
              Nova {rotuloTipoLancamento[tipo].toLowerCase()}
            </Botao>
          ) : (
            <div className={styles.newButtons}>
              <Botao variante="secondary" tamanho="sm" icone={Plus} onClick={() => openCreate('RECEITA')}>
                Receita
              </Botao>
              <Botao variante="secondary" tamanho="sm" icone={Plus} onClick={() => openCreate('DESPESA')}>
                Despesa
              </Botao>
              <Botao tamanho="sm" icone={Plus} onClick={() => openCreate('TRANSFERENCIA')}>
                Transferência
              </Botao>
            </div>
          )
        }
      />

      <Painel espacamento="sm" className={styles.painel}>
        <div className={styles.toolbar} ref={toolbarRef}>
          <FiltrosLancamentos
            consulta={query}
            aoAlterar={patchQuery}
            aoLimpar={clearFilters}
            categorias={categories}
            origens={sources}
            tipoCategoria={tipo === 'RECEITA' || tipo === 'DESPESA' ? tipo : undefined}
            mostrarFiltroTipo={!tipo}
            mostrarFiltroCategoria={tipo !== 'TRANSFERENCIA'}
            ordenacao={ordenacaoMontada ? ordenacao(!mostrarOrdenacao) : null}
          />

          <div className={styles.summary}>
            <div className={styles.summaryCount}>
              <span className={styles.summaryLabel}>
                {formatarInteiro(quantidadeTotal)} {quantidadeTotal === 1 ? 'lançamento' : 'lançamentos'}
              </span>

              {isCompact || !tableFits ? null : (
                <AlternadorVisualizacao valor={visaoAlvo} aoAlterar={alterarVisualizacao} />
              )}
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

        {carregando && !dados ? (
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
        ) : (
          <div
            ref={listaRef}
            className={juntarClasses(
              'refreshing',
              styles.lista,
              transactions.length === dados?.tamanho && (view === 'cards' ? styles.preencherCartoes : styles.preencher),
              animandoTroca && styles.trocaVisao,
              emTroca && styles.saidaVisao,
            )}
            aria-busy={carregando}
            aria-label={`Lançamentos, página ${pagina + 1} de ${Math.max(1, dados?.quantidadePaginas ?? 1)}`}
            tabIndex={-1}
            style={alturaReservada ? { minHeight: alturaReservada } : undefined}
          >
            {trocandoPagina ? (
              <BlocoCarregando linhas={10} altura={alturaReservada ?? 320} />
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
            ) : (
              <>
                {view === 'cards' ? (
                  <>
                    {isCompact ? <div className={styles.ordenacaoCompacta}>{ordenacao()}</div> : null}
                    <ListaLancamentos
                      lancamentos={transactions}
                      mostrarCategoria={tipo !== 'TRANSFERENCIA'}
                      aoEditar={openEdit}
                      aoExcluir={setRemoving}
                    />
                  </>
                ) : (
                  <div ref={tableRef} className={styles.tabela}>
                    <TabelaLancamentos
                      lancamentos={transactions}
                      campoOrdenacao={query.campoOrdenacao}
                      direcaoOrdenacao={query.direcaoOrdenacao}
                      aoOrdenar={handleSort}
                      mostrarCategoria={tipo !== 'TRANSFERENCIA'}
                      aoEditar={openEdit}
                      aoExcluir={setRemoving}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Painel>

      {dados && !erro ? (
        <Paginacao
          pagina={pagina}
          quantidadePaginas={dados.quantidadePaginas}
          quantidadeTotal={quantidadeTotal}
          tamanho={tamanhoPagina}
          rotulo="Páginas dos lançamentos"
          aoMudar={irParaPagina}
          className={styles.paginacao}
        />
      ) : null}

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
              {rotuloTipoLancamento[removing.tipo]} — {formatarDataCompleta(removing.data)} — {removing.nomeOrigem}
            </span>
            <ValorMonetario valor={removing.valor} tom={removing.tipo === 'DESPESA' ? 'negative' : 'default'} />
          </>
        ) : null}
      </DialogoConfirmacao>
    </div>
  );
}
