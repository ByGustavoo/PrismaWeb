import type { Frequencia } from '@/types/enums/Frequencia';
import type { ID } from '@/types/comum/ID';

export interface RecorrenteLancamentoDTO {
  id: ID;
  frequencia: Frequencia;
}
