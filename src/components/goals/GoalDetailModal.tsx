import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Check, ExternalLink, Pencil, RotateCcw, Trash2, X } from 'lucide-react';
import { Amount } from '@/components/common';
import { Badge, Button, DatePicker, Input, Modal } from '@/components/ui';
import { goalInsightText, goalStatusLabel, goalStatusTone } from '@/constants/goals';
import { textLimits } from '@/constants/validation';
import { useFormValidation } from '@/hooks/useFormValidation';
import type { FieldErrors } from '@/hooks/useFormValidation';
import type { Goal, GoalPricePayload, GoalStatus, GoalTracking } from '@/types';
import { cn } from '@/utils/cn';
import { todayISO } from '@/utils/date';
import { formatNumericDate, formatPercent, parseAmountInput } from '@/utils/format';
import { amountError, textError } from '@/utils/validation';
import { PriceDelta } from './PriceDelta';
import { PriceHistoryChart } from './PriceHistoryChart';
import { insightTone } from './meta';
import styles from './GoalDetailModal.module.css';

interface GoalDetailModalProps {
  tracking: GoalTracking | null;
  saving: boolean;
  focusPriceForm: boolean;
  onClose: () => void;
  onEdit: (tracking: GoalTracking) => void;
  onDelete: (tracking: GoalTracking) => void;
  onStatusChange: (tracking: GoalTracking, status: GoalStatus) => void;
  onAddPrice: (tracking: GoalTracking, payload: GoalPricePayload) => Promise<boolean>;
}

interface PriceForm {
  price: string;
  date: string;
  note: string;
}

function emptyPriceForm(): PriceForm {
  return { price: '', date: todayISO(), note: '' };
}

function validatePrice(form: PriceForm, goal: Goal): FieldErrors<PriceForm> {
  const errors: FieldErrors<PriceForm> = {
    price: amountError(form.price, {
      subject: 'O preço',
      missing: 'Informe o preço que você consultou!',
      sign: 'positive',
    }),
    note: textError(form.note, { subject: 'A observação', max: textLimits.notes }),
  };

  if (!form.date) {
    errors.date = 'Informe a data da consulta!';
  } else if (form.date > todayISO()) {
    errors.date = 'A data da consulta não pode estar no futuro!';
  } else if (form.date < goal.createdAt) {
    errors.date = `A data da consulta não pode ser anterior ao primeiro preço, de ${formatNumericDate(goal.createdAt)}!`;
  }

  const price = parseAmountInput(form.price);
  if (!errors.price && !errors.date && goal.history.some((entry) => entry.date === form.date && entry.price === price)) {
    errors.price = 'Esse preço já está registrado nessa data!';
  }

  return errors;
}

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
  const priceRef = useRef<HTMLInputElement>(null);
  const { errors, formRef, touch, submit, reset } = useFormValidation(
    form,
    (values) => (tracking ? validatePrice(values, tracking.goal) : {}),
    { limits: { note: textLimits.notes } },
  );

  const goalId = tracking?.goal.id ?? null;

  useEffect(() => {
    if (!goalId) return;
    setForm(emptyPriceForm());
    reset();
  }, [goalId, reset]);

  useEffect(() => {
    if (!goalId || !focusPriceForm) return;
    priceRef.current?.focus();
  }, [goalId, focusPriceForm]);

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
    if (!submit()) return;

    const ok = await onAddPrice(tracking, {
      price: parseAmountInput(form.price) ?? 0,
      date: form.date,
      ...(form.note.trim() ? { note: form.note.trim() } : {}),
    });

    if (ok) {
      setForm(emptyPriceForm());
      reset();
    }
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
          <dt>Abaixo do maior preço</dt>
          <dd>
            <Amount value={analysis.savings} size="sm" tone={analysis.savings > 0 ? 'positive' : 'muted'} />
          </dd>
        </div>
      </dl>

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

        <form
          ref={formRef}
          className={styles.registerFields}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void handleRegister();
          }}
        >
          <Input
            ref={priceRef}
            className={styles.price}
            required
            label="Preço"
            prefix="R$"
            inputMode="decimal"
            placeholder="0,00"
            value={form.price}
            onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
            onBlur={() => touch('price')}
            error={errors.price}
          />

          <DatePicker
            className={styles.date}
            required
            label="Data"
            min={goal.createdAt}
            max={todayISO()}
            value={form.date}
            onChange={(date) => setForm((current) => ({ ...current, date }))}
            error={errors.date}
          />

          <Input
            className={styles.note}
            label="Observação"
            placeholder="Cupom, frete grátis, loja..."
            value={form.note}
            onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
            onBlur={() => touch('note')}
            characterLimit={textLimits.notes}
            error={errors.note}
          />

          <Button type="submit" className={styles.registerButton} loading={saving}>
            Registrar
          </Button>
        </form>
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
