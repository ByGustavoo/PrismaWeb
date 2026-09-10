import { useState } from 'react';
import type { CSSProperties } from 'react';
import { ExternalLink, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Amount } from '@/components/common';
import { Badge } from '@/components/ui';
import { goalStatusLabel, goalStatusTone } from '@/constants/goals';
import type { GoalTracking } from '@/types';
import { formatNumericDate } from '@/utils/format';
import { PriceDelta } from './PriceDelta';
import { PriceSparkline } from './PriceSparkline';
import styles from './GoalCard.module.css';

interface GoalCardProps {
  tracking: GoalTracking;
  index: number;
  onOpen: (tracking: GoalTracking) => void;
  onRegisterPrice: (tracking: GoalTracking) => void;
  onDelete: (tracking: GoalTracking) => void;
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

export function GoalCard({ tracking, index, onOpen, onRegisterPrice, onDelete }: GoalCardProps) {
  const { goal, analysis } = tracking;
  const [imageBroken, setImageBroken] = useState(false);
  const host = goal.url ? hostOf(goal.url) : null;
  const archived = goal.status !== 'ACOMPANHANDO';

  return (
    <li className={`${styles.card} ${archived ? styles.archived : ''} list-item-in`} style={{ '--i': index } as CSSProperties}>
      <button type="button" className={styles.open} onClick={() => onOpen(tracking)}>
        <span className="visually-hidden">Ver histórico de preços de {goal.name}</span>
      </button>

      <div className={styles.content}>
        <div className={styles.top}>
          <span className={styles.thumb}>
            {goal.imageUrl && !imageBroken ? (
              <img
                src={goal.imageUrl}
                alt=""
                loading="lazy"
                width={48}
                height={48}
                onError={() => setImageBroken(true)}
              />
            ) : (
              <ShoppingBag size={20} strokeWidth={1.75} aria-hidden="true" />
            )}
          </span>

          <span className={styles.identity}>
            <span className={styles.name}>{goal.name}</span>
            <span className={styles.meta}>
              {host ?? 'Sem link'}
              <span className={styles.separator} aria-hidden="true">
                ·
              </span>
              {analysis.entryCount} {analysis.entryCount === 1 ? 'registro' : 'registros'}
            </span>
          </span>
        </div>

        <div className={styles.figures}>
          <span className={styles.price}>
            <span className={styles.figureLabel}>Preço atual</span>
            <Amount value={analysis.currentPrice} size="lg" />
          </span>
          {analysis.entryCount > 1 ? (
            <PriceDelta
              className={styles.delta}
              change={analysis.change}
              percentage={analysis.changePercentage}
              trend={analysis.trend}
            />
          ) : (
            <span className={styles.firstOnly}>Primeiro registro</span>
          )}
        </div>

        {analysis.entryCount > 1 ? (
          <PriceSparkline
            className={styles.spark}
            prices={goal.history.map((entry) => entry.price)}
            trend={analysis.trend}
          />
        ) : (
          <p className={styles.sparkHint}>Registre o preço de novo para ver a evolução.</p>
        )}

        <p className={styles.since}>
          Registrado a <Amount className={styles.inline} value={analysis.initialPrice} size="sm" tone="muted" /> ·
          atualizado em <span className="tabular">{formatNumericDate(analysis.lastUpdate)}</span>
        </p>

        <div className={styles.bottom}>
          <Badge tone={goalStatusTone[goal.status]} dot={goal.status === 'ACOMPANHANDO'}>
            {goalStatusLabel[goal.status]}
          </Badge>

          <span className={styles.actions}>
            {goal.url ? (
              <a
                className={styles.action}
                href={goal.url}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={`Abrir a página de ${goal.name} em uma nova aba`}
              >
                <ExternalLink size={16} strokeWidth={2} />
              </a>
            ) : null}

            <button
              type="button"
              className={styles.action}
              aria-label={`Registrar um preço novo para ${goal.name}`}
              onClick={() => onRegisterPrice(tracking)}
            >
              <Plus size={16} strokeWidth={2} />
            </button>

            <button
              type="button"
              className={`${styles.action} ${styles.delete}`}
              aria-label={`Excluir ${goal.name}`}
              onClick={() => onDelete(tracking)}
            >
              <Trash2 size={16} strokeWidth={2} />
            </button>
          </span>
        </div>
      </div>
    </li>
  );
}
