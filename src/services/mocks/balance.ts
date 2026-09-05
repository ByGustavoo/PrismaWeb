import type { Transaction } from '@/types';
import { monthKeyRange, todayISO } from '@/utils/date';
import { accounts, transactions } from './data';

/**
 * Reconstrucao do saldo em uma data. Vive num modulo proprio porque tres telas
 * precisam da mesma conta — o dashboard, a previsao e os relatorios — e um saldo
 * calculado de dois jeitos diferentes e um bug esperando a hora de aparecer.
 */

/**
 * Contas que compoem o patrimonio visivel. Sao funcoes, e nao constantes de
 * modulo, porque o cadastro de contas muda em tempo de execucao: uma conta
 * criada agora precisa entrar no saldo sem recarregar a pagina.
 */
export function includedAccountIds(): Set<string> {
  return new Set(
    accounts
      .filter((account) => account.status === 'ATIVO' && account.includeInTotal)
      .map((account) => account.id),
  );
}

export function totalBalance(): number {
  return accounts
    .filter((account) => account.status === 'ATIVO' && account.includeInTotal)
    .reduce((total, account) => total + account.balance, 0);
}

/**
 * Efeito de um lancamento no saldo somado das contas que entram no total.
 * Receita e despesa entram inteiras — o mock nao tem pagamento de fatura, entao
 * tratar a despesa de cartao como neutra faria o dinheiro gasto sumir. Ja a
 * transferencia so conta quando cruza a fronteira do total: o aporte na
 * corretora, que fica de fora, reduz o saldo visivel, enquanto uma transferencia
 * entre duas contas do total nao muda nada.
 */
export function balanceEffect(item: Transaction, included: Set<string>): number {
  if (item.kind === 'RECEITA') return item.amount;
  if (item.kind === 'DESPESA') return -item.amount;

  const leaves = included.has(item.accountId);
  const enters = item.toAccountId ? included.has(item.toAccountId) : false;
  if (leaves === enters) return 0;
  return leaves ? -item.amount : item.amount;
}

/**
 * Saldo no fim do dia `dateISO`. Os saldos em `data.ts` sao os de hoje, entao o
 * passado se reconstroi desfazendo o que entrou e saiu depois da data, e o
 * futuro somando o que ainda vai acontecer.
 */
export function balanceAt(dateISO: string): number {
  const reference = todayISO();
  const ahead = dateISO >= reference;
  const from = ahead ? reference : dateISO;
  const to = ahead ? dateISO : reference;
  const included = includedAccountIds();

  const net = transactions.reduce(
    (sum, item) => (item.date > from && item.date <= to ? sum + balanceEffect(item, included) : sum),
    0,
  );

  return Math.round((totalBalance() + (ahead ? net : -net)) * 100) / 100;
}

/**
 * Ultimo dia do mes, limitado a hoje: o saldo de um mes em andamento e o de
 * agora, nao uma projecao do que ainda vai cair ate o dia 31.
 */
export function monthClosingDate(monthKey: string): string {
  const { to } = monthKeyRange(monthKey);
  const reference = todayISO();
  return monthKey === reference.slice(0, 7) && to > reference ? reference : to;
}
