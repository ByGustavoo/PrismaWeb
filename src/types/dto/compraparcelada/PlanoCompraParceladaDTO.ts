import type { CompraParceladaDTO } from './CompraParceladaDTO';
import type { ParcelaDTO } from './ParcelaDTO';

export interface PlanoCompraParceladaDTO {
  compra: CompraParceladaDTO;
  valorParcela: number;
  parcelasPagas: number;
  parcelasRestantes: number;
  valorPago: number;
  valorRestante: number;
  parcelaAtual: ParcelaDTO | null;
  cronograma: ParcelaDTO[];
}
