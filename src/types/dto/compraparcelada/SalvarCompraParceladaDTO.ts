import type { ID } from '@/types/comum/ID';

export interface SalvarCompraParceladaDTO {
  descricao: string;
  valorTotal: number;
  parcelas: number;
  dataCompra: string;
  primeiroMes: string;
  idCartao: ID;
  idCategoria?: ID;
  observacoes?: string;
}
