import type { ClasseAtivo } from '@/types/enums/ClasseAtivo';

export interface AlocacaoDTO {
  classeAtivo: ClasseAtivo;
  aportado: number;
  valorAtual: number;
  rendimento: number;
  participacao: number;
  quantidade: number;
}
