import type { ID } from '@/types/comum/ID';

export interface SalvarResgateInvestimentoDTO {
  valor: number;
  data: string;
  idConta?: ID;
  descricao?: string;
}
