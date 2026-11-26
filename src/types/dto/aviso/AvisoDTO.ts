import type { EstadoAviso } from '@/types/enums/EstadoAviso';
import type { ID } from '@/types/comum/ID';
import type { SeveridadeAviso } from '@/types/enums/SeveridadeAviso';
import type { TipoAviso } from '@/types/enums/TipoAviso';

export interface AvisoDTO {
  id: ID;
  tipo: TipoAviso;
  severidade: SeveridadeAviso;
  titulo: string;
  descricao: string;
  data: string;
  valor?: number;
  rota?: string;
  estado: EstadoAviso;
  adiadoAte?: string;
}
