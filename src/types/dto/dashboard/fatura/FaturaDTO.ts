import type { SituacaoFatura } from '@/types/enums/SituacaoFatura';

export interface FaturaDTO {
  total: number;
  valorRestante: number;
  nomeCartao: string;
  mes: string;
  dataVencimento: string;
  situacao: SituacaoFatura;
}
