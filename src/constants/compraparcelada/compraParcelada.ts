import type { SituacaoParcela } from '@/types';

export const rotuloSituacaoParcela: Record<SituacaoParcela, string> = {
  PAGA: 'Paga',
  ATUAL: 'Atual',
  FUTURA: 'A vencer',
};

export const quantidadesParcelas: number[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 18, 24,
];

export function rotuloQuantidadeParcelas(count: number): string {
  return count === 1 ? 'À vista (1x)' : `${count}x`;
}

export function ehCompraAVista(parcelas: number): boolean {
  return parcelas === 1;
}
