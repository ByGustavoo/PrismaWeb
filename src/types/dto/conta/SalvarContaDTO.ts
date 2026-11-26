import type { Situacao } from '@/types/enums/Situacao';
import type { TipoConta } from '@/types/enums/TipoConta';

export interface SalvarContaDTO {
  nome: string;
  instituicao: string;
  tipo: TipoConta;
  saldo: number;
  situacao: Situacao;
  incluirNoTotal: boolean;
}
