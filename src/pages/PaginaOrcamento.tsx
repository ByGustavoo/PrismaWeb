import { useCallback, useMemo, useState } from 'react';
import { Plus, Target } from 'lucide-react';
import { ValorMonetario, BarraResumo } from '@/components/comum';
import { ModalFormularioOrcamento, LinhaOrcamento, NavegadorMes } from '@/components/orcamento';
import { CabecalhoPagina } from '@/components/layout';
import { Botao, Painel, CorpoPainel, CabecalhoPainel, DialogoConfirmacao, EstadoVazio, BlocoCarregando, BarraProgresso } from '@/components/ui';
import { corDaPaleta } from '@/constants/cores';
import { DIAS_MINIMOS_PROJECAO_ORCAMENTO, tomProgressoOrcamento, situacaoOrcamentoDe } from '@/constants/orcamento';
import { useDadosAssincronos } from '@/hooks/useDadosAssincronos';
import { useNotificacoes } from '@/providers/ProvedorNotificacoes';
import { orcamentoService, categoriasService } from '@/services';
import type { ConsumoOrcamentoDTO, OrcamentoDTO, SalvarOrcamentoDTO } from '@/types';
import { chaveMesPorDeslocamento, deslocarChaveMes } from '@/utils/data';
import { capitalizar, formatarRotuloMes, formatarPercentual } from '@/utils/formatacao';
import styles from './PaginaOrcamento.module.css';

const MESES_HISTORICO = 11;

