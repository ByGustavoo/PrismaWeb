import type { FinalidadeConta, Situacao, TipoConta } from '@/types';

export const rotuloTipoConta: Record<TipoConta, string> = {
  CORRENTE: 'Conta corrente',
  SALARIO: 'Conta salário',
  EMERGENCIA: 'Reserva de emergência',
  POUPANCA: 'Poupança',
  PREVIDENCIA: 'Previdência',
  OUTRA: 'Outros',
};

export const tiposConta: TipoConta[] = ['CORRENTE', 'SALARIO', 'EMERGENCIA', 'POUPANCA', 'PREVIDENCIA', 'OUTRA'];

export const finalidadeTipoConta: Record<TipoConta, FinalidadeConta> = {
  CORRENTE: 'MOVIMENTACAO',
  SALARIO: 'MOVIMENTACAO',
  OUTRA: 'MOVIMENTACAO',
  EMERGENCIA: 'RESERVA',
  POUPANCA: 'RESERVA',
  PREVIDENCIA: 'RESERVA',
};

export function ehContaReserva(tipo: TipoConta): boolean {
  return finalidadeTipoConta[tipo] === 'RESERVA';
}

export const rotuloSituacaoConta: Record<Situacao, string> = {
  ATIVO: 'Ativa',
  INATIVO: 'Inativa',
};

export const situacoesConta: Situacao[] = ['ATIVO', 'INATIVO'];

export const MESES_EVOLUCAO_CONTA = 12;
