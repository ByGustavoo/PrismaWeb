import type { ID } from '@/types/comum/ID';
import type { DirecaoOrdenacao } from '@/types/enums/DirecaoOrdenacao';
import type { OrdenacaoLancamento } from '@/types/enums/OrdenacaoLancamento';
import type { SituacaoLancamento } from '@/types/enums/SituacaoLancamento';
import type { TipoLancamento } from '@/types/enums/TipoLancamento';

export interface FiltroLancamentoDTO {
  tipo?: TipoLancamento;
  busca?: string;
  dataInicial?: string;
  dataFinal?: string;
  idCategoria?: ID;
  idOrigem?: ID;
  situacao?: SituacaoLancamento;
  pagina?: number;
  tamanho?: number;
  ordenacao?: OrdenacaoLancamento;
  direcao?: DirecaoOrdenacao;
}