export function PaginaOrcamento() {
  const currentMonth = chaveMesPorDeslocamento(0);
  const [month, setMonth] = useState(currentMonth);
  const [editing, setEditing] = useState<OrcamentoDTO | null>(null);
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState<ConsumoOrcamentoDTO | null>(null);
  const [saving, setSaving] = useState(false);
  const toast = useNotificacoes();

  const fetchData = useCallback(
    (signal: AbortSignal) =>
      Promise.all([orcamentoService.buscarVisaoGeral(month, signal), categoriasService.listar('DESPESA', signal)]),
    [month],
  );

  const { dados, carregando, erro, recarregar } = useDadosAssincronos(fetchData, [month]);

  const overview = dados?.[0];
  const categories = useMemo(() => dados?.[1] ?? [], [dados]);

  const usedCategoryIds = useMemo(
    () => (overview?.itens ?? []).map((item) => item.orcamento.categoria.id),
    [overview],
  );

  const inProgress = Boolean(overview && overview.diasRestantes > 0 && overview.diasDecorridos > 0);
  const showProjection = inProgress && (overview?.diasDecorridos ?? 0) >= DIAS_MINIMOS_PROJECAO_ORCAMENTO;

  const formOpen = creating || editing !== null;

  const closeForm = () => {
    setCreating(false);
    setEditing(null);
  };

  const handleSubmit = async (payload: SalvarOrcamentoDTO) => {
    setSaving(true);

    try {
      if (editing) {
        await orcamentoService.atualizar(editing.id, payload);
        toast.sucesso('Limite atualizado com sucesso!', editing.categoria.nome);
      } else {
        await orcamentoService.criar(payload);
        toast.sucesso(
          'Limite definido com sucesso!',
          `${categories.find((category) => category.id === payload.idCategoria)?.nome ?? 'Categoria'} · vale para este mês e os seguintes`,
        );
      }
      closeForm();
      recarregar();
    } catch (submitError) {
      toast.erro('Não foi possível salvar o limite.', submitError);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!removing) return;
    setSaving(true);

    try {
      await orcamentoService.excluir(removing.orcamento.id);
      toast.sucesso('Limite excluído com sucesso!', removing.orcamento.categoria.nome);
      setRemoving(null);
      recarregar();
    } catch (deleteError) {
      toast.erro('Não foi possível excluir o limite.', deleteError);
      setRemoving(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <CabecalhoPagina
        titulo="Orçamento"
        descricao="Quanto você planejou gastar em cada categoria e quanto já foi"
        acoes={
          <>
            <NavegadorMes
              mes={month}
              aoAlterar={setMonth}
              maximo={currentMonth}
              minimo={deslocarChaveMes(currentMonth, -MESES_HISTORICO)}
            />
            <Botao tamanho="sm" icone={Plus} onClick={() => setCreating(true)}>
              Novo limite
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
            <BlocoCarregando linhas={5} altura={320} />
          </Painel>
        </div>
      ) : erro ? (
        <Painel espacamento="none">
          <EstadoVazio
            titulo="Não foi possível carregar o orçamento"
            descricao={erro.message}
            acao={
              <Botao variante="secondary" onClick={recarregar}>
                Tentar de novo
              </Botao>
            }
          />
        </Painel>
      ) : !overview || overview.itens.length === 0 ? (
        <Painel espacamento="none">
          <EstadoVazio
            icone={Target}
            titulo="Nenhum limite definido"
            descricao="Defina quanto pretende gastar em cada categoria para acompanhar o consumo do mês e ser avisado antes de estourar."
            acao={
              <Botao icone={Plus} onClick={() => setCreating(true)}>
                Novo limite
              </Botao>
            }
          />
        </Painel>
      ) : (
        <div className={`${styles.stack} refreshing`} aria-busy={carregando}>
          <BarraResumo
            itens={[
              {
                rotulo: 'Planejado',
                valor: <ValorMonetario valor={overview.planejado} contarAoAparecer />,
                dica: `${overview.itens.length} ${overview.itens.length === 1 ? 'categoria com limite' : 'categorias com limite'}`,
              },
              {
                rotulo: 'Gasto',
                valor: <ValorMonetario valor={overview.gasto} tamanho="lg" animar contarAoAparecer />,
                dica: `${formatarPercentual(overview.consumo * 100, 0)} do planejado`,
              },
              {
                rotulo: overview.restante >= 0 ? 'Disponível' : 'Acima do planejado',
                valor: (
                  <ValorMonetario
                    valor={Math.abs(overview.restante)}
                    tom={overview.restante >= 0 ? 'positive' : 'negative'}
                    contarAoAparecer
                  />
                ),
                dica:
                  overview.diasRestantes > 0
                    ? `Faltam ${overview.diasRestantes} ${overview.diasRestantes === 1 ? 'dia' : 'dias'} para o fim do mês`
                    : 'Mês encerrado',
              },
              {
                rotulo: 'Fora do orçamento',
                valor: (
                  <ValorMonetario
                    valor={overview.foraDoOrcamento.reduce((total, item) => total + item.valor, 0)}
                    tom="muted"
                    contarAoAparecer
                  />
                ),
                dica:
                  overview.foraDoOrcamento.length === 0
                    ? 'Todo gasto do mês tem limite'
                    : `${overview.foraDoOrcamento.length} ${overview.foraDoOrcamento.length === 1 ? 'categoria sem limite' : 'categorias sem limite'}`,
              },
            ]}
          />

          <Painel>
            <CabecalhoPainel
              titulo={`Consumo de ${capitalizar(formatarRotuloMes(overview.mes))}`}
              descricao={
                inProgress
                  ? `${overview.diasDecorridos} de ${overview.diasNoMes} dias vividos`
                  : 'Mês fechado'
              }
            />
            <CorpoPainel className={styles.total}>
              <BarraProgresso
                valor={overview.consumo}
                tom={tomProgressoOrcamento[situacaoOrcamentoDe(overview.consumo)]}
                rotulo={`Consumo do orçamento de ${capitalizar(formatarRotuloMes(overview.mes))}`}
              />
              <p className={styles.totalNote}>
                <ValorMonetario className={styles.inline} valor={overview.gasto} tamanho="sm" /> de{' '}
                <ValorMonetario className={styles.inline} valor={overview.planejado} tamanho="sm" tom="muted" /> planejados.
                {showProjection ? (
                  <span>
                    No ritmo atual, o mês fecha em{' '}
                    <ValorMonetario
                      className={styles.inline}
                      valor={(overview.gasto / overview.diasDecorridos) * overview.diasNoMes}
                      tamanho="sm"
                    />
                    .
                  </span>
                ) : null}
              </p>
            </CorpoPainel>
          </Painel>

          <ul className={styles.list}>
            {overview.itens.map((usage) => (
              <LinhaOrcamento
                key={usage.orcamento.id}
                consumo={usage}
                mostrarProjecao={showProjection}
                aoEditar={(item) => setEditing(item.orcamento)}
                aoExcluir={setRemoving}
              />
            ))}
          </ul>

          {overview.foraDoOrcamento.length > 0 ? (
            <Painel>
              <CabecalhoPainel
                titulo="Gasto fora do orçamento"
                descricao="Categorias que ainda não têm limite definido"
              />
              <CorpoPainel>
                <ul className={styles.unplanned}>
                  {overview.foraDoOrcamento.map((entry) => (
                    <li key={entry.categoria.id} className={styles.unplannedItem}>
                      <span
                        className={styles.marker}
                        style={{ backgroundColor: corDaPaleta(entry.categoria.tokenCor) }}
                        aria-hidden="true"
                      />
                      <span className={styles.unplannedName}>{entry.categoria.nome}</span>
                      <ValorMonetario valor={entry.valor} tamanho="sm" tom="muted" />
                    </li>
                  ))}
                </ul>
              </CorpoPainel>
            </Painel>
          ) : null}
        </div>
      )}

      <ModalFormularioOrcamento
        aberto={formOpen}
        orcamento={editing}
        categorias={categories}
        idsCategoriasUsadas={usedCategoryIds}
        salvando={saving}
        aoEnviar={handleSubmit}
        aoFechar={closeForm}
      />

      <DialogoConfirmacao
        aberto={removing !== null}
        titulo="Excluir limite"
        descricao="A categoria continua recebendo lançamentos, mas deixa de ser acompanhada pelo orçamento."
        rotuloConfirmar="Excluir"
        carregando={saving}
        aoConfirmar={handleDelete}
        aoCancelar={() => setRemoving(null)}
      >
        {removing ? (
          <>
            <strong className={styles.confirmTitle}>{removing.orcamento.categoria.nome}</strong>
            <span className={styles.confirmMeta}>Limite mensal</span>
            <ValorMonetario valor={removing.orcamento.limiteMensal} />
          </>
        ) : null}
      </DialogoConfirmacao>
    </>
  );
}
