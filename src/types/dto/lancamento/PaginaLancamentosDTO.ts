import type { LancamentoDTO } from './LancamentoDTO';

export interface PaginaLancamentosDTO {
  itens: LancamentoDTO[];
  pagina: number;
  tamanho: number;
  quantidadeTotal: number;
  quantidadePaginas: number;
  resultado: number;
}
