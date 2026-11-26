import type { RecorrenteDTO } from './RecorrenteDTO';

export interface ResumoRecorrentesDTO {
  itens: RecorrenteDTO[];
  custoMensal: number;
  custoAnual: number;
  receitaMensal: number;
  vencendoEmBreve: RecorrenteDTO[];
}
