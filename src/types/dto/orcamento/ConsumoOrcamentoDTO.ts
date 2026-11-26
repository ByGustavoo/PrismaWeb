import type { OrcamentoDTO } from './OrcamentoDTO';
import type { SituacaoOrcamento } from '@/types/enums/SituacaoOrcamento';

export interface ConsumoOrcamentoDTO {
  orcamento: OrcamentoDTO;
  gasto: number;
  restante: number;
  consumo: number;
  projecao: number;
  situacao: SituacaoOrcamento;
}
