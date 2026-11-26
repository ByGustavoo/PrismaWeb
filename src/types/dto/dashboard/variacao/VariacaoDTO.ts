import type { Tendencia } from '@/types/enums/Tendencia';

export interface VariacaoDTO {
  percentual?: number;
  diferenca: number;
  tendencia: Tendencia;
}
