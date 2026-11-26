import type { ID } from '@/types/comum/ID';

export interface MetaPrecoDTO {
  id: ID;
  data: string;
  preco: number;
  observacao?: string;
}
