import type { ClasseAtivo } from '@/types/enums/ClasseAtivo';

export interface AtualizarInvestimentoDTO {
  nome: string;
  codigo?: string;
  classeAtivo: ClasseAtivo;
  instituicao: string;
  reservaEmergencia: boolean;
  quantidade?: number;
  observacoes?: string;
}
