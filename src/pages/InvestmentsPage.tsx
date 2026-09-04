import { useCallback, useMemo, useState } from 'react';
import { Plus, TrendingUp } from 'lucide-react';
import { Amount, SummaryBar } from '@/components/common';
import { AllocationChart, InvestmentCard, InvestmentFormModal, PortfolioChart, profitTone } from '@/components/investments';
import { PageHeader } from '@/components/layout';
import { Button, Card, ConfirmDialog, EmptyState, LoadingBlock } from '@/components/ui';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/providers/ToastProvider';
import { investmentsService } from '@/services';
import type { Investment, InvestmentPayload, InvestmentPosition } from '@/types';
import { formatSignedPercent } from '@/utils/format';
import styles from './InvestmentsPage.module.css';

export function InvestmentsPage() {
  const [editing, setEditing] = useState<Investment | null>(null);
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState<InvestmentPosition | null>(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const fetchData = useCallback((signal: AbortSignal) => investmentsService.getPortfolio(signal), []);
  const { data, loading, error, reload } = useAsyncData(fetchData);

  const positions = useMemo(() => data?.positions ?? [], [data]);

  const formOpen = creating || editing !== null;

  const closeForm = () => {
    setCreating(false);
    setEditing(null);
  };

  const handleSubmit = async (payload: InvestmentPayload) => {
    setSaving(true);

    try {
      if (editing) {
        await investmentsService.update(editing.id, payload);
        toast.success('Investimento atualizado', payload.name);
      } else {
        await investmentsService.create(payload);
        toast.success('Investimento cadastrado', payload.name);
      }
      closeForm();
      reload();
    } catch (submitError) {
      toast.error(
        'Não foi possível salvar o investimento',
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
      await investmentsService.remove(removing.investment.id);
      toast.success('Investimento excluído', removing.investment.name);
      setRemoving(null);
      reload();
    } catch (deleteError) {
      toast.error(
        'Não foi possível excluir o investimento',
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
        title="Investimentos"
        description="Quanto você aportou, quanto a carteira vale hoje e onde o dinheiro está"
        actions={
          <Button size="sm" icon={Plus} onClick={() => setCreating(true)}>
            Novo investimento
          </Button>
        }
      />

      {/*
        O esqueleto e so da primeira carga: depois de cadastrar ou editar, os
        numeros anteriores ficam na tela ate os novos chegarem. Remontar a faixa
        de resumo a cada gravacao faria a contagem de entrada recomecar do zero.
      */}
      {loading && !data ? (
        <div className={styles.stack} aria-busy="true">
          <Card padding="none">
            <LoadingBlock lines={2} height={92} />
          </Card>
          <div className={styles.charts}>
            <Card padding="none">
              <LoadingBlock lines={3} height={280} />
            </Card>
            <Card padding="none">
              <LoadingBlock lines={3} height={280} />
            </Card>
          </div>
        </div>
      ) : error ? (
        <Card padding="none">
          <EmptyState
            title="Não foi possível carregar a carteira"
            description={error.message}
            action={
              <Button variant="secondary" onClick={reload}>
                Tentar de novo
              </Button>
            }
          />
        </Card>
      ) : !data || positions.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={TrendingUp}
            title="Nenhum investimento cadastrado"
            description="Cadastre suas posições para acompanhar quanto rendem, como o patrimônio evolui e em que tipo de ativo o dinheiro está."
            action={
              <Button icon={Plus} onClick={() => setCreating(true)}>
                Novo investimento
              </Button>
            }
          />
        </Card>
      ) : (
        <div className={`${styles.stack} refreshing`} aria-busy={loading}>
          <SummaryBar
            items={[
              {
                label: 'Total investido',
                value: <Amount value={data.invested} countUp />,
                hint: `${positions.length} ${positions.length === 1 ? 'posição' : 'posições'} em ${data.allocation.length} ${data.allocation.length === 1 ? 'tipo de ativo' : 'tipos de ativo'}`,
              },
              {
                label: 'Patrimônio atual',
                value: <Amount value={data.currentValue} size="lg" animate countUp />,
                hint: 'Soma do valor de mercado das posições',
              },
              {
                label: data.profit >= 0 ? 'Lucro' : 'Prejuízo',
                value: <Amount value={data.profit} tone={profitTone(data.profit)} sign="auto" countUp />,
                hint: 'Diferença entre o valor atual e o aportado',
              },
              {
                label: 'Rentabilidade',
                value: (
                  <span className={`${styles.percent} ${data.profit >= 0 ? styles.up : styles.down} tabular`}>
                    {formatSignedPercent(data.profitability * 100)}
                  </span>
                ),
                hint: 'Sobre o total aportado, desde o primeiro aporte',
              },
            ]}
          />

          <div className={styles.charts}>
            <PortfolioChart data={data.history} />
            <AllocationChart data={data.allocation} total={data.currentValue} />
          </div>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Posições</h2>
            <ul className={styles.grid}>
              {positions.map((position) => (
                <InvestmentCard
                  key={position.investment.id}
                  position={position}
                  onEdit={(item) => setEditing(item.investment)}
                  onDelete={setRemoving}
                />
              ))}
            </ul>
          </section>
        </div>
      )}

      <InvestmentFormModal
        open={formOpen}
        investment={editing}
        saving={saving}
        onSubmit={handleSubmit}
        onClose={closeForm}
      />

      <ConfirmDialog
        open={removing !== null}
        title="Excluir investimento"
        description="A posição sai da carteira e da evolução do patrimônio. Os aportes já lançados continuam no histórico."
        confirmLabel="Excluir"
        loading={saving}
        onConfirm={handleDelete}
        onCancel={() => setRemoving(null)}
      >
        {removing ? (
          <>
            <strong className={styles.confirmTitle}>{removing.investment.name}</strong>
            <span className={styles.confirmMeta}>{removing.investment.institution}</span>
            <Amount value={removing.investment.currentValue} />
          </>
        ) : null}
      </ConfirmDialog>
    </>
  );
}
