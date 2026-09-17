import { useCallback, useMemo, useState } from 'react';
import { Plus, Wallet } from 'lucide-react';
import { CartaoConta, CartaoReserva, ModalDetalheConta, ModalFormularioConta } from '@/components/contas';
import { ValorMonetario, BarraResumo } from '@/components/comum';
import { CabecalhoPagina } from '@/components/layout';
import { Botao, Painel, DialogoConfirmacao, EstadoVazio, BlocoCarregando } from '@/components/ui';
import { MESES_EVOLUCAO_CONTA, ehContaReserva, rotuloTipoConta } from '@/constants/contas';
import { useDadosAssincronos } from '@/hooks/useDadosAssincronos';
import { useNotificacoes } from '@/providers/ProvedorNotificacoes';
import { contasService } from '@/services';
import type { ContaDTO, SalvarContaDTO } from '@/types';
import styles from './PaginaContas.module.css';

function participacaoDe(account: ContaDTO, total: number): number | undefined {
  if (total <= 0 || account.situacao !== 'ATIVO' || !account.incluirNoTotal) return undefined;
  if (account.saldo <= 0) return undefined;
  return account.saldo / total;
}

export function PaginaContas() {
  const [editing, setEditing] = useState<ContaDTO | null>(null);
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState<ContaDTO | null>(null);
  const [saving, setSaving] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const toast = useNotificacoes();

  const fetchAccounts = useCallback(
    (signal: AbortSignal) => Promise.all([contasService.listar(signal), contasService.listarReservas(signal)]),
    [],
  );
  const { dados, carregando, erro, recarregar } = useDadosAssincronos(fetchAccounts);

  const accounts = useMemo(() => dados?.[0] ?? [], [dados]);
  const reserves = useMemo(() => dados?.[1] ?? [], [dados]);
  const everyday = useMemo(() => accounts.filter((account) => !ehContaReserva(account.tipo)), [accounts]);
  const detail = useMemo(() => reserves.find((item) => item.conta.id === detailId) ?? null, [reserves, detailId]);

  const summary = useMemo(() => {
    const active = accounts.filter((account) => account.situacao === 'ATIVO');
    return {
      total: active.filter((account) => account.incluirNoTotal).reduce((sum, item) => sum + item.saldo, 0),
      excluded: active.filter((account) => !account.incluirNoTotal).reduce((sum, item) => sum + item.saldo, 0),
      reserved: active.filter((account) => ehContaReserva(account.tipo)).reduce((sum, item) => sum + item.saldo, 0),
      activeCount: active.length,
      inactiveCount: accounts.length - active.length,
    };
  }, [accounts]);

  const reservesYield = useMemo(
    () => reserves.filter((item) => item.conta.situacao === 'ATIVO').reduce((sum, item) => sum + item.rendimentos, 0),
    [reserves],
  );

  const formOpen = creating || editing !== null;

  const closeForm = () => {
    setCreating(false);
    setEditing(null);
  };

  const handleSubmit = async (payload: SalvarContaDTO) => {
    setSaving(true);

    try {
      if (editing) {
        await contasService.atualizar(editing.id, payload);
        toast.sucesso('Conta atualizada com sucesso!', payload.nome);
      } else {
        await contasService.criar(payload);
        toast.sucesso('Conta cadastrada com sucesso!', payload.nome);
      }
      closeForm();
      recarregar();
    } catch (submitError) {
      toast.erro('Não foi possível salvar a conta.', submitError);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!removing) return;
    setSaving(true);

    try {
      await contasService.excluir(removing.id);
      toast.sucesso('Conta excluída com sucesso!', removing.nome);
      setRemoving(null);
      recarregar();
    } catch (deleteError) {
      toast.erro('Não foi possível excluir a conta.', deleteError);
      setRemoving(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <CabecalhoPagina
        titulo="Contas"
        descricao="Onde o seu dinheiro está hoje"
        acoes={
          <Botao tamanho="sm" icone={Plus} onClick={() => setCreating(true)}>
            Nova conta
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
            titulo="Não foi possível carregar as contas"
            descricao={erro.message}
            acao={
              <Botao variante="secondary" onClick={recarregar}>
                Tentar de novo
              </Botao>
            }
          />
        </Painel>
      ) : accounts.length === 0 ? (
        <Painel espacamento="none">
          <EstadoVazio
            icone={Wallet}
            titulo="Nenhuma conta cadastrada"
            descricao="Cadastre a primeira conta para acompanhar o saldo e registrar lançamentos."
            acao={
              <Botao icone={Plus} onClick={() => setCreating(true)}>
                Nova conta
              </Botao>
            }
          />
        </Painel>
      ) : (
        <div className={`${styles.stack} refreshing`} aria-busy={carregando}>
          <BarraResumo
            itens={[
              {
                rotulo: 'Saldo total',
                valor: <ValorMonetario valor={summary.total} tamanho="lg" contarAoAparecer />,
                dica: 'Soma das contas ativas que entram no total',
              },
              {
                rotulo: 'Em reservas',
                valor: <ValorMonetario valor={summary.reserved} contarAoAparecer />,
                dica: (
                  <>
                    Rendeu <ValorMonetario valor={reservesYield} tamanho="sm" tom="positive" sinal="auto" /> em{' '}
                    {MESES_EVOLUCAO_CONTA} meses
                  </>
                ),
              },
              {
                rotulo: 'Fora do saldo total',
                valor: <ValorMonetario valor={summary.excluded} tom="muted" contarAoAparecer />,
                dica: 'Contas marcadas para não somar',
              },
              {
                rotulo: 'Contas',
                valor: <span className={styles.count}>{summary.activeCount} ativas</span>,
                dica:
                  summary.inactiveCount > 0
                    ? `${summary.inactiveCount} ${summary.inactiveCount === 1 ? 'inativa' : 'inativas'}`
                    : 'Nenhuma inativa',
              },
            ]}
          />

          <section className={styles.section} aria-labelledby="titulo-movimentacao">
            <div className={styles.sectionHeader}>
              <h2 id="titulo-movimentacao" className={styles.sectionTitle}>
                Contas do dia a dia
              </h2>
              <p className={styles.sectionHint}>Onde o salário cai e de onde as contas saem.</p>
            </div>
            {everyday.length === 0 ? (
              <Painel espacamento="none">
                <EstadoVazio
                  icone={Wallet}
                  titulo="Nenhuma conta de movimentação"
                  descricao="Cadastre a conta corrente ou a conta salário para registrar os lançamentos do dia a dia."
                />
              </Painel>
            ) : (
              <ul className={styles.grid}>
                {everyday.map((account) => (
                  <CartaoConta
                    key={account.id}
                    conta={account}
                    participacao={participacaoDe(account, summary.total)}
                    aoEditar={setEditing}
                    aoExcluir={setRemoving}
                  />
                ))}
              </ul>
            )}
          </section>

          {reserves.length > 0 ? (
            <section className={styles.section} aria-labelledby="titulo-reservas">
              <div className={styles.sectionHeader}>
                <h2 id="titulo-reservas" className={styles.sectionTitle}>
                  Reservas e patrimônio
                </h2>
                <p className={styles.sectionHint}>Contas para guardar dinheiro: acompanhe quanto entrou e quanto rendeu.</p>
              </div>
              <ul className={styles.grid}>
                {reserves.map((evolution) => (
                  <CartaoReserva
                    key={evolution.conta.id}
                    evolucao={evolution}
                    aoAbrir={(item) => setDetailId(item.conta.id)}
                    aoExcluir={(item) => setRemoving(item.conta)}
                  />
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}

      <ModalDetalheConta
        evolucao={detail}
        salvando={saving}
        aoFechar={() => setDetailId(null)}
        aoEditar={(item) => {
          setDetailId(null);
          setEditing(item.conta);
        }}
        aoExcluir={(item) => {
          setDetailId(null);
          setRemoving(item.conta);
        }}
      />

      <ModalFormularioConta
        aberto={formOpen}
        conta={editing}
        salvando={saving}
        aoEnviar={handleSubmit}
        aoFechar={closeForm}
      />

      <DialogoConfirmacao
        aberto={removing !== null}
        titulo="Excluir conta"
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
              {removing.instituicao} · {rotuloTipoConta[removing.tipo]}
            </span>
            <ValorMonetario valor={removing.saldo} />
          </>
        ) : null}
      </DialogoConfirmacao>
    </>
  );
}
