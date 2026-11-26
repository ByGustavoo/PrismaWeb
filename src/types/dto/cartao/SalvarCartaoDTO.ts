import type { ID } from '@/types/comum/ID';
import type { Situacao } from '@/types/enums/Situacao';
import type { TipoCartao } from '@/types/enums/TipoCartao';

export interface SalvarCartaoDTO {
  nome: string;
  instituicao: string;
  tipo: TipoCartao;
  situacao: Situacao;
  bandeira?: string;
  ultimosDigitos?: string;
  limiteCredito?: number;
  diaFechamento?: number;
  diaVencimento?: number;
  idConta?: ID;
  saldo?: number;
}
