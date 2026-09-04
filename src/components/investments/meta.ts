import type { AmountTone } from '@/components/common';
import { investmentClassColor } from '@/constants/investments';
import type { InvestmentClass } from '@/types';

/**
 * Cor da classe como valor de CSS. Existe para que rosca, legenda e lista de
 * posicoes leiam a mesma fonte: uma classe que muda de cor entre dois blocos da
 * mesma tela deixa de ser reconhecivel.
 */
export function classColor(assetClass: InvestmentClass): string {
  return `var(--chart-${investmentClassColor[assetClass]})`;
}

/**
 * Ganho e verde, perda e vermelha e o zero fica neutro. Aqui a cor pode seguir
 * o sinal sem ambiguidade: em investimento, subir e sempre a boa noticia.
 */
export function profitTone(profit: number): AmountTone {
  if (profit > 0) return 'positive';
  if (profit < 0) return 'negative';
  return 'muted';
}
