import type { ConsumoOrcamentoDTO } from './ConsumoOrcamentoDTO';
import type { GastoCategoriaDTO } from '@/types/dto/dashboard/gasto/categoria/GastoCategoriaDTO';

export interface VisaoGeralOrcamentoDTO {
  mes: string;
  planejado: number;
  gasto: number;
  restante: number;
  consumo: number;
  diasRestantes: number;
  diasDecorridos: number;
  diasNoMes: number;
  itens: ConsumoOrcamentoDTO[];
  foraDoOrcamento: GastoCategoriaDTO[];
}
