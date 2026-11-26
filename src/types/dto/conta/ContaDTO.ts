import type { ID } from '@/types/comum/ID';
import type { Situacao } from '@/types/enums/Situacao';
import type { TipoConta } from '@/types/enums/TipoConta';

export interface ContaDTO {
  id: ID;
  nome: string;
  instituicao: string;
  tipo: TipoConta;
  saldo: number;
  situacao: Situacao;
  incluirNoTotal: boolean;
}
