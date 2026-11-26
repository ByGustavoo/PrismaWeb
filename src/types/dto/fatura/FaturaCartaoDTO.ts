import type { ID } from '@/types/comum/ID';
import type { SituacaoFatura } from '@/types/enums/SituacaoFatura';

export interface FaturaCartaoDTO {
  id: ID;
  idCartao: ID;
  nomeCartao: string;
  mes: string;
  total: number;
  valorPago: number;
  valorRestante: number;
  situacao: SituacaoFatura;
  dataFechamento: string;
  dataVencimento: string;
  quantidadeItens: number;
  totalAnterior?: number;
}
