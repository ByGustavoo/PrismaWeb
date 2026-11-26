import type { ID } from '@/types/comum/ID';
import type { TipoCategoria } from '@/types/enums/TipoCategoria';
import type { TokenCor } from '@/types/comum/TokenCor';

export interface CategoriaDTO {
  id: ID;
  nome: string;
  tipo: TipoCategoria;
  tokenCor: TokenCor;
}
