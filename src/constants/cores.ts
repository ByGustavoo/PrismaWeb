import type { TokenCor } from '@/types';

export function corDaPaleta(token: TokenCor): string {
  return `var(--palette-${token})`;
}

export const TOKENS_PALETA: TokenCor[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
