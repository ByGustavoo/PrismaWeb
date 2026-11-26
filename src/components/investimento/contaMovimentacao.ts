import type { ContaDTO, Opcao } from '@/types';

export const OPCAO_SEM_CONTA = '';

export function opcoesContaMovimentacao(contas: ContaDTO[], rotuloSemConta: string): Opcao[] {
  return [
    { valor: OPCAO_SEM_CONTA, rotulo: rotuloSemConta },
    ...contas
      .filter((account) => account.situacao === 'ATIVO')
      .map((account) => ({ valor: account.id, rotulo: `${account.nome} — ${account.instituicao}` })),
  ];
}
