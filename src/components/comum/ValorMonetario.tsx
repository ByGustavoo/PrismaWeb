import type { CSSProperties } from 'react';
import { useContagem } from '@/hooks/useContagem';
import { juntarClasses } from '@/utils/juntarClasses';
import { formatarPartesMoeda } from '@/utils/formatacao';
import styles from './ValorMonetario.module.css';

export type TomValorMonetario = 'default' | 'positive' | 'negative' | 'muted';
export type TamanhoValorMonetario = 'sm' | 'md' | 'lg' | 'display';

export interface ValorMonetarioProps {
  valor: number;
  tom?: TomValorMonetario;
  tamanho?: TamanhoValorMonetario;
  sinal?: 'auto' | 'plus' | 'minus' | 'none';
  animar?: boolean;
  contarAoAparecer?: boolean;
  className?: string;
}

function resolverSinal(value: number, sign: ValorMonetarioProps['sinal']): string {
  if (sign === 'plus') return '+';
  if (sign === 'minus') return '-';
  if (sign === 'auto') return value > 0 ? '+' : value < 0 ? '-' : '';
  return value < 0 ? '-' : '';
}

export function ValorMonetario({
  valor,
  tom = 'default',
  tamanho = 'md',
  sinal = 'none',
  animar = false,
  contarAoAparecer = false,
  className,
}: ValorMonetarioProps) {
  const { valor: shown, executando } = useContagem(valor, contarAoAparecer);

  const prefix = resolverSinal(shown, sinal);
  const { simbolo, algarismos } = formatarPartesMoeda(Math.abs(shown));

  return (
    <span className={juntarClasses(styles.amount, styles[tom], styles[tamanho], className)}>
      <span className={styles.symbol}>
        {prefix}
        {simbolo}
      </span>
      {animar && !executando ? (
        <AlgarismosRolantes digits={algarismos} />
      ) : (
        <span className={juntarClasses('tabular', styles.digits)}>{algarismos}</span>
      )}
    </span>
  );
}

const RODA = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

const ATRASO_MAXIMO = 5;

function AlgarismosRolantes({ digits }: { digits: string }) {
  const chars = [...digits];

  return (
    <>
      <span className="visually-hidden">{digits}</span>

      <span className={juntarClasses('tabular', styles.digits, styles.roller)} aria-hidden="true">
        {chars.map((char, index) => {
          const key = chars.length - index;
          const digit = RODA.indexOf(char);

          if (digit < 0) {
            return (
              <span key={key} className={styles.separator}>
                {char}
              </span>
            );
          }

          return (
            <span key={key} className={styles.slot}>
              <span className={styles.ghost}>0</span>
              <span
                className={styles.wheel}
                style={{ '--digit': digit, '--order': Math.min(index, ATRASO_MAXIMO) } as CSSProperties}
              >
                {RODA.map((face) => (
                  <span key={face} className={styles.face}>
                    {face}
                  </span>
                ))}
              </span>
            </span>
          );
        })}
      </span>
    </>
  );
}
