import type { ID } from '@/types/comum/ID';
import type { TipoMovimentacaoInvestimento } from '@/types/enums/TipoMovimentacaoInvestimento';

export interface MovimentacaoInvestimentoDTO {
  id: ID;
  tipo: TipoMovimentacaoInvestimento;
  data: string;
  valor: number;
  saldoApos: number;
  aportadoApos: number;
  quantidadeApos?: number;
  quantidade?: number;
  precoUnitario?: number;
  taxas?: number;
  idConta?: ID;
  nomeConta?: string;
  descricao?: string;
}
