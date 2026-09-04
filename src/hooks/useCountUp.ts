import { useEffect, useRef, useState } from 'react';

/**
 * Duracao da contagem. Abaixo disso o efeito mal se percebe; acima, o numero
 * passa a parecer que ainda esta carregando — e um saldo que demora a assentar
 * e exatamente a impressao que um app de financas nao pode dar.
 */
const DURATION = 900;

/**
 * Espelha em JS a curva do token `--ease-out` (cubic-bezier(0.22, 1, 0.36, 1)):
 * sai rapido e assenta devagar. E a mesma curva do resto do movimento do app —
 * a contagem nao pode ter uma fisica propria.
 */
function easeOut(progress: number): number {
  return 1 - (1 - progress) ** 5;
}

/**
 * Lido uma vez, sem assinar mudancas. A contagem roda no mount e nao se repete,
 * entao um listener por valor so custaria memoria: o `Amount` aparece dezenas
 * de vezes numa listagem de lancamentos.
 */
function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export interface CountUp {
  /** Valor a exibir neste quadro. */
  value: number;
  /** Verdadeiro enquanto a contagem esta em curso. */
  running: boolean;
}

/**
 * Conta de zero ate `target` na primeira vez que o numero aparece.
 *
 * E uma animacao **de entrada**: acontece uma vez e nao volta a acontecer. Um
 * valor que muda depois — trocar o periodo no dashboard, por exemplo — passa
 * direto, senao cada clique na seta jogaria os quatro cartoes de volta ao zero,
 * o que se leria como recarga e nao como atualizacao.
 *
 * O estado vive aqui, no componente que desenha o numero, e nao na pagina: assim
 * cada quadro redesenha um `Amount`, e nao o dashboard inteiro.
 */
export function useCountUp(target: number, enabled: boolean): CountUp {
  const [shouldRun] = useState(() => enabled && !prefersReducedMotion());
  const [value, setValue] = useState(() => (shouldRun ? 0 : target));
  const [running, setRunning] = useState(shouldRun);
  const done = useRef(!shouldRun);

  useEffect(() => {
    // Depois que a contagem termina, o valor novo entra sem contar de novo.
    if (done.current) {
      setValue(target);
      return;
    }

    let frame = 0;
    const start = performance.now();

    const step = (now: number) => {
      /*
       * O piso em zero nao e simetria com o teto: `requestAnimationFrame`
       * entrega o instante em que o quadro comecou, que pode ser anterior ao
       * `performance.now()` lido aqui no efeito. Sem o piso, o primeiro quadro
       * roda com progresso negativo, `easeOut` devolve um numero negativo e o
       * valor aparece com sinal de menos — um saldo positivo piscando como
       * divida.
       */
      const progress = Math.min(Math.max((now - start) / DURATION, 0), 1);

      if (progress < 1) {
        // Vale para negativo sem nenhum caso especial: a interpolacao vai de
        // zero ate o alvo, e quem cuida do sinal e a formatacao.
        setValue(target * easeOut(progress));
        frame = requestAnimationFrame(step);
        return;
      }

      /*
       * A trava so fecha aqui, na chegada, e nao na partida. Em desenvolvimento
       * o StrictMode monta, desmonta e monta de novo: uma trava fechada na
       * partida faria a segunda montagem encontrar a contagem "ja feita" e
       * pular direto para o valor final — o efeito simplesmente nao existiria
       * em dev, e so apareceria no build.
       *
       * O ultimo quadro e o alvo exato, nunca o resultado da interpolacao: e o
       * que garante os centavos certos no fim.
       */
      done.current = true;
      setValue(target);
      setRunning(false);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return { value, running };
}
