import type { ID } from '@/types/comum/ID';
import type { MetaPrecoDTO } from '@/types/dto/metapreco/MetaPrecoDTO';
import type { SituacaoMeta } from '@/types/enums/SituacaoMeta';

export interface MetaDTO {
  id: ID;
  nome: string;
  url?: string;
  urlImagem?: string;
  situacao: SituacaoMeta;
  observacoes?: string;
  dataCriacao: string;
  historico: MetaPrecoDTO[];
}
