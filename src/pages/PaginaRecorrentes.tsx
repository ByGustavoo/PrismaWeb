import { useCallback, useMemo, useState } from 'react';
import { Plus, Repeat } from 'lucide-react';
import { ValorMonetario, BarraResumo } from '@/components/comum';
import { CabecalhoPagina } from '@/components/layout';
import { CartaoRecorrente, ModalFormularioRecorrente } from '@/components/recorrentes';
import { Botao, Painel, DialogoConfirmacao, EstadoVazio, BlocoCarregando } from '@/components/ui';
import { DIAS_VENCIMENTO_PROXIMO, rotuloFrequencia } from '@/constants/recorrentes';
import { useDadosAssincronos } from '@/hooks/useDadosAssincronos';
import { useNotificacoes } from '@/providers/ProvedorNotificacoes';
import { contasService, categoriasService, recorrentesService } from '@/services';
import type { DespesaRecorrenteDTO, SalvarDespesaRecorrenteDTO } from '@/types';
import { capitalizar, formatarRotuloVencimento } from '@/utils/formatacao';
import styles from './PaginaRecorrentes.module.css';

export function PaginaRecorrentes() {
  const [editing, setEditing] = useState<DespesaRecorrenteDTO | null>(null);
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState<DespesaRecorrenteDTO | null>(null);
  const [saving, setSaving] = useState(false);
  const toast = useNotificacoes();

  const fetchData = useCallback(
    (signal: AbortSignal) =>
      Promise.all([
        recorrentesService.buscarResumo(signal),
        categoriasService.listar('DESPESA', signal),
        contasService.listarOrigens(signal),
      ]),
    [],
  );

  const { dados, carregando, erro, recarregar } = useDadosAssincronos(fetchData);

  const summary = dados?.[0];
  const categories = useMemo(() => dados?.[1] ?? [], [dados]);
  const sources = useMemo(() => dados?.[2] ?? [], [dados]);

  const items = useMemo(() => summary?.itens ?? [], [summary]);
  const activeCount = useMemo(() => items.filter((item) => item.situacao === 'ATIVO').length, [items]);
  const nextDue = useMemo(() => items.find((item) => item.situacao === 'ATIVO'), [items]);

  const formOpen = creating || editing !== null;

  const closeForm = () => {
    setCreating(false);
    setEditing(null);
  };

  const toPayload = (expense: DespesaRecorrenteDTO): SalvarDespesaRecorrenteDTO => ({
    descricao: expense.descricao,
    valor: expense.valor,
    idCategoria: expense.categoria?.id,
    frequencia: expense.frequencia,
    proximoVencimento: expense.proximoVencimento,
    idOrigem: expense.idOrigem,
    situacao: expense.situacao,
    observacoes: expense.observacoes,
  });

  const handleSubmit = async (payload: SalvarDespesaRecorrenteDTO) => {
    setSaving(true);

    try {
      if (editing) {
        await recorrentesService.atualizar(editing.id, payload);
        toast.sucesso('Despesa recorrente atualizada com sucesso!', payload.descricao);
      } else {
        await recorrentesService.criar(payload);
        toast.sucesso('Despesa recorrente cadastrada com sucesso!', `${rotuloFrequencia[payload.frequencia]} · ${payload.descricao}`);
      }
      closeForm();
      recarregar();
    } catch (submitError) {
      toast.erro('Não foi possível salvar a despesa recorrente.', submitError);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (expense: DespesaRecorrenteDTO) => {
    const status = expense.situacao === 'ATIVO' ? 'PAUSADO' : 'ATIVO';
    setSaving(true);

    try {
      await recorrentesService.atualizar(expense.id, { ...toPayload(expense), situacao: status });
      toast.sucesso(status === 'PAUSADO' ? 'Despesa recorrente pausada!' : 'Despesa recorrente retomada!', expense.descricao);
      recarregar();
    } catch (toggleError) {
      toast.erro('Não foi possível alterar a despesa recorrente.', toggleError);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!removing) return;
    setSaving(true);

    try {
      await recorrentesService.excluir(removing.id);
      toast.sucesso('Despesa recorrente excluída com sucesso!', removing.descricao);
      setRemoving(null);
      recarregar();
    } catch (deleteError) {
      toast.erro('Não foi possível excluir a despesa recorrente.', deleteError);
      setRemoving(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <CabecalhoPagina
        titulo="Despesas recorrentes"
        descricao="Assinaturas e contas fixas, com o que elas custam por mês e quando vencem"
        acoes={
          <Botao tamanho="sm" icone={Plus} onClick={() => setCreating(true)}>
            Nova despesa
          </Botao>
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
            titulo="Não foi possível carregar as despesas recorrentes"
            descricao={erro.message}
            acao={
              <Botao variante="secondary" onClick={recarregar}>
                Tentar de novo
              </Botao>
            }
          />
        </Painel>
      ) : !summary || items.length === 0 ? (
        <Painel espacamento="none">
          <EstadoVazio
            icone={Repeat}
            titulo="Nenhuma despesa recorrente"
            descricao="Cadastre aluguel, assinaturas e contas fixas para saber quanto elas custam por mês e ver a previsão dos próximos meses."
            acao={
              <Botao icone={Plus} onClick={() => setCreating(true)}>
                Nova despesa
              </Botao>
            }
          />
        </Painel>
      ) : (
        <div className={`${styles.stack} refreshing`} aria-busy={carregando}>
          <BarraResumo
            itens={[
              {
                rotulo: 'Custo mensal',
                valor: <ValorMonetario valor={summary.custoMensal} tamanho="lg" animar contarAoAparecer />,
                dica: 'Equivalente por mês, com anuais e semestrais diluídas',
              },
              {
                rotulo: 'Custo anual',
                valor: <ValorMonetario valor={summary.custoAnual} contarAoAparecer />,
                dica: 'Doze vezes o custo mensal equivalente',
              },
              {
                rotulo: 'Ativas',
                valor: <span className={styles.count}>{activeCount}</span>,
                dica: `${items.length} ${items.length === 1 ? 'despesa cadastrada' : 'despesas cadastradas'}`,
              },
              {
                rotulo: 'Próximo vencimento',
                valor: nextDue ? (
                  <ValorMonetario valor={nextDue.valor} contarAoAparecer />
                ) : (
                  <span className={styles.count}>—</span>
                ),
                dica: nextDue
                  ? `${nextDue.descricao} · ${formatarRotuloVencimento(nextDue.proximoVencimento)}`
                  : 'Nenhuma despesa ativa',
              },
            ]}
          />

          {summary.vencendoEmBreve.length > 0 ? (
            <div className={styles.dueSoon} role="status">
              <span className={styles.dueSoonTitle}>
                {summary.vencendoEmBreve.length === 1
                  ? '1 despesa vence nos próximos'
                  : `${summary.vencendoEmBreve.length} despesas vencem nos próximos`}{' '}
                {DIAS_VENCIMENTO_PROXIMO} dias
              </span>
              <span className={styles.dueSoonList}>
                {summary.vencendoEmBreve
                  .map((item) => `${item.descricao} (${capitalizar(formatarRotuloVencimento(item.proximoVencimento))})`)
                  .join(' · ')}
              </span>
            </div>
          ) : null}

          <ul className={styles.grid}>
            {items.map((expense) => (
              <CartaoRecorrente
                key={expense.id}
                despesa={expense}
                aoEditar={setEditing}
                aoAlternar={handleToggle}
                aoExcluir={setRemoving}
              />
            ))}
          </ul>
        </div>
      )}

      <ModalFormularioRecorrente
        aberto={formOpen}
        despesa={editing}
        categorias={categories}
        origens={sources}
        salvando={saving}
        aoEnviar={handleSubmit}
        aoFechar={closeForm}
      />

      <DialogoConfirmacao
        aberto={removing !== null}
        titulo="Excluir despesa recorrente"
        descricao="Ela sai da previsão dos próximos meses. Os lançamentos que já aconteceram continuam no histórico."
        rotuloConfirmar="Excluir"
        carregando={saving}
        aoConfirmar={handleDelete}
        aoCancelar={() => setRemoving(null)}
      >
        {removing ? (
          <>
            <strong className={styles.confirmTitle}>{removing.descricao}</strong>
            <span className={styles.confirmMeta}>
              {rotuloFrequencia[removing.frequencia]} · {removing.nomeOrigem}
            </span>
            <ValorMonetario valor={removing.valor} />
          </>
        ) : null}
      </DialogoConfirmacao>
    </>
  );
}
