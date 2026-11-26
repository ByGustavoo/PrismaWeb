import type { FluxoDTO } from '@/types/dto/dashboard/fluxo/FluxoDTO';
import type { GastoCategoriaDTO } from '@/types/dto/dashboard/gasto/categoria/GastoCategoriaDTO';
import type { GastoOrigemDTO } from './GastoOrigemDTO';
import type { PatrimonioDTO } from './PatrimonioDTO';
import type { SaldoDTO } from '@/types/dto/dashboard/saldo/SaldoDTO';
import type { VariacaoDTO } from '@/types/dto/dashboard/variacao/VariacaoDTO';

export interface RelatorioDTO {
  dataInicial: string;
  dataFinal: string;
  receitas: number;
  despesas: number;
  resultado: number;
  variacaoReceitas: VariacaoDTO;
  variacaoDespesas: VariacaoDTO;
  quantidadeLancamentos: number;
  despesasPorCategoria: GastoCategoriaDTO[];
  receitasPorCategoria: GastoCategoriaDTO[];
  fluxoCaixa: FluxoDTO[];
  despesasPorOrigem: GastoOrigemDTO[];
  historicoSaldo: SaldoDTO[];
  patrimonio: PatrimonioDTO[];
}
