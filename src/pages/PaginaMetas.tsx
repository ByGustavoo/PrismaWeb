import { useCallback, useMemo, useState } from 'react';
import { Plus, ShoppingBag } from 'lucide-react';
import { ValorMonetario, BarraResumo } from '@/components/comum';
import {
  CartaoMeta,
  ModalDetalheMeta,
  FiltrosMetas,
  ModalFormularioMeta,
  aplicarConsultaMeta,
  consultaMetaVazia,
  temFiltrosMetaAtivos,
  tomPreco,
} from '@/components/metas';
import type { ResultadoFormularioMeta, ConsultaMeta } from '@/components/metas';
import { CabecalhoPagina } from '@/components/layout';
import { Botao, Painel, DialogoConfirmacao, EstadoVazio, BlocoCarregando } from '@/components/ui';
import { notificacaoSituacaoMeta } from '@/constants/metas';
import { useDadosAssincronos } from '@/hooks/useDadosAssincronos';
import { useNotificacoes } from '@/providers/ProvedorNotificacoes';
import { metasService } from '@/services';
import type { AcompanhamentoMetaDTO, MetaDTO, SalvarMetaPrecoDTO, SituacaoMeta, Tendencia } from '@/types';
import { formatarPercentual } from '@/utils/formatacao';
import styles from './PaginaMetas.module.css';

function tendenciaTotal(change: number, base: number): Tendencia {
  if (base <= 0 || Math.abs(change / base) <= 0.005) return 'ESTAVEL';
  return change > 0 ? 'ALTA' : 'BAIXA';
}

