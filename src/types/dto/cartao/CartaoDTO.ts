import type { ID } from '@/types/comum/ID';
import type { Situacao } from '@/types/enums/Situacao';
import type { TipoCartao } from '@/types/enums/TipoCartao';

export interface CartaoDTO {
  id: ID;
  nome: string;
  instituicao: string;
  tipo: TipoCartao;
  situacao: Situacao;
  bandeira?: string;
  ultimosDigitos?: string;
  limiteCredito?: number;
  limiteComprometido?: number;
  diaFechamento?: number;
  diaVencimento?: number;
  idConta?: ID;
  nomeConta?: string;
  saldo?: number;
}
