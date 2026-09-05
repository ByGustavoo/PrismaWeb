import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Check, ExternalLink, Pencil, RotateCcw, Trash2, X } from 'lucide-react';
import { Amount } from '@/components/common';
import { Badge, Button, DatePicker, Input, Modal } from '@/components/ui';
import { goalInsightText, goalStatusLabel, goalStatusTone } from '@/constants/goals';
import type { GoalPricePayload, GoalStatus, GoalTracking } from '@/types';
import { cn } from '@/utils/cn';
import { todayISO } from '@/utils/date';
import { formatNumericDate, formatPercent, parseAmountInput } from '@/utils/format';
import { PriceDelta } from './PriceDelta';
import { PriceHistoryChart } from './PriceHistoryChart';
import { insightTone } from './meta';
import styles from './GoalDetailModal.module.css';

interface GoalDetailModalProps {
  /** A meta escolhida na lista; `null` mantem o modal fechado. */
  tracking: GoalTracking | null;
  saving: boolean;
  /** Aberto pelo atalho de registrar preco: o campo ja recebe o foco. */
  focusPriceForm: boolean;
  onClose: () => void;
  onEdit: (tracking: GoalTracking) => void;
  onDelete: (tracking: GoalTracking) => void;
  onStatusChange: (tracking: GoalTracking, status: GoalStatus) => void;
  /** Resolve para `true` quando o registro entrou; so entao o campo se limpa. */
  onAddPrice: (tracking: GoalTracking, payload: GoalPricePayload) => Promise<boolean>;
}

interface PriceForm {
  price: string;
  date: string;
  note: string;
}

const emptyPriceForm: PriceForm = { price: '', date: todayISO(), note: '' };

/**
 * O historico de uma meta: a analise, a curva, o formulario de registro e a
 * serie completa. E aqui que a tela ganha sentido — o cartao mostra o preco de
 * agora, e esta e a unica vista que responde se ele e caro ou barato dentro do
 * que ja foi visto.
 *
 * O registro de preco fica embutido, e nao num segundo modal: dois paineis
 * empilhados disputariam a trava de foco e o Escape do `Modal`, e quem acabou
 * de olhar o grafico ja esta no lugar certo para anotar o valor.
 */
