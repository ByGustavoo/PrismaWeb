import type { CategoriaDTO } from '@/types/dto/categoria/CategoriaDTO';
import type { ID } from '@/types/comum/ID';

export interface OrcamentoDTO {
  id: ID;
  categoria: CategoriaDTO;
  limiteMensal: number;
}
