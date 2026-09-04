import type { BadgeTone, ProgressTone } from '@/components/ui';
import type { BudgetStatus } from '@/types';

/**
 * Faixas de consumo do orcamento. Sao os mesmos numeros que decidem a cor da
 * barra, o tom do badge e o texto do alerta: separados, a barra ficaria ambar
 * sem que nenhum aviso correspondente aparecesse ao lado dela.
 *
 * A faixa de atencao comeca em 80% porque e o ponto em que ainda da para
 * mudar de ideia — avisar em 95% e avisar quando o mes ja acabou.
 */
export const BUDGET_WARNING_RATIO = 0.8;
export const BUDGET_EXCEEDED_RATIO = 1;

/**
 * Dias vividos antes de a projecao de ritmo valer alguma coisa. Extrapolar
 * linearmente o dia 4 multiplica por sete um aluguel que acontece uma vez no
 * mes, e o resultado — "no ritmo atual, R$ 21.700 de moradia" — nao e um aviso,
 * e um erro de leitura. Ate o dia 10 a tela prefere nao projetar nada.
 */
export const BUDGET_PROJECTION_MIN_DAYS = 10;

export function budgetStatusOf(ratio: number): BudgetStatus {
  if (ratio >= BUDGET_EXCEEDED_RATIO) return 'exceeded';
  if (ratio >= BUDGET_WARNING_RATIO) return 'warning';
  return 'safe';
}

export const budgetStatusLabel: Record<BudgetStatus, string> = {
  safe: 'Dentro do limite',
  warning: 'Perto do limite',
  exceeded: 'Limite estourado',
};

export const budgetStatusTone: Record<BudgetStatus, BadgeTone> = {
  safe: 'positive',
  warning: 'warning',
  exceeded: 'negative',
};

export const budgetProgressTone: Record<BudgetStatus, ProgressTone> = {
  safe: 'accent',
  warning: 'warning',
  exceeded: 'negative',
};
