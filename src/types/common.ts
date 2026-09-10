export type ID = string;

export interface Option<T extends string = string> {
  value: T;
  label: string;
}

export type Tendencia = 'ALTA' | 'BAIXA' | 'ESTAVEL';

export interface Variacao {
  percentual: number;
  tendencia: Tendencia;
}
