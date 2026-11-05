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
import type { RecorrenteDTO, SalvarRecorrenteDTO, TipoRecorrente } from '@/types';
import { capitalizar, formatarRotuloVencimento } from '@/utils/formatacao';
import styles from './PaginaRecorrentes.module.css';

const nomeDoTipo: Record<TipoRecorrente, string> = { RECEITA: 'Receita', DESPESA: 'Despesa' };

export function PaginaRecorrentes() {
  const [editing, setEditing] = useState<RecorrenteDTO | null>(null);
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState<RecorrenteDTO | null>(null);
  const [saving, setSaving] = useState(false);
  const toast = useNotificacoes();

  const fetchData = useCallback(
    (signal: AbortSignal) =>
      Promise.all([
        recorrentesService.buscarResumo(signal),
        categoriasService.listar(undefined, signal),
        contasService.listarOrigens(signal),
      ]),
    [],
  );

  const { dados, carregando, erro, recarregar } = useDadosAssincronos(fetchData);

  const summary = dados?.[0];
  const categories = useMemo(() => dados?.[1] ?? [], [dados]);
  const sources = useMemo(() => dados?.[2] ?? [], [dados]);

  const items = useMemo(() => summary?.itens ?? [], [summary]);
  const incomes = useMemo(() => items.filter((item) => item.tipo === 'RECEITA'), [items]);
  const expenses = useMemo(() => items.filter((item) => item.tipo === 'DESPESA'), [items]);
  const activeCount = useMemo(() => items.filter((item) => item.situacao === 'ATIVO').length, [items]);
  const nextDue = useMemo(() => expenses.find((item) => item.situacao === 'ATIVO'), [expenses]);
  const activeIncomes = useMemo(() => incomes.filter((item) => item.situacao === 'ATIVO').length, [incomes]);

  const formOpen = creating || editing !== null;

  const closeForm = () => {
    setCreating(false);
    setEditing(null);
  };

  const toPayload = (recurring: RecorrenteDTO): SalvarRecorrenteDTO => ({
    tipo: recurring.tipo,
    descricao: recurring.descricao,
    valor: recurring.valor,
    idCategoria: recurring.categoria?.id,
    frequencia: recurring.frequencia,
    proximoVencimento: recurring.proximoVencimento,
    idOrigem: recurring.idOrigem,
    situacao: recurring.situacao,
    lancarAutomaticamente: recurring.lancarAutomaticamente,
    observacoes: recurring.observacoes,
  });

  const handleSubmit = async (payload: SalvarRecorrenteDTO) => {
    const nome = nomeDoTipo[payload.tipo];
    setSaving(true);

    try {
      if (editing) {
        await recorrentesService.atualizar(editing.id, payload);
        toast.sucesso(`${nome} recorrente atualizada com sucesso!`, payload.descricao);
      } else {
        await recorrentesService.criar(payload);
        toast.sucesso(`${nome} recorrente cadastrada com sucesso!`, `${rotuloFrequencia[payload.frequencia]} — ${payload.descricao}`);
      }
      closeForm();
      recarregar();
    } catch (submitError) {
      toast.erro(`Não foi possível salvar a ${nome.toLowerCase()} recorrente.`, submitError);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (recurring: RecorrenteDTO) => {
    const status = recurring.situacao === 'ATIVO' ? 'PAUSADO' : 'ATIVO';
    const nome = nomeDoTipo[recurring.tipo];
    setSaving(true);

    try {
      await recorrentesService.atualizar(recurring.id, { ...toPayload(recurring), situacao: status });
      toast.sucesso(status === 'PAUSADO' ? `${nome} recorrente pausada!` : `${nome} recorrente retomada!`, recurring.descricao);
      recarregar();
    } catch (toggleError) {
      toast.erro(`Não foi possível alterar a ${nome.toLowerCase()} recorrente.`, toggleError);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!removing) return;
    const nome = nomeDoTipo[removing.tipo];
    setSaving(true);

    try {
      await recorrentesService.excluir(removing.id);
      toast.sucesso(`${nome} recorrente excluída com sucesso!`, removing.descricao);
      setRemoving(null);
      recarregar();
    } catch (deleteError) {
      toast.erro(`Não foi possível excluir a ${nome.toLowerCase()} recorrente.`, deleteError);
      setRemoving(null);
    } finally {
      setSaving(false);
    }
  };

  const renderSection = (titulo: string, meta: string, lista: RecorrenteDTO[]) =>
    lista.length > 0 ? (
      <section className={styles.section}>
        <div className={styles.sectionText}>
          <h2 className={styles.sectionTitle}>{titulo}</h2>
          <span className={styles.sectionMeta}>{meta}</span>
        </div>
        <ul className={styles.grid}>
          {lista.map((recurring) => (
            <CartaoRecorrente
              key={recurring.id}
              recorrente={recurring}
              aoEditar={setEditing}
              aoAlternar={handleToggle}
              aoExcluir={setRemoving}
            />
          ))}
        </ul>
      </section>
    ) : null;

  return (
    <>
      <CabecalhoPagina
        titulo="Recorrentes"
        descricao="O que entra e o que sai todo mês, quanto soma e quando acontece"
        acoes={
          <Botao tamanho="sm" icone={Plus} onClick={() => setCreating(true)}>
            Nova recorrente
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
            titulo="Não foi possível carregar as recorrentes"
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
            titulo="Nenhuma recorrente"
            descricao="Cadastre salário, aluguel, assinaturas e contas fixas para saber quanto entra e quanto sai por mês e ver a previsão dos próximos meses."
            acao={
              <Botao icone={Plus} onClick={() => setCreating(true)}>
                Nova recorrente
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
                dica: 'Despesas por mês, com anuais e semestrais diluídas',
              },
              {
                rotulo: 'Entradas por mês',
                valor: <ValorMonetario valor={summary.receitaMensal} animar contarAoAparecer />,
                dica:
                  activeIncomes > 0
                    ? `${activeIncomes} ${activeIncomes === 1 ? 'receita ativa' : 'receitas ativas'}, convertidas para o mês`
                    : 'Nenhuma receita recorrente ativa',
              },
              {
                rotulo: 'Ativas',
                valor: <span className={styles.count}>{activeCount}</span>,
                dica: `${items.length} ${items.length === 1 ? 'recorrente cadastrada' : 'recorrentes cadastradas'}`,
              },
              {
                rotulo: 'Próximo vencimento',
                valor: nextDue ? (
                  <ValorMonetario valor={nextDue.valor} contarAoAparecer />
                ) : (
                  <span className={styles.count}>—</span>
                ),
                dica: nextDue
                  ? `${nextDue.descricao} — ${capitalizar(formatarRotuloVencimento(nextDue.proximoVencimento))}`
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
                  .join(' — ')}
              </span>
            </div>
          ) : null}

          {renderSection('Receitas', 'Salário, vales e o que chega sempre na mesma data', incomes)}
          {renderSection('Despesas', 'Contas fixas e assinaturas', expenses)}
        </div>
      )}

      <ModalFormularioRecorrente
        aberto={formOpen}
        recorrente={editing}
        categorias={categories}
        origens={sources}
        salvando={saving}
        aoEnviar={handleSubmit}
        aoFechar={closeForm}
      />

      <DialogoConfirmacao
        aberto={removing !== null}
        titulo={removing ? `Excluir ${nomeDoTipo[removing.tipo].toLowerCase()} recorrente` : 'Excluir recorrente'}
        descricao={
          removing?.tipo === 'RECEITA'
            ? 'Os próximos recebimentos deixam de ser lançados. Os lançamentos que já aconteceram continuam no histórico.'
            : 'Ela sai da previsão dos próximos meses. Os lançamentos que já aconteceram continuam no histórico.'
        }
        rotuloConfirmar="Excluir"
        carregando={saving}
        aoConfirmar={handleDelete}
        aoCancelar={() => setRemoving(null)}
      >
        {removing ? (
          <>
            <strong className={styles.confirmTitle}>{removing.descricao}</strong>
            <span className={styles.confirmMeta}>
              {rotuloFrequencia[removing.frequencia]} — {removing.nomeOrigem}
            </span>
            <ValorMonetario valor={removing.valor} />
          </>
        ) : null}
      </DialogoConfirmacao>
    </>
  );
}
