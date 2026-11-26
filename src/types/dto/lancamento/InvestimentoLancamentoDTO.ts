import type { ID } from '@/types/comum/ID';
import type { TipoMovimentacaoInvestimento } from '@/types/enums/TipoMovimentacaoInvestimento';

export interface InvestimentoLancamentoDTO {
  idInvestimento: ID;
  tipo: TipoMovimentacaoInvestimento;
}
