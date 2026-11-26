import type { ID } from '@/types/comum/ID';

export interface SalvarAcaoDTO {
  codigo: string;
  nome: string;
  instituicao: string;
  quantidade: number;
  precoUnitario: number;
  taxas?: number;
  cotacao?: number;
  dataInicio: string;
  reservaEmergencia: boolean;
  idConta?: ID;
  observacoes?: string;
}
