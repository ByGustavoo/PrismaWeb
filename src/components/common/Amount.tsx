import type { CSSProperties } from 'react';
import { useCountUp } from '@/hooks/useCountUp';
import { cn } from '@/utils/cn';
import { formatCurrencyParts } from '@/utils/format';
import styles from './Amount.module.css';

export type AmountTone = 'default' | 'positive' | 'negative' | 'muted';
export type AmountSize = 'sm' | 'md' | 'lg' | 'display';

export interface AmountProps {
  value: number;
  tone?: AmountTone;
  size?: AmountSize;
  /** Mostra "+" ou "-" antes do valor. */
  sign?: 'auto' | 'plus' | 'minus' | 'none';
  /**
   * Faz os algarismos rolarem ate o valor novo. Reservado aos numeros que
   * mudam sob o olhar de quem esta lendo — os do dashboard, quando o seletor
   * de periodo troca o recorte. Numa tabela de cinquenta linhas o mesmo efeito
   * viraria agitacao sem informacao.
   */
  animate?: boolean;
  /**
   * Conta de zero ate o valor na primeira vez que ele aparece. E para os
   * indicadores que a tela existe para mostrar — saldo, entradas, saidas,
   * resultado, os quatro tiles —, nao para todo numero da interface: uma
   * listagem inteira contando ao mesmo tempo seria festa, nao leitura.
   */
  countUp?: boolean;
  className?: string;
}

function resolveSign(value: number, sign: AmountProps['sign']): string {
  if (sign === 'plus') return '+';
  if (sign === 'minus') return '-';
  if (sign === 'auto') return value > 0 ? '+' : value < 0 ? '-' : '';
  // Sem sinal explicito um valor negativo ainda precisa aparecer como negativo.
  return value < 0 ? '-' : '';
}

/**
 * Valor monetario com algarismos tabulares.
 * O simbolo fica em um span proprio: ele usa a familia de interface, enquanto os
 * algarismos usam a familia de numeros. Isso mantem "R$" com o mesmo tamanho,
 * peso e espacamento em todos os tamanhos e em todas as telas.
 */
export function Amount({
  value,
  tone = 'default',
  size = 'md',
  sign = 'none',
  animate = false,
  countUp = false,
  className,
}: AmountProps) {
  const { value: shown, running } = useCountUp(value, countUp);

  const prefix = resolveSign(shown, sign);
  const { symbol, digits } = formatCurrencyParts(Math.abs(shown));

  /*
   * As duas animacoes nao se sobrepoem, e nao poderiam: as rodas assentam por
   * transicao de CSS, que precisa de um valor parado para mirar. Durante a
   * contagem os algarismos sao texto comum — dezenas de quadros com dez faces
   * por casa seria trabalho jogado fora — e as rodas assumem quando ela acaba,
   * ja no valor final, entao a troca nao aparece.
   */
  return (
    <span className={cn(styles.amount, styles[tone], styles[size], className)}>
      <span className={styles.symbol}>
        {prefix}
        {symbol}
      </span>
      {animate && !running ? (
        <RollingDigits digits={digits} />
      ) : (
        <span className={cn('tabular', styles.digits)}>{digits}</span>
      )}
    </span>
  );
}

/** Uma coluna por algarismo, sempre com os dez a postos. */
const WHEEL = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * Quantas colunas o escalonamento percorre antes de todas partirem juntas. Sem
 * teto, um valor na casa dos milhoes atrasaria a ultima coluna a ponto de o
 * numero parecer travado no meio do caminho.
 */
const MAX_STAGGER = 5;

/**
 * Os algarismos como rodas de contador: cada coluna guarda os dez digitos e
 * desliza ate o seu. So o que muda se move — as casas que continuam iguais
 * ficam paradas —, e o deslocamento vai da esquerda para a direita, na ordem em
 * que o numero e lido.
 *
 * A rolagem inteira e `transform` numa camada propria: nenhuma casa reposiciona
 * o texto ao lado. Sob `prefers-reduced-motion` o global zera duracao e atraso,
 * e a troca vira um corte seco — que continua correto.
 */
function RollingDigits({ digits }: { digits: string }) {
  const chars = [...digits];

  return (
    <>
      {/* As colunas leem "0123456789" para o leitor de tela; o valor vem daqui. */}
      <span className="visually-hidden">{digits}</span>

      <span className={cn('tabular', styles.digits, styles.roller)} aria-hidden="true">
        {chars.map((char, index) => {
          /*
           * A identidade de uma coluna e a distancia ate a direita, nao a
           * posicao a partir da esquerda: em "999,00" -> "1.000,00" a casa das
           * unidades precisa continuar sendo a mesma coluna, senao o numero
           * inteiro rola de lado quando ganha uma casa.
           */
          const key = chars.length - index;
          const digit = WHEEL.indexOf(char);

          if (digit < 0) {
            return (
              <span key={key} className={styles.separator}>
                {char}
              </span>
            );
          }

          return (
            <span key={key} className={styles.slot}>
              {/* Define largura e linha de base da coluna; o resto flutua sobre ele. */}
              <span className={styles.ghost}>0</span>
              <span
                className={styles.wheel}
                style={{ '--digit': digit, '--order': Math.min(index, MAX_STAGGER) } as CSSProperties}
              >
                {WHEEL.map((face) => (
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
