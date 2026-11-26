import type { FaturaDTO } from '@/types/dto/dashboard/fatura/FaturaDTO';
import type { FluxoDTO } from '@/types/dto/dashboard/fluxo/FluxoDTO';
import type { GastoCategoriaDTO } from '@/types/dto/dashboard/gasto/categoria/GastoCategoriaDTO';
import type { GastoDiarioDTO } from '@/types/dto/dashboard/gasto/diario/GastoDiarioDTO';
import type { LancamentoDTO } from '@/types/dto/lancamento/LancamentoDTO';
import type { SaldoDTO } from '@/types/dto/dashboard/saldo/SaldoDTO';
import type { VariacaoDTO } from '@/types/dto/dashboard/variacao/VariacaoDTO';

export interface DashboardDTO {
  dataInicial: string;
  dataFinal: string;
  saldoAtual: number;
  variacaoSaldo: VariacaoDTO;
  receitasMes: number;
  variacaoReceitas: VariacaoDTO;
  despesasMes: number;
  variacaoDespesas: VariacaoDTO;
  totalInvestido: number;
  variacaoInvestimentos: VariacaoDTO;
  patrimonio: number;
  variacaoPatrimonio: VariacaoDTO;
  faturaAtual: FaturaDTO | null;
  historicoSaldo: SaldoDTO[];
  fluxoCaixa: FluxoDTO[];
  gastoDiario: GastoDiarioDTO[];
  gastoPorCategoria: GastoCategoriaDTO[];
  lancamentosRecentes: LancamentoDTO[];
}
