import type { FormaLancamento } from '@/types/enums/FormaLancamento';
import type { Frequencia } from '@/types/enums/Frequencia';
import type { ID } from '@/types/comum/ID';
import type { SituacaoLancamento } from '@/types/enums/SituacaoLancamento';
import type { TipoLancamento } from '@/types/enums/TipoLancamento';

export interface SalvarLancamentoDTO {
  descricao: string;
  valor: number;
  tipo: TipoLancamento;
  situacao: SituacaoLancamento;
  forma: FormaLancamento;
  data: string;
  idCategoria?: ID;
  idOrigem: ID;
  idContaDestino?: ID;
  repeticao?: Frequencia;
  observacoes?: string;
}
