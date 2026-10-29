import type { Situacao, TipoConta } from '@/types';

export const rotuloTipoConta: Record<TipoConta, string> = {
  CORRENTE: 'Conta corrente',
  SALARIO: 'Conta salário',
  OUTRA: 'Outros',
};

export const tiposConta: TipoConta[] = ['CORRENTE', 'SALARIO', 'OUTRA'];

export const rotuloSituacaoConta: Record<Situacao, string> = {
  ATIVO: 'Ativa',
  INATIVO: 'Inativa',
};

export const situacoesConta: Situacao[] = ['ATIVO', 'INATIVO'];

