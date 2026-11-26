import type { AlocacaoDTO } from './AlocacaoDTO';
import type { PontoEvolucaoDTO } from './PontoEvolucaoDTO';
import type { PosicaoDTO } from './PosicaoDTO';
import type { ReservaEmergenciaDTO } from './ReservaEmergenciaDTO';
import type { VariacaoDTO } from '@/types/dto/dashboard/variacao/VariacaoDTO';

export interface CarteiraDTO {
  aportado: number;
  valorAtual: number;
  rendimento: number;
  rentabilidade: number;
  variacaoValorAtual: VariacaoDTO;
  reserva: ReservaEmergenciaDTO;
  alocacao: AlocacaoDTO[];
  historico: PontoEvolucaoDTO[];
  posicoes: PosicaoDTO[];
}
