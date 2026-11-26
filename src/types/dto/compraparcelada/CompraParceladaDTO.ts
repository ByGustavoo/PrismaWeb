import type { CategoriaDTO } from '@/types/dto/categoria/CategoriaDTO';
import type { ID } from '@/types/comum/ID';

export interface CompraParceladaDTO {
  id: ID;
  descricao: string;
  valorTotal: number;
  parcelas: number;
  dataCompra: string;
  primeiroMes: string;
  idCartao: ID;
  nomeCartao: string;
  categoria: CategoriaDTO | null;
  observacoes?: string;
}