export function GoalDetailModal({
  tracking,
  saving,
  focusPriceForm,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
  onAddPrice,
}: GoalDetailModalProps) {
  const [form, setForm] = useState<PriceForm>(emptyPriceForm);
  const [error, setError] = useState<string | undefined>(undefined);
  const priceRef = useRef<HTMLInputElement>(null);

  const goalId = tracking?.goal.id ?? null;

  useEffect(() => {
    if (!goalId) return;
    setForm(emptyPriceForm);
    setError(undefined);
  }, [goalId]);

  useEffect(() => {
    if (!goalId || !focusPriceForm) return;
    // O efeito do `Modal` roda antes deste — ele e componente filho —, entao o
    // foco pedido pelo atalho e o ultimo a ser aplicado e prevalece.
    priceRef.current?.focus();
  }, [goalId, focusPriceForm]);

  /** Cada registro com a variacao contra o imediatamente anterior. */
  const entries = useMemo(() => {
    if (!tracking) return [];

    return tracking.goal.history
      .map((entry, index) => {
        const previous = index > 0 ? tracking.goal.history[index - 1] : undefined;
        const change = previous ? Math.round((entry.price - previous.price) * 100) / 100 : 0;
        const percentage = previous && previous.price > 0 ? (change / previous.price) * 100 : 0;

        return { entry, change, percentage, first: index === 0 };
      })
      .reverse();
  }, [tracking]);

  if (!tracking) return null;

  const { goal, analysis } = tracking;
  const archived = goal.status !== 'ACOMPANHANDO';

  const handleRegister = async () => {
    const price = parseAmountInput(form.price);

    if (price === undefined || price <= 0) {
      setError('Informe um preço maior que zero!');
      priceRef.current?.focus();
      return;
    }
    if (!form.date) {
      setError('Informe a data da consulta!');
      return;
    }
    if (form.date > todayISO()) {
      setError('A data da consulta não pode estar no futuro!');
      return;
    }

    setError(undefined);

    const ok = await onAddPrice(tracking, {
      price,
      date: form.date,
      ...(form.note.trim() ? { note: form.note.trim() } : {}),
    });

    if (ok) setForm({ ...emptyPriceForm, date: todayISO() });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={goal.name}
      description={`${analysis.entryCount} ${analysis.entryCount === 1 ? 'registro' : 'registros'} · atualizado em ${formatNumericDate(analysis.lastUpdate)}`}
      size="lg"
      footer={
        <>
          <Button
            className={styles.footerStart}
            variant="ghost"
            icon={Trash2}
            disabled={saving}
            onClick={() => onDelete(tracking)}
          >
            Excluir
          </Button>
          <Button variant="secondary" icon={Pencil} disabled={saving} onClick={() => onEdit(tracking)}>
            Editar
          </Button>
          <Button onClick={onClose}>Fechar</Button>
        </>
      }
    >
      <header className={styles.head}>
        <div className={styles.headMain}>
          <span className={styles.headLabel}>Preço atual</span>
          <Amount value={analysis.currentPrice} size="lg" />
          {/* Ver o comentario equivalente em `GoalCard`: um registro so nao varia. */}
          {analysis.entryCount > 1 ? (
            <PriceDelta change={analysis.change} percentage={analysis.changePercentage} trend={analysis.trend} />
          ) : (
            <span className={styles.headHint}>Primeiro registro</span>
          )}
        </div>

        <Badge tone={goalStatusTone[goal.status]} dot={goal.status === 'ACOMPANHANDO'}>
          {goalStatusLabel[goal.status]}
        </Badge>
      </header>

      {/*
        A leitura do momento vem antes dos numeros: ela e a conclusao, e quem
        quiser conferir a conta encontra a faixa inteira logo abaixo.
      */}
      <p className={cn(styles.insight, styles[insightTone[analysis.insight]])}>
        <span className={styles.insightDot} aria-hidden="true" />
        {goalInsightText[analysis.insight]}
      </p>

      <dl className={styles.analysis}>
        <div>
          <dt>Preço inicial</dt>
          <dd>
            <Amount value={analysis.initialPrice} size="sm" />
          </dd>
        </div>
        <div>
          <dt>Menor preço</dt>
          <dd>
            <Amount value={analysis.lowestPrice} size="sm" tone="positive" />
          </dd>
        </div>
        <div>
          <dt>Maior preço</dt>
          <dd>
            <Amount value={analysis.highestPrice} size="sm" tone="negative" />
          </dd>
        </div>
        <div>
          <dt>Preço médio</dt>
          <dd>
            <Amount value={analysis.averagePrice} size="sm" tone="muted" />
          </dd>
        </div>
        <div>
          <dt>Variação total</dt>
          <dd className={styles.pair}>
            <Amount value={analysis.change} size="sm" sign="auto" />
            <span className="tabular">{formatPercent(Math.abs(analysis.changePercentage))}</span>
          </dd>
        </div>
        <div>
          {/* Nao e dinheiro guardado: e o que deixou de ser pago em relacao ao pico. */}
          <dt>Abaixo do maior preço</dt>
          <dd>
            <Amount value={analysis.savings} size="sm" tone={analysis.savings > 0 ? 'positive' : 'muted'} />
          </dd>
        </div>
      </dl>

      {/* Um ponto sozinho nao desenha evolucao nenhuma; o convite vale mais. */}
      {analysis.entryCount > 1 ? (
        <PriceHistoryChart history={goal.history} averagePrice={analysis.averagePrice} trend={analysis.trend} />
      ) : (
        <p className={styles.chartHint}>
          A curva de evolução aparece a partir do segundo preço registrado. Consulte o produto de novo em alguns
          dias e anote o valor aqui embaixo.
        </p>
      )}

      <section className={styles.register} aria-labelledby="goal-register-title">
        <h3 className={styles.sectionTitle} id="goal-register-title">
          Registrar preço
        </h3>
        <p className={styles.sectionHint}>
          Consultou de novo? Anote o valor. O preço anterior continua no histórico — é o que permite comparar.
        </p>

        <div className={styles.registerFields}>
          <Input
            ref={priceRef}
            className={styles.price}
            label="Preço"
            prefix="R$"
            inputMode="decimal"
            placeholder="0,00"
            value={form.price}
            onChange={(event) => {
              setForm((current) => ({ ...current, price: event.target.value }));
              if (error) setError(undefined);
            }}
            {...(error ? { error } : {})}
          />

          <DatePicker
            className={styles.date}
            label="Data"
            max={todayISO()}
            value={form.date}
            onChange={(date) => setForm((current) => ({ ...current, date }))}
          />

          <Input
            className={styles.note}
            label="Observação"
            placeholder="Cupom, frete grátis, loja..."
            value={form.note}
            onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
          />

          <Button className={styles.registerButton} loading={saving} onClick={handleRegister}>
            Registrar
          </Button>
        </div>
      </section>

      <section className={styles.historySection} aria-labelledby="goal-history-title">
        <h3 className={styles.sectionTitle} id="goal-history-title">
          Histórico de preços
        </h3>

        <ul className={styles.history}>
          {entries.map(({ entry, change, percentage, first }, index) => (
            <li key={entry.id} className={cn(styles.entry, 'list-item-in')} style={{ '--i': index } as CSSProperties}>
              <span className={`${styles.entryDate} tabular`}>{formatNumericDate(entry.date)}</span>

              <span className={styles.entryText}>
                <Amount value={entry.price} size="sm" />
                {entry.note ? <span className={styles.entryNote}>{entry.note}</span> : null}
              </span>

              {first ? (
                <span className={styles.entryFirst}>Primeiro registro</span>
              ) : (
                <PriceDelta
                  size="sm"
                  change={change}
                  percentage={percentage}
                  trend={change > 0 ? 'ALTA' : change < 0 ? 'BAIXA' : 'ESTAVEL'}
                />
              )}
            </li>
          ))}
        </ul>
      </section>

      <div className={styles.quickActions}>
        {goal.url ? (
          <a className={styles.link} href={goal.url} target="_blank" rel="noreferrer noopener">
            <ExternalLink size={16} strokeWidth={2} aria-hidden="true" />
            Abrir a página do produto
          </a>
        ) : null}

        <span className={styles.statusActions}>
          {archived ? (
            <Button variant="secondary" size="sm" icon={RotateCcw} disabled={saving} onClick={() => onStatusChange(tracking, 'ACOMPANHANDO')}>
              Voltar a acompanhar
            </Button>
          ) : (
            <>
              <Button variant="secondary" size="sm" icon={Check} disabled={saving} onClick={() => onStatusChange(tracking, 'COMPRADA')}>
                Marcar como comprado
              </Button>
              <Button variant="ghost" size="sm" icon={X} disabled={saving} onClick={() => onStatusChange(tracking, 'CANCELADA')}>
                Cancelar meta
              </Button>
            </>
          )}
        </span>
      </div>

      {goal.notes ? <p className={styles.notes}>{goal.notes}</p> : null}
    </Modal>
  );
}
