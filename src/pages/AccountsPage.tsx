import { useCallback, useMemo, useState } from 'react';
import { Plus, Wallet } from 'lucide-react';
import { AccountCard, AccountFormModal } from '@/components/accounts';
import { Amount, SummaryBar } from '@/components/common';
import { PageHeader } from '@/components/layout';
import { Button, Card, ConfirmDialog, EmptyState, LoadingBlock } from '@/components/ui';
import { accountTypeLabel } from '@/constants/accounts';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/providers/ToastProvider';
import { accountsService } from '@/services';
import type { Account, AccountPayload } from '@/types';
import styles from './AccountsPage.module.css';

/**
 * Fatia da conta no saldo total. So tem fatia quem entra na conta desse total e
 * esta com saldo positivo: uma conta inativa, uma marcada para nao somar ou uma
 * no cheque especial nao ocupam um pedaco do bolo — mostrar uma barra vazia nas
 * tres so acrescentaria um trilho cinza a cada cartao.
 */
function shareOf(account: Account, total: number): number | undefined {
  if (total <= 0 || account.status !== 'ATIVO' || !account.includeInTotal) return undefined;
  if (account.balance <= 0) return undefined;
  return account.balance / total;
}

export function AccountsPage() {
  const [editing, setEditing] = useState<Account | null>(null);
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState<Account | null>(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const fetchAccounts = useCallback((signal: AbortSignal) => accountsService.list(signal), []);
  const { data, loading, error, reload } = useAsyncData(fetchAccounts);

  const accounts = useMemo(() => data ?? [], [data]);

  const summary = useMemo(() => {
    const active = accounts.filter((account) => account.status === 'ATIVO');
    return {
      total: active.filter((account) => account.includeInTotal).reduce((sum, item) => sum + item.balance, 0),
      excluded: active.filter((account) => !account.includeInTotal).reduce((sum, item) => sum + item.balance, 0),
      activeCount: active.length,
      inactiveCount: accounts.length - active.length,
    };
  }, [accounts]);

  const formOpen = creating || editing !== null;

  const closeForm = () => {
    setCreating(false);
    setEditing(null);
  };

  const handleSubmit = async (payload: AccountPayload) => {
    setSaving(true);

    try {
      if (editing) {
        await accountsService.update(editing.id, payload);
        toast.success('Conta atualizada', payload.name);
      } else {
        await accountsService.create(payload);
        toast.success('Conta cadastrada', payload.name);
      }
      closeForm();
      reload();
    } catch (submitError) {
      toast.error(
        'Não foi possível salvar a conta',
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
      await accountsService.remove(removing.id);
      toast.success('Conta excluída', removing.name);
      setRemoving(null);
      reload();
    } catch (deleteError) {
      // Conta com historico nao e apagavel: o servico explica o porque e sugere
      // inativar, entao a mensagem dele vale mais que um texto generico aqui.
      toast.error(
        'Não foi possível excluir a conta',
        deleteError instanceof Error ? deleteError.message : undefined,
      );
      setRemoving(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Contas"
        description="Onde o seu dinheiro está hoje"
        actions={
          <Button size="sm" icon={Plus} onClick={() => setCreating(true)}>
            Nova conta
          </Button>
        }
      />

      {/*
        O esqueleto e so da primeira carga. Depois de cadastrar, editar ou trocar
        o filtro, os numeros anteriores ficam na tela ate os novos chegarem:
        apagar a tela a cada gravacao piscava o conteudo inteiro e, pior,
        remontava a faixa de resumo — o que faria a contagem de entrada
        (`Amount countUp`) recomecar do zero a cada salvamento.
      */}
      {loading && !data ? (
        <div className={styles.stack} aria-busy="true">
          <Card padding="none">
            <LoadingBlock lines={2} height={92} />
          </Card>
          <Card padding="none">
            <LoadingBlock lines={5} height={280} />
          </Card>
        </div>
      ) : error ? (
        <Card padding="none">
          <EmptyState
            title="Não foi possível carregar as contas"
            description={error.message}
            action={
              <Button variant="secondary" onClick={reload}>
                Tentar de novo
              </Button>
            }
          />
        </Card>
      ) : accounts.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={Wallet}
            title="Nenhuma conta cadastrada"
            description="Cadastre a primeira conta para acompanhar o saldo e registrar lançamentos."
            action={
              <Button icon={Plus} onClick={() => setCreating(true)}>
                Nova conta
              </Button>
            }
          />
        </Card>
      ) : (
        <div className={`${styles.stack} refreshing`} aria-busy={loading}>
          <SummaryBar
            items={[
              {
                label: 'Saldo total',
                value: <Amount value={summary.total} size="lg" countUp />,
                hint: 'Soma das contas ativas que entram no total',
              },
              {
                label: 'Fora do saldo total',
                value: <Amount value={summary.excluded} tone="muted" countUp />,
                hint: 'Contas marcadas para não somar',
              },
              {
                label: 'Contas',
                value: <span className={styles.count}>{summary.activeCount} ativas</span>,
                hint:
                  summary.inactiveCount > 0
                    ? `${summary.inactiveCount} ${summary.inactiveCount === 1 ? 'inativa' : 'inativas'}`
                    : 'Nenhuma inativa',
              },
            ]}
          />

          <ul className={styles.grid}>
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                share={shareOf(account, summary.total)}
                onEdit={setEditing}
                onDelete={setRemoving}
              />
            ))}
          </ul>
        </div>
      )}

      <AccountFormModal
        open={formOpen}
        account={editing}
        saving={saving}
        onSubmit={handleSubmit}
        onClose={closeForm}
      />

      <ConfirmDialog
        open={removing !== null}
        title="Excluir conta"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        loading={saving}
        onConfirm={handleDelete}
        onCancel={() => setRemoving(null)}
      >
        {removing ? (
          <>
            <strong className={styles.confirmTitle}>{removing.name}</strong>
            <span className={styles.confirmMeta}>
              {removing.institution} · {accountTypeLabel[removing.type]}
            </span>
            <Amount value={removing.balance} />
          </>
        ) : null}
      </ConfirmDialog>
    </>
  );
}
