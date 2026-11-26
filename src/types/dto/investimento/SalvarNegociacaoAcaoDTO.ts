import type { ID } from '@/types/comum/ID';

export interface SalvarNegociacaoAcaoDTO {
  quantidade: number;
  precoUnitario: number;
  taxas?: number;
  data: string;
  idConta?: ID;
  descricao?: string;
}
