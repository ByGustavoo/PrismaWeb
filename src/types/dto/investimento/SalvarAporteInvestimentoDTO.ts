import type { ID } from '@/types/comum/ID';

export interface SalvarAporteInvestimentoDTO {
  valor: number;
  data: string;
  idConta?: ID;
  descricao?: string;
}
