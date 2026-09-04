import { Trash2 } from 'lucide-react';
import { Amount } from '@/components/common';
import { Badge, ProgressBar } from '@/components/ui';
import { budgetProgressTone, budgetStatusLabel, budgetStatusTone } from '@/constants/budget';
import type { BudgetUsage } from '@/types';
import { formatPercent } from '@/utils/format';
import styles from './BudgetRow.module.css';

interface BudgetRowProps {
  usage: BudgetUsage;
  /** Projecao so faz sentido num mes em andamento; num mes fechado ela e o gasto. */
  showProjection: boolean;
  onEdit: (usage: BudgetUsage) => void;
  onDelete: (usage: BudgetUsage) => void;
}

/**
 * Um limite da lista. A pergunta que a linha responde e "quanto do meu limite
 * ja foi", e por isso o par valor/limite vem antes da barra: o numero e a
 * resposta exata, a barra e a leitura de relance.
 */
export function BudgetRow({ usage, showProjection, onEdit, onDelete }: BudgetRowProps) {
  const { budget, spent, remaining, ratio, projected, status } = usage;
  const exceeded = status === 'exceeded';

  return (
    <li className={styles.row}>
      <button type="button" className={styles.open} onClick={() => onEdit(usage)}>
        <span className="visually-hidden">Editar o limite de {budget.category.name}</span>
      </button>

      <div className={styles.content}>
        <div className={styles.top}>
          <span
            className={styles.marker}
            style={{ backgroundColor: `var(--chart-${budget.category.colorToken})` }}
            aria-hidden="true"
          />
          <span className={styles.name}>{budget.category.name}</span>

          <Badge tone={budgetStatusTone[status]} className={styles.badge}>
            {budgetStatusLabel[status]}
          </Badge>

          <button
            type="button"
            className={styles.delete}
            aria-label={`Excluir o limite de ${budget.category.name}`}
            onClick={() => onDelete(usage)}
          >
            <Trash2 size={16} strokeWidth={2} />
          </button>
        </div>

        <div className={styles.figures}>
          <span className={styles.amounts}>
            <Amount value={spent} size="md" />
            <span className={styles.divider} aria-hidden="true">
              /
            </span>
            <Amount value={budget.limit} size="sm" tone="muted" />
          </span>
          <span className={`${styles.ratio} tabular`}>{formatPercent(ratio * 100, 0)}</span>
        </div>

        <ProgressBar
          value={ratio}
          tone={budgetProgressTone[status]}
          label={`${budget.category.name}: ${formatPercent(ratio * 100, 0)} do limite`}
        />

        <p className={styles.note}>
          {exceeded ? (
            <>
              Passou do limite em{' '}
              <Amount className={styles.inline} value={Math.abs(remaining)} size="sm" tone="negative" />.
            </>
          ) : (
            <>
              Ainda cabem <Amount className={styles.inline} value={remaining} size="sm" />.
            </>
          )}
          {showProjection ? (
            <span className={styles.projection}>
              No ritmo atual, <Amount className={styles.inline} value={projected} size="sm" tone="muted" /> até o fim
              do mês.
            </span>
          ) : null}
        </p>
      </div>
    </li>
  );
}
