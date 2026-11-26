import type { GrupoOrigem } from '@/types/enums/GrupoOrigem';
import type { ID } from '@/types/comum/ID';
import type { TipoCartao } from '@/types/enums/TipoCartao';

export interface OrigemDTO {
  id: ID;
  nome: string;
  grupo: GrupoOrigem;
  tipoCartao?: TipoCartao;
}
