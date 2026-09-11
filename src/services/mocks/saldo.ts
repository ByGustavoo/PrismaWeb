import type { LancamentoDTO } from '@/types';
import { periodoDaChaveMes, hojeISO } from '@/utils/data';
import { contas, lancamentos } from './dados';

export function idsContasIncluidas(): Set<string> {
  return new Set(
    contas
      .filter((account) => account.situacao === 'ATIVO' && account.incluirNoTotal)
      .map((account) => account.id),
  );
}

export function saldoTotal(): number {
  return contas
    .filter((account) => account.situacao === 'ATIVO' && account.incluirNoTotal)
    .reduce((total, account) => total + account.saldo, 0);
}

export function efeitoNoSaldo(item: LancamentoDTO, included: Set<string>): number {
  if (item.tipo === 'RECEITA') return item.valor;
  if (item.tipo === 'DESPESA') return -item.valor;

  const leaves = included.has(item.idOrigem);
  const enters = item.idContaDestino ? included.has(item.idContaDestino) : false;
  if (leaves === enters) return 0;
  return leaves ? -item.valor : item.valor;
}

export function saldoEm(dateISO: string): number {
  const reference = hojeISO();
  const ahead = dateISO >= reference;
  const from = ahead ? reference : dateISO;
  const to = ahead ? dateISO : reference;
  const included = idsContasIncluidas();

  const net = lancamentos.reduce(
    (sum, item) => (item.data > from && item.data <= to ? sum + efeitoNoSaldo(item, included) : sum),
    0,
  );

  return Math.round((saldoTotal() + (ahead ? net : -net)) * 100) / 100;
}

export function dataFechamentoMes(monthKey: string): string {
  const { to } = periodoDaChaveMes(monthKey);
  const reference = hojeISO();
  return monthKey === reference.slice(0, 7) && to > reference ? reference : to;
}
