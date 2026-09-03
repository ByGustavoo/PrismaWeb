import { useId, useState } from 'react';
import { Check, ChevronDown, Pencil, Trash2 } from 'lucide-react';
import { Amount } from '@/components/common';
import { installmentStatusTone } from '@/components/cards';
import { Badge, Button, ProgressBar } from '@/components/ui';
import { installmentStatusLabel } from '@/constants/cards';
import type { InstallmentPlan, InstallmentPurchase } from '@/types';
import { cn } from '@/utils/cn';
import { formatFullDate, formatShortDate, formatShortMonth } from '@/utils/format';
import styles from './InstallmentCard.module.css';

interface InstallmentCardProps {
  plan: InstallmentPlan;
  onEdit: (purchase: InstallmentPurchase) => void;
  onDelete: (purchase: InstallmentPurchase) => void;
}

/**
 * Uma compra parcelada. O cabecalho responde de relance — quantas parcelas ja
 * foram, quanto falta — e o cronograma completo fica atras de um botao: dez ou
 * doze linhas de datas abertas em toda compra transformariam a lista num
 * calendario.
 *
 * A barra e segmentada de proposito: seis blocos cheios de doze se contam com o
 * olho, enquanto uma faixa pela metade so diz "mais ou menos metade".
 */
export function InstallmentCard({ plan, onEdit, onDelete }: InstallmentCardProps) {
  const [expanded, setExpanded] = useState(false);
  const scheduleId = useId();
  const { purchase, current } = plan;

  const settled = plan.remainingCount === 0;

  return (
    <li className={styles.card}>
      <header className={styles.header}>
        <span className={styles.identity}>
          <span className={styles.titleRow}>
            <span className={styles.title}>{purchase.description}</span>
            {settled ? (
              <Badge tone="positive" dot>
                Quitada
              </Badge>
            ) : null}
          </span>
          <span className={styles.meta}>
            {purchase.cardName}
            {purchase.category ? (
              <>
                <span className={styles.separator} aria-hidden="true">
                  ·
                </span>
                <span className={styles.category}>
                  <span
                    className={styles.categoryDot}
                    style={{ backgroundColor: `var(--chart-${purchase.category.colorToken})` }}
                    aria-hidden="true"
                  />
                  {purchase.category.name}
                </span>
              </>
            ) : null}
            <span className={styles.separator} aria-hidden="true">
              ·
            </span>
            {formatFullDate(purchase.purchaseDate)}
          </span>
        </span>

        <span className={styles.actions}>
          <Button
            variant="ghost"
            size="sm"
            icon={Pencil}
            aria-label={`Editar ${purchase.description}`}
            onClick={() => onEdit(purchase)}
          />
          <Button
            variant="ghost"
            size="sm"
            icon={Trash2}
            className={styles.delete}
            aria-label={`Excluir ${purchase.description}`}
            onClick={() => onDelete(purchase)}
          />
        </span>
      </header>

      <div className={styles.headline}>
        <span className={styles.plan}>
          <span className="tabular">{purchase.count}x</span> de{' '}
          <Amount value={plan.installmentAmount} size="md" />
        </span>
        <span className={styles.total}>
          Total <Amount value={purchase.totalAmount} size="sm" tone="muted" />
        </span>
      </div>

      <ProgressBar
        value={plan.paidCount / purchase.count}
        tone={settled ? 'positive' : 'accent'}
        segments={purchase.count}
        label={`Parcelas pagas de ${purchase.description}`}
      />

      <p className={styles.progressText}>
        {settled ? (
          <>Todas as {purchase.count} parcelas pagas</>
        ) : (
          <>
            Parcela <strong className="tabular">{current?.number ?? plan.paidCount}</strong> de{' '}
            <span className="tabular">{purchase.count}</span>
            <span className={styles.separator} aria-hidden="true">
              ·
            </span>
            <span className="tabular">{plan.paidCount}</span>{' '}
            {plan.paidCount === 1 ? 'paga' : 'pagas'}
            <span className={styles.separator} aria-hidden="true">
              ·
            </span>
            <span className="tabular">{plan.remainingCount}</span>{' '}
            {plan.remainingCount === 1 ? 'restante' : 'restantes'}
          </>
        )}
      </p>

      <dl className={styles.facts}>
        <div className={styles.fact}>
          <dt>Já pago</dt>
          <dd>
            {/* Zero em verde soaria como boa noticia; ainda nao ha nada pago. */}
            <Amount value={plan.paidAmount} size="sm" tone={plan.paidAmount > 0 ? 'positive' : 'muted'} />
          </dd>
        </div>
        <div className={styles.fact}>
          <dt>Falta pagar</dt>
          <dd>
            <Amount value={plan.remainingAmount} size="sm" />
          </dd>
        </div>
        <div className={styles.fact}>
          <dt>Próxima parcela</dt>
          <dd className="tabular">{current ? formatShortMonth(current.month) : '—'}</dd>
        </div>
      </dl>

      <button
        type="button"
        className={styles.toggle}
        aria-expanded={expanded}
        aria-controls={scheduleId}
        onClick={() => setExpanded((value) => !value)}
      >
        {expanded ? 'Ocultar parcelas' : `Ver as ${purchase.count} parcelas`}
        <ChevronDown className={cn(styles.chevron, expanded && styles.chevronOpen)} size={15} strokeWidth={2} />
      </button>

      {/*
        Todas as parcelas, e nao so as futuras: ver as pagas ao lado das que vem
        e o que deixa claro em que mes o compromisso termina.
      */}
      <ul id={scheduleId} className={styles.schedule} hidden={!expanded}>
        {plan.schedule.map((installment) => {
          const paid = installment.status === 'paid';

          return (
            <li
              key={installment.number}
              className={cn(
                styles.installment,
                paid && styles.installmentPaid,
                installment.status === 'current' && styles.installmentCurrent,
              )}
            >
              <span className={`${styles.number} tabular`}>
                {installment.number}/{purchase.count}
              </span>

              <span className={styles.when}>
                <span className={`${styles.month} tabular`}>{formatShortMonth(installment.month)}</span>
                {/* Forma curta: o mes ao lado ja diz o ciclo, aqui basta o dia. */}
                <span className={styles.dueDate}>vence {formatShortDate(installment.dueDate)}</span>
              </span>

              <Amount value={installment.amount} size="sm" tone={paid ? 'muted' : 'default'} />

              {/*
                So a parcela em curso leva selo. Repetir "A vencer" em oito linhas
                seguidas nao acrescenta nada; a paga se anuncia pelo visto, que e
                simbolo, e nao apenas cor.
              */}
              <span className={styles.installmentStatus}>
                {installment.status === 'current' ? (
                  <Badge tone={installmentStatusTone.current} dot>
                    {installmentStatusLabel.current}
                  </Badge>
                ) : paid ? (
                  <span className={styles.paidMark}>
                    <Check size={14} strokeWidth={2.5} aria-hidden="true" />
                    <span className={styles.paidLabel}>{installmentStatusLabel.paid}</span>
                  </span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
    </li>
  );
}
