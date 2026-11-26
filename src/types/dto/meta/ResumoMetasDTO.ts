import type { AcompanhamentoMetaDTO } from './AcompanhamentoMetaDTO';

export interface ResumoMetasDTO {
  itens: AcompanhamentoMetaDTO[];
  quantidadeAcompanhando: number;
  quantidadeCompradas: number;
  totalAtual: number;
  totalInicial: number;
  variacaoTotal: number;
  economiaTotal: number;
}
