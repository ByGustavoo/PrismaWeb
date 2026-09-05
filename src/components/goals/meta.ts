import type { AmountTone } from '@/components/common';
import type { BadgeTone } from '@/components/ui';
import type { GoalInsight, Trend } from '@/types';

/**
 * Aqui a cor nao segue a direcao do numero, e sim a noticia para quem pretende
 * comprar: preco que cai e a boa noticia, preco que sobe e a ma.
 *
 * E deliberadamente diferente do `DeltaIndicator`, onde subir e sempre verde —
 * e por isso este par nunca aparece como uma seta solta. O indicador escreve
 * "Baixou" ou "Subiu" ao lado da seta, de modo que simbolo, palavra e cor
 * digam a mesma coisa: nao existe seta para baixo em verde sem a palavra que a
 * explica.
 */
export function priceTone(trend: Trend): AmountTone {
  if (trend === 'BAIXA') return 'positive';
  if (trend === 'ALTA') return 'negative';
  return 'muted';
}

/** Verbo da variacao, no passado: e o que ja aconteceu com o preco. */
export const priceTrendLabel: Record<Trend, string> = {
  BAIXA: 'Baixou',
  ALTA: 'Subiu',
  ESTAVEL: 'Estável',
};

/**
 * Tom da leitura do momento. So os dois extremos ganham cor: um "abaixo da
 * media" pintado de verde daria a cada consulta o peso de uma decisao.
 */
export const insightTone: Record<GoalInsight, BadgeTone> = {
  PRIMEIRO: 'neutral',
  MENOR: 'positive',
  ABAIXO_DA_MEDIA: 'neutral',
  ACIMA_DA_MEDIA: 'neutral',
  MAIOR: 'warning',
  ESTAVEL: 'neutral',
};
