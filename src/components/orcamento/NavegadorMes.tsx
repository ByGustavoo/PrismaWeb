import { ChevronLeft, ChevronRight } from 'lucide-react';
import { deslocarChaveMes } from '@/utils/data';
import { capitalizar, formatarRotuloMes } from '@/utils/formatacao';
import styles from './NavegadorMes.module.css';

interface NavegadorMesProps {
  mes: string;
  aoAlterar: (month: string) => void;
  maximo: string;
  minimo: string;
}

export function NavegadorMes({ mes, aoAlterar, maximo, minimo }: NavegadorMesProps) {
  const previous = deslocarChaveMes(mes, -1);
  const next = deslocarChaveMes(mes, 1);

  return (
    <div className={styles.navigator}>
      <button
        type="button"
        className={styles.arrow}
        onClick={() => aoAlterar(previous)}
        disabled={previous < minimo}
        aria-label={`Mês anterior: ${capitalizar(formatarRotuloMes(previous))}`}
      >
        <ChevronLeft size={16} strokeWidth={2} />
      </button>

      <span className={styles.label} aria-live="polite">
        {capitalizar(formatarRotuloMes(mes))}
      </span>

      <button
        type="button"
        className={styles.arrow}
        onClick={() => aoAlterar(next)}
        disabled={next > maximo}
        aria-label={`Próximo mês: ${capitalizar(formatarRotuloMes(next))}`}
      >
        <ChevronRight size={16} strokeWidth={2} />
      </button>
    </div>
  );
}