export function PaginaMetas() {
  const [query, setQuery] = useState<ConsultaMeta>(consultaMetaVazia);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<MetaDTO | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [focusPriceForm, setFocusPriceForm] = useState(false);
  const [removing, setRemoving] = useState<AcompanhamentoMetaDTO | null>(null);
  const [saving, setSaving] = useState(false);
  const toast = useNotificacoes();

  const fetchData = useCallback((signal: AbortSignal) => metasService.listar({}, signal), []);
  const { dados, carregando, erro, recarregar } = useDadosAssincronos(fetchData);

  const items = useMemo(() => dados?.itens ?? [], [dados]);
  const visible = useMemo(() => aplicarConsultaMeta(items, query), [items, query]);

  const detail = useMemo(
    () => (detailId ? items.find((item) => item.meta.id === detailId) ?? null : null),
    [detailId, items],
  );

  const formOpen = creating || editing !== null;

  const closeForm = () => {
    setCreating(false);
    setEditing(null);
  };

  const openDetail = (tracking: AcompanhamentoMetaDTO, focusPrice = false) => {
    setDetailId(tracking.meta.id);
    setFocusPriceForm(focusPrice);
  };

  const handleSubmit = async (result: ResultadoFormularioMeta) => {
    setSaving(true);

    try {
      if (result.modo === 'update' && editing) {
        await metasService.atualizar(editing.id, result.dados);
        toast.sucesso('Meta atualizada', result.dados.nome);
      } else if (result.modo === 'create') {
        await metasService.criar(result.dados);
        toast.sucesso('Meta cadastrada', result.dados.nome);
      }
      closeForm();
      recarregar();
    } catch (submitError) {
      toast.erro('Não foi possível salvar a meta', submitError instanceof Error ? submitError.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  const handleAddPrice = async (tracking: AcompanhamentoMetaDTO, payload: SalvarMetaPrecoDTO): Promise<boolean> => {
    setSaving(true);

    try {
      await metasService.adicionarPreco(tracking.meta.id, payload);
      toast.sucesso('Preço registrado', tracking.meta.nome);
      recarregar();
      return true;
    } catch (priceError) {
      toast.erro('Não foi possível registrar o preço', priceError instanceof Error ? priceError.message : undefined);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (tracking: AcompanhamentoMetaDTO, status: SituacaoMeta) => {
    const { meta: goal } = tracking;
    setSaving(true);

    try {
      await metasService.atualizar(goal.id, {
        nome: goal.nome,
        situacao: status,
        ...(goal.url ? { url: goal.url } : {}),
        ...(goal.urlImagem ? { urlImagem: goal.urlImagem } : {}),
        ...(goal.observacoes ? { observacoes: goal.observacoes } : {}),
      });
      toast.sucesso(notificacaoSituacaoMeta[status], goal.nome);
      recarregar();
    } catch (statusError) {
      toast.erro('Não foi possível alterar a meta', statusError instanceof Error ? statusError.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!removing) return;
    setSaving(true);

    try {
      await metasService.excluir(removing.meta.id);
      toast.sucesso('Meta excluída', removing.meta.nome);
      setRemoving(null);
      recarregar();
    } catch (deleteError) {
      toast.erro('Não foi possível excluir a meta', deleteError instanceof Error ? deleteError.message : undefined);
      setRemoving(null);
    } finally {
      setSaving(false);
    }
  };

  const change = dados?.variacaoTotal ?? 0;
  const trend = tendenciaTotal(change, dados?.totalInicial ?? 0);
  const changePercent = dados && dados.totalInicial > 0 ? (change / dados.totalInicial) * 100 : 0;

  return (
    <>
      <CabecalhoPagina
        titulo="Metas e desejos"
        descricao="O que você pretende comprar, por quanto viu da primeira vez e para onde o preço está indo"
        acoes={
          <Botao tamanho="sm" icone={Plus} onClick={() => setCreating(true)}>
            Nova meta
          </Botao>
        }
      />

      {carregando && !dados ? (
        <div className={styles.stack} aria-busy="true">
          <Painel espacamento="none">
            <BlocoCarregando linhas={2} altura={92} />
          </Painel>
          <Painel espacamento="none">
            <BlocoCarregando linhas={4} altura={320} />
          </Painel>
        </div>
      ) : erro ? (
        <Painel espacamento="none">
          <EstadoVazio
            titulo="Não foi possível carregar as metas"
            descricao={erro.message}
            acao={
              <Botao variante="secondary" onClick={recarregar}>
                Tentar de novo
              </Botao>
            }
          />
        </Painel>
      ) : !dados || items.length === 0 ? (
        <Painel espacamento="none">
          <EstadoVazio
            icone={ShoppingBag}
            titulo="Nenhuma meta cadastrada"
            descricao="Cadastre o que você pretende comprar e registre o preço sempre que consultar. Com dois ou três registros a tela já mostra se o momento é bom."
            acao={
              <Botao icone={Plus} onClick={() => setCreating(true)}>
                Nova meta
              </Botao>
            }
          />
        </Painel>
      ) : (
        <div className={`${styles.stack} refreshing`} aria-busy={carregando}>
          <BarraResumo
            itens={[
              {
                rotulo: 'Em acompanhamento',
                valor: <span className={`${styles.count} tabular`}>{dados.quantidadeAcompanhando}</span>,
                dica:
                  dados.quantidadeCompradas > 0
                    ? `${dados.quantidadeCompradas} ${dados.quantidadeCompradas === 1 ? 'já comprada' : 'já compradas'}`
                    : 'Metas ainda em observação',
              },
              {
                rotulo: 'Custo da lista hoje',
                valor: <ValorMonetario valor={dados.totalAtual} tamanho="lg" animar contarAoAparecer />,
                dica: 'Soma dos preços atuais das metas em acompanhamento',
              },
              {
                rotulo: 'Desde o primeiro registro',
                valor: (
                  <span className={styles.pair}>
                    <ValorMonetario valor={change} tom={tomPreco(trend)} sinal="auto" contarAoAparecer />
                    <span className={`${styles.percent} tabular`}>{formatarPercentual(Math.abs(changePercent))}</span>
                  </span>
                ),
                dica: trend === 'ALTA' ? 'A lista ficou mais cara' : trend === 'BAIXA' ? 'A lista ficou mais barata' : 'A lista não mudou de preço',
              },
              {
                rotulo: 'Abaixo do maior preço',
                valor: <ValorMonetario valor={dados.economiaTotal} tom={dados.economiaTotal > 0 ? 'positive' : 'muted'} contarAoAparecer />,
                dica: 'O quanto os preços de hoje estão abaixo dos picos já registrados',
              },
            ]}
          />

          <section className={styles.section}>
            <FiltrosMetas
              consulta={query}
              aoAlterar={(patch) => setQuery((current) => ({ ...current, ...patch }))}
              aoLimpar={() => setQuery(consultaMetaVazia)}
              quantidadeResultados={visible.length}
            />

            {visible.length === 0 ? (
              <Painel espacamento="none">
                <EstadoVazio
                  icone={ShoppingBag}
                  titulo="Nenhuma meta encontrada"
                  descricao="Nenhuma meta corresponde à busca e aos filtros escolhidos."
                  acao={
                    temFiltrosMetaAtivos(query) ? (
                      <Botao variante="secondary" onClick={() => setQuery(consultaMetaVazia)}>
                        Limpar filtros
                      </Botao>
                    ) : null
                  }
                />
              </Painel>
            ) : (
              <ul className={styles.grid}>
                {visible.map((tracking, index) => (
                  <CartaoMeta
                    key={tracking.meta.id}
                    acompanhamento={tracking}
                    indice={index}
                    aoAbrir={(item) => openDetail(item)}
                    aoRegistrarPreco={(item) => openDetail(item, true)}
                    aoExcluir={setRemoving}
                  />
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      <ModalFormularioMeta
        aberto={formOpen}
        meta={editing}
        salvando={saving}
        aoEnviar={handleSubmit}
        aoFechar={closeForm}
      />

      <ModalDetalheMeta
        acompanhamento={detail}
        salvando={saving}
        focarFormularioPreco={focusPriceForm}
        aoFechar={() => setDetailId(null)}
        aoEditar={(tracking) => {
          setDetailId(null);
          setEditing(tracking.meta);
        }}
        aoExcluir={(tracking) => {
          setDetailId(null);
          setRemoving(tracking);
        }}
        aoMudarSituacao={handleStatusChange}
        aoAdicionarPreco={handleAddPrice}
      />

      <DialogoConfirmacao
        aberto={removing !== null}
        titulo="Excluir meta"
        descricao="O histórico de preços dessa meta é apagado junto. Se a ideia é só tirá-la da lista, marque como comprada ou cancelada."
        rotuloConfirmar="Excluir"
        carregando={saving}
        aoConfirmar={handleDelete}
        aoCancelar={() => setRemoving(null)}
      >
        {removing ? (
          <>
            <strong className={styles.confirmTitle}>{removing.meta.nome}</strong>
            <span className={styles.confirmMeta}>
              {removing.analise.quantidadeRegistros}{' '}
              {removing.analise.quantidadeRegistros === 1 ? 'preço registrado' : 'preços registrados'}
            </span>
            <ValorMonetario valor={removing.analise.precoAtual} />
          </>
        ) : null}
      </DialogoConfirmacao>
    </>
  );
}
