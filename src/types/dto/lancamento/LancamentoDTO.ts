import type { CategoriaDTO } from '@/types/dto/categoria/CategoriaDTO';
import type { FormaLancamento } from '@/types/enums/FormaLancamento';
import type { ID } from '@/types/comum/ID';
import type { InvestimentoLancamentoDTO } from './InvestimentoLancamentoDTO';
import type { ParcelaLancamentoDTO } from './ParcelaLancamentoDTO';
import type { RecorrenteLancamentoDTO } from './RecorrenteLancamentoDTO';
import type { SituacaoLancamento } from '@/types/enums/SituacaoLancamento';
import type { TipoLancamento } from '@/types/enums/TipoLancamento';

export interface LancamentoDTO {
  id: ID;
  descricao: string;
  valor: number;
  tipo: TipoLancamento;
  situacao: SituacaoLancamento;
  forma: FormaLancamento;
  data: string;
  categoria: CategoriaDTO | null;
  idOrigem: ID;
  nomeOrigem: string;
  idContaDestino?: ID;
  nomeContaDestino?: string;
  parcela?: ParcelaLancamentoDTO;
  investimento?: InvestimentoLancamentoDTO;
  recorrente?: RecorrenteLancamentoDTO;
  observacoes?: string;
}
