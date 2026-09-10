import { ApiError } from '@/api';
import { textLimits } from '@/constants/validation';
import type { Lancamento, LancamentoPayload } from '@/types';
import { fitsAmountColumn } from '@/utils/validation';
import { categories, findPaymentSource, transactions } from './data';

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

function resolve(payload: LancamentoPayload): Omit<Lancamento, 'id'> {
  if (payload.descricao.trim().length < 2) {
    throw new ApiError('Informe a descrição do lançamento.', 422, 'erro_validacao');
  }
  if (payload.descricao.trim().length > textLimits.description) {
    throw new ApiError(
      `A descrição do lançamento pode ter no máximo ${textLimits.description} caracteres.`,
      422,
      'erro_validacao',
    );
  }
  if (!fitsAmountColumn(payload.valor) || payload.valor <= 0) {
    throw new ApiError('Informe um valor maior que zero.', 422, 'erro_validacao');
  }
  if (!payload.data) {
    throw new ApiError('Informe a data do lançamento.', 422, 'erro_validacao');
  }
  if ((payload.observacoes?.trim().length ?? 0) > textLimits.notes) {
    throw new ApiError(`A observação pode ter no máximo ${textLimits.notes} caracteres.`, 422, 'erro_validacao');
  }

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
