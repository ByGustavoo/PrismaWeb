import type { ClasseAtivo } from '@/types/enums/ClasseAtivo';
import type { ID } from '@/types/comum/ID';

export interface InvestimentoDTO {
  id: ID;
  nome: string;
  codigo?: string;
  classeAtivo: ClasseAtivo;
  instituicao: string;
  reservaEmergencia: boolean;
  aportado: number;
  valorAtual: number;
  quantidade?: number;
  precoMedio?: number;
  cotacao?: number;
  dataInicio: string;
  dataAtualizacao: string;
  observacoes?: string;
}
