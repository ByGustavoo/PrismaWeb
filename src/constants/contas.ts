import type { Situacao, TipoConta } from '@/types';

export const rotuloTipoConta: Record<TipoConta, string> = {
  CORRENTE: 'Conta corrente',
  SALARIO: 'Conta salário',
  EMERGENCIA: 'Reserva de emergência',
  OUTRA: 'Outros',
};

export const tiposConta: TipoConta[] = ['CORRENTE', 'SALARIO', 'EMERGENCIA', 'OUTRA'];

export const rotuloSituacaoConta: Record<Situacao, string> = {
  ATIVO: 'Ativa',
  INATIVO: 'Inativa',
};

export const situacoesConta: Situacao[] = ['ATIVO', 'INATIVO'];
