/** Tipos genericos compartilhados entre dominios. */

export type ID = string;

export interface Option<T extends string = string> {
  value: T;
  label: string;
}

export type Tendencia = 'ALTA' | 'BAIXA' | 'ESTAVEL';

/**
 * Variacao percentual contra o periodo anterior. Sem base de comparacao nao ha
 * variacao: `percentual` vem zero e `tendencia` vem ESTAVEL, em vez de uma
 * divisao por zero ou de um 100% inventado.
 */
export interface Variacao {
  percentual: number;
  tendencia: Tendencia;
}
