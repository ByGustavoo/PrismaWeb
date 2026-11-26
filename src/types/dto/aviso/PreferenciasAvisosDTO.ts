import type { TipoAviso } from '@/types/enums/TipoAviso';

export interface PreferenciasAvisosDTO {
  tiposDesligados: TipoAviso[];
  diasAntecedencia: number;
  percentualLimiteCartao: number;
  diasLembreteInvestimento: number;
  diasLembreteMeta: number;
}
