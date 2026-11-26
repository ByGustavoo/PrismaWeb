import type { CategoriaDTO } from '@/types/dto/categoria/CategoriaDTO';

export interface GastoCategoriaDTO {
  categoria: CategoriaDTO;
  valor: number;
  participacao: number;
}
