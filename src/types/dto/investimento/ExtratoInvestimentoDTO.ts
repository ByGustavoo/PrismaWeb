import type { MovimentacaoInvestimentoDTO } from './MovimentacaoInvestimentoDTO';
import type { PontoEvolucaoDTO } from './PontoEvolucaoDTO';
import type { PosicaoDTO } from './PosicaoDTO';

export interface ExtratoInvestimentoDTO {
  posicao: PosicaoDTO;
  quantidadeAportes: number;
  ultimoAporte: string | null;
  movimentacoes: MovimentacaoInvestimentoDTO[];
  evolucao: PontoEvolucaoDTO[];
}
