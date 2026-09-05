import { ApiError } from '@/api';
import type { Account, AccountPayload } from '@/types';
import { accounts, transactions } from './data';

/**
 * Escrita do cadastro de contas. Mesmo contrato do backend futuro: o cliente
 * manda o payload, o servidor devolve o registro completo ou um `ApiError` com
 * a mesma forma que o `httpClient` produz.
 */

let sequence = accounts.length;

function nextId(): string {
  sequence += 1;
  return `acc-${sequence}`;
}

function findIndexOrThrow(id: string): number {
  const index = accounts.findIndex((item) => item.id === id);
  if (index < 0) {
    throw new ApiError('Conta não encontrada.', 404, 'not_found');
  }
  return index;
}

function validate(payload: AccountPayload, id?: string): void {
  if (payload.name.trim().length < 2) {
    throw new ApiError('Informe o nome da conta.', 422, 'validation_error');
  }
  if (payload.institution.trim().length < 2) {
    throw new ApiError('Informe a instituição da conta.', 422, 'validation_error');
  }
  if (!Number.isFinite(payload.balance)) {
    throw new ApiError('Informe um saldo válido.', 422, 'validation_error');
  }

  // Duas contas com o mesmo nome na mesma instituicao sao indistinguiveis nos
  // seletores de lancamento, que mostram so o nome.
  const name = payload.name.trim().toLowerCase();
  const institution = payload.institution.trim().toLowerCase();
  const duplicated = accounts.some(
    (item) =>
      item.id !== id &&
      item.name.trim().toLowerCase() === name &&
      item.institution.trim().toLowerCase() === institution,
  );

  if (duplicated) {
    throw new ApiError('Já existe uma conta com esse nome nessa instituição.', 409, 'conflict');
  }
}

function resolve(payload: AccountPayload): Omit<Account, 'id'> {
  return {
    name: payload.name.trim(),
    institution: payload.institution.trim(),
    type: payload.type,
    balance: payload.balance,
    status: payload.status,
    // Conta inativa nunca soma: ela sai do patrimonio junto com a inativacao.
    includeInTotal: payload.status === 'ATIVO' && payload.includeInTotal,
  };
}

export function createAccount(payload: AccountPayload): Account {
  validate(payload);
  const created: Account = { id: nextId(), ...resolve(payload) };
  accounts.push(created);
  return created;
}

export function updateAccount(id: string, payload: AccountPayload): Account {
  const index = findIndexOrThrow(id);
  validate(payload, id);

  const updated: Account = { id, ...resolve(payload) };
  accounts[index] = updated;

  // O nome da conta esta desnormalizado nos lancamentos, como viria da API.
  for (const item of transactions) {
    if (item.accountId === id) item.accountName = updated.name;
    if (item.toAccountId === id) item.toAccountName = updated.name;
  }

  return updated;
}

/**
 * Excluir uma conta com historico apagaria a origem de lancamentos que continuam
 * na lista. Quem encerrou a conta marca como inativa: ela sai do saldo total e
 * dos seletores, e o passado permanece legivel.
 */
export function deleteAccount(id: string): void {
  const index = findIndexOrThrow(id);
  const linked = transactions.filter((item) => item.accountId === id || item.toAccountId === id).length;

  if (linked > 0) {
    throw new ApiError(
      `Esta conta tem ${linked} ${linked === 1 ? 'lançamento' : 'lançamentos'} no histórico. Marque-a como inativa para tirá-la do saldo sem apagar o passado.`,
      409,
      'conflict',
    );
  }

  accounts.splice(index, 1);
}
