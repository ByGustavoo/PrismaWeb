import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

/** Ponto do header que uma tela pode ocupar com o proprio controle. */
export const HEADER_SLOT_ID = 'header-slot';

/**
 * Portal para o espaco que o header reserva a tela atual.
 *
 * Existe para as telas que trazem a propria busca. Sem ele, tirar a busca
 * global do header — como Lancamentos faz, por ja ter a sua — deixava um vao no
 * lugar em que todas as outras telas mostram um campo, e a mesma tela repetia
 * uma barra de busca larga logo abaixo. Com o portal, o controle da tela mora
 * onde o usuario ja procura por busca, e o estado continua sendo da tela: o que
 * viaja e o no renderizado, nao o valor.
 *
 * O alvo e lido em efeito, e nao no render, porque o header monta na mesma
 * passagem: na primeira o no ainda nao existe, e o portal so abre na seguinte.
 */
export function HeaderSlot({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setTarget(document.getElementById(HEADER_SLOT_ID));
  }, []);

  return target ? createPortal(children, target) : null;
}
