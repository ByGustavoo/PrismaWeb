/** Tipos genericos compartilhados entre dominios. */

export type ID = string;

export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface Option<T extends string = string> {
  value: T;
  label: string;
}

export type Trend = 'up' | 'down' | 'flat';

export interface Delta {
  /** Variacao percentual em relacao ao periodo anterior. */
  percentage: number;
  trend: Trend;
}
