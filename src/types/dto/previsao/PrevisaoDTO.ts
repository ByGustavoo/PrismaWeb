import type { BaseCalculoPrevisaoDTO } from './BaseCalculoPrevisaoDTO';
import type { MenorSaldoDTO } from './MenorSaldoDTO';
import type { MesPrevisaoDTO } from './MesPrevisaoDTO';

export interface PrevisaoDTO {
  saldoAtual: number;
  restanteMesAtual: MesPrevisaoDTO;
  saldoInicial: number;
  meses: MesPrevisaoDTO[];
  saldoFinal: number;
  resultadoMedio: number;
  menorSaldo: MenorSaldoDTO;
  base: BaseCalculoPrevisaoDTO;
}
