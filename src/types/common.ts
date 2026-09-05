/** Tipos genericos compartilhados entre dominios. */

export type ID = string;

export interface Option<T extends string = string> {
  value: T;
  label: string;
}

export type Trend = 'ALTA' | 'BAIXA' | 'ESTAVEL';

export interface Delta {
  /** Variacao percentual em relacao ao periodo anterior. */
  percentage: number;
  trend: Trend;
}
