import { ApiError } from '@/api';
import type { Transaction, TransactionPayload } from '@/types';
import { categories, paymentSources, transactions } from './data';

/**
 * Escrita da camada de mock. Guarda os lancamentos em memoria enquanto nao
 * existe backend: o estado vive so ate o reload da pagina, o que basta para
 * exercitar cadastro, edicao e exclusao com os mesmos erros da API real.
 *
 * Quando o backend Java entrar, este arquivo sai inteiro e nada muda nas telas:
 * quem chama e apenas `transactions.service.ts`.
 */

/** Continua a numeracao da semente para nao repetir id. */
let sequence = transactions.length;

function nextId(): string {
  sequence += 1;
  return `tx-${String(sequence).padStart(2, '0')}`;
}

function findIndexOrThrow(id: string): number {
  const index = transactions.findIndex((item) => item.id === id);
  if (index < 0) {
    throw new ApiError('Lançamento não encontrado.', 404, 'not_found');
  }
  return index;
}

/**
 * Traduz o payload (so ids) no registro completo que a API devolveria, com
 * nome de conta e categoria ja resolvidos.
 */
function resolve(payload: TransactionPayload): Omit<Transaction, 'id'> {
  const source = paymentSources.find((item) => item.id === payload.accountId);
  if (!source) {
    throw new ApiError('A conta informada não existe.', 422, 'validation_error');
  }

  const destination = payload.toAccountId
    ? paymentSources.find((item) => item.id === payload.toAccountId)
    : undefined;

  if (payload.kind === 'transfer') {
    if (!destination) {
      throw new ApiError('A conta de destino informada não existe.', 422, 'validation_error');
    }
    if (destination.id === source.id) {
      throw new ApiError('A conta de destino precisa ser diferente da origem.', 422, 'validation_error');
    }
  }

  // Transferencia nao entra em receita nem em despesa, entao tambem nao tem categoria.
  const category =
    payload.kind === 'transfer'
      ? null
      : categories.find((item) => item.id === payload.categoryId) ?? null;

  if (payload.kind !== 'transfer' && !category) {
    throw new ApiError('A categoria informada não existe.', 422, 'validation_error');
  }

  return {
    description: payload.description.trim(),
    amount: payload.amount,
    kind: payload.kind,
    status: payload.status,
    method: payload.method,
    date: payload.date,
    category,
    accountId: source.id,
    accountName: source.name,
    ...(destination && payload.kind === 'transfer'
      ? { toAccountId: destination.id, toAccountName: destination.name }
      : {}),
    ...(payload.notes?.trim() ? { notes: payload.notes.trim() } : {}),
  };
}

export function createTransaction(payload: TransactionPayload): Transaction {
  const created: Transaction = { id: nextId(), ...resolve(payload) };
  transactions.unshift(created);
  return created;
}

export function updateTransaction(id: string, payload: TransactionPayload): Transaction {
  const index = findIndexOrThrow(id);
  const updated: Transaction = { id, ...resolve(payload) };
  transactions[index] = updated;
  return updated;
}

export function deleteTransaction(id: string): void {
  transactions.splice(findIndexOrThrow(id), 1);
}
