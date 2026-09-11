export type ID = string;

export interface Opcao<T extends string = string> {
  valor: T;
  rotulo: string;
}

export type Tendencia = 'ALTA' | 'BAIXA' | 'ESTAVEL';

export interface VariacaoDTO {
  percentual: number;
  tendencia: Tendencia;
}

export interface ErrorResponseDTO {
  status: number;
  title: string;
  instance: string;
  type: string;
  detail: string;
  errors?: unknown;
  timestamp: string;
}
