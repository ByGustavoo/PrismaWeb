import { ChevronLeft, ChevronRight } from 'lucide-react';
import { shiftMonthKey } from '@/utils/date';
import { capitalize, formatMonthLabel } from '@/utils/format';
import styles from './MonthNavigator.module.css';

interface MonthNavigatorProps {
  month: string;
  onChange: (month: string) => void;
  max: string;
  min: string;
}

export function MonthNavigator({ month, onChange, max, min }: MonthNavigatorProps) {
  const previous = shiftMonthKey(month, -1);
  const next = shiftMonthKey(month, 1);

  return (
    <div className={styles.navigator}>
      <button
        type="button"
        className={styles.arrow}
        onClick={() => onChange(previous)}
        disabled={previous < min}
        aria-label={`Mês anterior: ${capitalize(formatMonthLabel(previous))}`}
      >
        <ChevronLeft size={16} strokeWidth={2} />
      </button>

      <span className={styles.label} aria-live="polite">
        {capitalize(formatMonthLabel(month))}
      </span>

      <button
        type="button"
        className={styles.arrow}
        onClick={() => onChange(next)}
        disabled={next > max}
        aria-label={`Próximo mês: ${capitalize(formatMonthLabel(next))}`}
      >
        <ChevronRight size={16} strokeWidth={2} />
      </button>
    </div>
  );
}
