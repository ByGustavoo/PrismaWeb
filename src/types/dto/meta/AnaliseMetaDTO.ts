import type { LeituraMeta } from '@/types/enums/LeituraMeta';
import type { Tendencia } from '@/types/enums/Tendencia';

export interface AnaliseMetaDTO {
  precoInicial: number;
  precoAtual: number;
  menorPreco: number;
  maiorPreco: number;
  precoMedio: number;
  variacao: number;
  variacaoPercentual: number;
  tendencia: Tendencia;
  economia: number;
  ultimaAtualizacao: string;
  quantidadeRegistros: number;
  leitura: LeituraMeta;
}
