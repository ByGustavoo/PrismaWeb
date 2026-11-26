import type { CategoriaDTO } from '@/types/dto/categoria/CategoriaDTO';
import type { Frequencia } from '@/types/enums/Frequencia';
import type { ID } from '@/types/comum/ID';
import type { SituacaoRecorrente } from '@/types/enums/SituacaoRecorrente';
import type { TipoRecorrente } from '@/types/enums/TipoRecorrente';

export interface RecorrenteDTO {
  id: ID;
  tipo: TipoRecorrente;
  descricao: string;
  valor: number;
  categoria: CategoriaDTO | null;
  frequencia: Frequencia;
  proximoVencimento: string;
  idOrigem: ID;
  nomeOrigem: string;
  situacao: SituacaoRecorrente;
  lancarAutomaticamente: boolean;
  observacoes?: string;
}
