import { Pause, Play, Trash2 } from 'lucide-react';
import { Amount } from '@/components/common';
import { Badge } from '@/components/ui';
import { RECURRING_DUE_SOON_DAYS, recurrenceLabel, recurringStatusLabel, recurringStatusTone } from '@/constants/recurring';
import type { RecurringExpense } from '@/types';
import { daysBetween, todayISO } from '@/utils/date';
import { capitalize, formatDueLabel, formatNumericDate } from '@/utils/format';
import styles from './RecurringCard.module.css';

interface RecurringCardProps {
  expense: RecurringExpense;
  onEdit: (expense: RecurringExpense) => void;
  onToggle: (expense: RecurringExpense) => void;
  onDelete: (expense: RecurringExpense) => void;
}

/**
 * Uma despesa fixa do cadastro. Alem de editar e excluir, o cartao traz pausar
 * e retomar: suspender uma assinatura por dois meses e a operacao mais comum
 * aqui, e obriga-la a passar pelo formulario inteiro seria desproporcional.
 */
export function RecurringCard({ expense, onEdit, onToggle, onDelete }: RecurringCardProps) {
  const paused = expense.status === 'paused';
  const days = daysBetween(todayISO(), expense.nextDueDate);
  const dueSoon = !paused && days >= 0 && days <= RECURRING_DUE_SOON_DAYS;

  return (
    <li className={styles.card}>
      <button type="button" className={styles.open} onClick={() => onEdit(expense)}>
        <span className="visually-hidden">Editar {expense.description}</span>
      </button>

      <div className={styles.content}>
        <div className={styles.top}>
          <span className={styles.identity}>
            <span className={styles.name}>{expense.description}</span>
            <span className={styles.meta}>
              {expense.category ? (
                <>
                  <span
                    className={styles.marker}
                    style={{ backgroundColor: `var(--chart-${expense.category.colorToken})` }}
                    aria-hidden="true"
                  />
                  {expense.category.name}
                  <span className={styles.separator} aria-hidden="true">
                    ·
                  </span>
                </>
              ) : null}
              {expense.accountName}
            </span>
          </span>

          <span className={styles.actions}>
            <button
              type="button"
              className={styles.action}
              aria-label={paused ? `Retomar ${expense.description}` : `Pausar ${expense.description}`}
              onClick={() => onToggle(expense)}
            >
              {paused ? <Play size={16} strokeWidth={2} /> : <Pause size={16} strokeWidth={2} />}
            </button>
            <button
              type="button"
              className={`${styles.action} ${styles.delete}`}
              aria-label={`Excluir ${expense.description}`}
              onClick={() => onDelete(expense)}
            >
              <Trash2 size={16} strokeWidth={2} />
            </button>
          </span>
        </div>

        <div className={styles.figures}>
          <Amount value={expense.amount} size="lg" tone={paused ? 'muted' : 'default'} />
          <Badge tone="neutral">{recurrenceLabel[expense.frequency]}</Badge>
        </div>

        <div className={styles.bottom}>
          <span className={`${styles.due} ${dueSoon ? styles.dueSoon : ''}`}>
            {paused ? (
              'Sem vencimento enquanto pausada'
            ) : (
              <>
                {formatNumericDate(expense.nextDueDate)}
                <span className={styles.separator} aria-hidden="true">
                  ·
                </span>
                {capitalize(formatDueLabel(expense.nextDueDate))}
              </>
            )}
          </span>

          {paused ? (
            <Badge tone={recurringStatusTone[expense.status]} dot>
              {recurringStatusLabel[expense.status]}
            </Badge>
          ) : null}
        </div>
      </div>
    </li>
  );
}
