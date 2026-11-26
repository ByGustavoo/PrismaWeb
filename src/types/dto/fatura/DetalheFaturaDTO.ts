import type { FaturaCartaoDTO } from './FaturaCartaoDTO';
import type { ItemFaturaDTO } from './ItemFaturaDTO';

export interface DetalheFaturaDTO extends FaturaCartaoDTO {
  itens: ItemFaturaDTO[];
}
