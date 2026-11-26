import type { CategoriaDTO } from '@/types/dto/categoria/CategoriaDTO';
import type { ID } from '@/types/comum/ID';
import type { ParcelaItemFaturaDTO } from './ParcelaItemFaturaDTO';

export interface ItemFaturaDTO {
  id: ID;
  descricao: string;
  data: string;
  valor: number;
  categoria: CategoriaDTO | null;
  parcela?: ParcelaItemFaturaDTO;
  idRecorrente?: ID;
  paga: boolean;
}
