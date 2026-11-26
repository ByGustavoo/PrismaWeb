import type { GrupoOrigem } from '@/types/enums/GrupoOrigem';
import type { ID } from '@/types/comum/ID';

export interface GastoOrigemDTO {
  id: ID;
  nome: string;
  grupo: GrupoOrigem;
  valor: number;
  participacao: number;
}
