import type { SituacaoMeta } from '@/types/enums/SituacaoMeta';

export interface FiltroMeta {
  situacao?: SituacaoMeta;
  busca?: string;
}
