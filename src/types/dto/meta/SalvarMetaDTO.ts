import type { SituacaoMeta } from '@/types/enums/SituacaoMeta';

export interface SalvarMetaDTO {
  nome: string;
  url?: string;
  urlImagem?: string;
  preco: number;
  data: string;
  situacao: SituacaoMeta;
  observacoes?: string;
}
