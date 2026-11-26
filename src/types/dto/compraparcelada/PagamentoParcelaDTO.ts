import type { ID } from '@/types/comum/ID';

export interface PagamentoParcelaDTO {
  idCompra: ID;
  numero: number;
  dataPagamento: string;
}
