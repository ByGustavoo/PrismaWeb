import type { Frequencia } from '@/types/enums/Frequencia';
import type { ID } from '@/types/comum/ID';
import type { SituacaoRecorrente } from '@/types/enums/SituacaoRecorrente';
import type { TipoRecorrente } from '@/types/enums/TipoRecorrente';

export interface SalvarRecorrenteDTO {
  tipo: TipoRecorrente;
  descricao: string;
  valor: number;
  idCategoria?: ID;
  frequencia: Frequencia;
  proximoVencimento: string;
  idOrigem: ID;
  situacao: SituacaoRecorrente;
  lancarAutomaticamente: boolean;
  observacoes?: string;
}
