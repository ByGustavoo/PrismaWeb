import type { ID } from '@/types/comum/ID';
import type { SituacaoParcela } from '@/types/enums/SituacaoParcela';

export interface ParcelaItemFaturaDTO {
  numero: number;
  total: number;
  idCompra: ID;
  situacao: SituacaoParcela;
  pagamentoAntecipado: boolean;
}
