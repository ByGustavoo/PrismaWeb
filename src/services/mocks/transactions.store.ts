import { ApiError } from '@/api';
import type { Lancamento, LancamentoPayload } from '@/types';
import { categories, findPaymentSource, transactions } from './data';

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
    throw new ApiError('Lançamento não encontrado.', 404, 'nao_encontrado');
  }
  return index;
}

/**
 * Traduz o payload (so ids) no registro completo que a API devolveria, com
 * nome de conta e categoria ja resolvidos.
 */
function resolve(payload: LancamentoPayload): Omit<Lancamento, 'id'> {
  const source = findPaymentSource(payload.idOrigem);
  if (!source) {
    throw new ApiError('A conta informada não existe.', 422, 'erro_validacao');
  }

  const destination = payload.idContaDestino ? findPaymentSource(payload.idContaDestino) : undefined;

  if (payload.tipo === 'TRANSFERENCIA') {
    if (!destination) {
      throw new ApiError('A conta de destino informada não existe.', 422, 'erro_validacao');
    }
    if (destination.id === source.id) {
      throw new ApiError('A conta de destino precisa ser diferente da origem.', 422, 'erro_validacao');
    }
  }

  // Transferencia nao entra em receita nem em despesa, entao tambem nao tem categoria.
  const category =
    payload.tipo === 'TRANSFERENCIA'
      ? null
      : categories.find((item) => item.id === payload.idCategoria) ?? null;

  if (payload.tipo !== 'TRANSFERENCIA' && !category) {
    throw new ApiError('A categoria informada não existe.', 422, 'erro_validacao');
  }

  return {
    descricao: payload.descricao.trim(),
    valor: payload.valor,
    tipo: payload.tipo,
    situacao: payload.situacao,
    forma: payload.forma,
    data: payload.data,
    categoria: category,
    idOrigem: source.id,
    nomeOrigem: source.name,
    ...(destination && payload.tipo === 'TRANSFERENCIA'
      ? { idContaDestino: destination.id, nomeContaDestino: destination.name }
      : {}),
    ...(payload.observacoes?.trim() ? { observacoes: payload.observacoes.trim() } : {}),
  };
}

export function createTransaction(payload: LancamentoPayload): Lancamento {
  const created: Lancamento = { id: nextId(), ...resolve(payload) };
  transactions.unshift(created);
  return created;
}

export function updateTransaction(id: string, payload: LancamentoPayload): Lancamento {
  const index = findIndexOrThrow(id);
  const updated: Lancamento = { id, ...resolve(payload) };
  transactions[index] = updated;
  return updated;
}

export function deleteTransaction(id: string): void {
  transactions.splice(findIndexOrThrow(id), 1);
}
