import { ChevronLeft, ChevronRight } from 'lucide-react';
import { shiftMonthKey } from '@/utils/date';
import { capitalize, formatMonthLabel } from '@/utils/format';
import styles from './MonthNavigator.module.css';

interface MonthNavigatorProps {
  /** Mes exibido, YYYY-MM. */
  month: string;
  onChange: (month: string) => void;
  /** Ultimo mes navegavel, inclusive. */
  max: string;
  /** Primeiro mes navegavel, inclusive. */
  min: string;
}

/**
 * Navegacao mes a mes. Duas setas em vez de uma lista: o orcamento se consulta
 * em sequencia — "e no mes passado?" — e um seletor com doze opcoes pediria
 * dois cliques para responder a pergunta mais comum da tela.
 *
 * O rotulo tem largura fixa para que as setas nao se desloquem entre "Maio" e
 * "Setembro": um alvo que se move sob o cursor obriga a mirar de novo a cada
 * clique.
 */
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
