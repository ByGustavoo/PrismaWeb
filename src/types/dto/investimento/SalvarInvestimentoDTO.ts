import type { ClasseAtivo } from '@/types/enums/ClasseAtivo';
import type { ID } from '@/types/comum/ID';

export interface SalvarInvestimentoDTO {
  nome: string;
  classeAtivo: ClasseAtivo;
  instituicao: string;
  aportado: number;
  valorAtual: number;
  dataInicio: string;
  reservaEmergencia: boolean;
  idConta?: ID;
  observacoes?: string;
}
