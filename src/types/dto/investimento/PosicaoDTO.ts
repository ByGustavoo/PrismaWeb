import type { InvestimentoDTO } from './InvestimentoDTO';

export interface PosicaoDTO {
  investimento: InvestimentoDTO;
  rendimento: number;
  rentabilidade: number;
  participacao: number;
}
