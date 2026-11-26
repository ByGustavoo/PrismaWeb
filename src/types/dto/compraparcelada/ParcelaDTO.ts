import type { SituacaoParcela } from '@/types/enums/SituacaoParcela';

export interface ParcelaDTO {
  numero: number;
  mes: string;
  dataVencimento: string;
  valor: number;
  situacao: SituacaoParcela;
  pagamentoAntecipado: boolean;
}
