import type { ID } from '@/types/comum/ID';

export interface FiltroFaturaDTO {
  idCartao?: ID;
  dataInicial?: string;
  dataFinal?: string;
}
