import type { SituacaoMeta } from '@/types/enums/SituacaoMeta';

export interface AtualizarMetaDTO {
  nome: string;
  url?: string;
  urlImagem?: string;
  situacao: SituacaoMeta;
  observacoes?: string;
}
