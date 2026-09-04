import { Trash2 } from 'lucide-react';
import { Amount } from '@/components/common';
import { ProgressBar } from '@/components/ui';
import { investmentClassIcon, investmentClassLabel } from '@/constants/investments';
import type { InvestmentPosition } from '@/types';
import { formatFullDate, formatSignedPercent } from '@/utils/format';
import { classColor, profitTone } from './meta';
import styles from './InvestmentCard.module.css';

interface InvestmentCardProps {
  position: InvestmentPosition;
  onEdit: (position: InvestmentPosition) => void;
  onDelete: (position: InvestmentPosition) => void;
}

/**
 * Uma posicao da carteira. Segue o mesmo arranjo do cartao de conta — o cartao
 * inteiro abre a edicao e so o excluir recebe ponteiro proprio —, porque as
 * duas telas fazem a mesma promessa: uma lista de cadastros que se edita
 * clicando no item.
 */
export function InvestmentCard({ position, onEdit, onDelete }: InvestmentCardProps) {
  const { investment, profit, profitability, share } = position;
  const Icon = investmentClassIcon[investment.assetClass];

  return (
    <li className={styles.card}>
      <button type="button" className={styles.open} onClick={() => onEdit(position)}>
        <span className="visually-hidden">Editar {investment.name}</span>
      </button>

      <div className={styles.content}>
        <div className={styles.top}>
          <span
            className={styles.iconBox}
            style={{ color: classColor(investment.assetClass) }}
            aria-hidden="true"
          >
            <Icon size={18} strokeWidth={1.75} />
          </span>

          <span className={styles.identity}>
            <span className={styles.name}>{investment.name}</span>
            <span className={styles.meta}>
              {investmentClassLabel[investment.assetClass]}
              <span className={styles.separator} aria-hidden="true">
                ·
              </span>
              {investment.institution}
            </span>
          </span>

          <button
            type="button"
            className={styles.delete}
            aria-label={`Excluir ${investment.name}`}
            onClick={() => onDelete(position)}
          >
            <Trash2 size={16} strokeWidth={2} />
          </button>
        </div>

        <div className={styles.figures}>
          <span className={styles.value}>
            <span className={styles.figureLabel}>Valor atual</span>
            <Amount value={investment.currentValue} size="lg" />
          </span>

          <span className={styles.profit}>
            <span className={styles.figureLabel}>Resultado</span>
            <span className={styles.profitRow}>
              <Amount value={profit} tone={profitTone(profit)} sign="auto" />
              <span className={`${styles.percent} tabular`}>{formatSignedPercent(profitability * 100)}</span>
            </span>
          </span>
        </div>

        <div className={styles.share}>
          <ProgressBar
            value={share}
            label={`Participação de ${investment.name} no patrimônio`}
            className={styles.shareBar}
          />
          <span className={styles.shareLabel}>
            <span className="tabular">{Math.round(share * 100)}%</span> da carteira · aportado{' '}
            <Amount className={styles.inline} value={investment.invested} size="sm" tone="muted" />
          </span>
        </div>

        <p className={styles.since}>Desde {formatFullDate(investment.startDate)}</p>
      </div>
    </li>
  );
}
