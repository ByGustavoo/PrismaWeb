import { ApiError } from '@/api';
import type { Card, CardPayload, InstallmentPayload, InstallmentPurchase } from '@/types';
import { isMonthKey } from '@/utils/date';
import { accounts, cards, categories, installmentPurchases, transactions } from './data';

/**
 * Escrita dos cadastros de cartao e de compra parcelada. Como em
 * `accounts.store.ts`, o formato de erro e o mesmo que a API real usaria, para
 * que a tela ja trate hoje o que vai receber depois.
 */

let cardSequence = cards.length;
let purchaseSequence = installmentPurchases.length;

function findCardIndexOrThrow(id: string): number {
  const index = cards.findIndex((item) => item.id === id);
  if (index < 0) {
    throw new ApiError('Cartão não encontrado.', 404, 'nao_encontrado');
  }
  return index;
}

function findPurchaseIndexOrThrow(id: string): number {
  const index = installmentPurchases.findIndex((item) => item.id === id);
  if (index < 0) {
    throw new ApiError('Compra parcelada não encontrada.', 404, 'nao_encontrado');
  }
  return index;
}

function assertDay(value: number | undefined, field: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 31) {
    throw new ApiError(`Informe um dia de ${field} entre 1 e 31.`, 422, 'erro_validacao');
  }
  return value;
}

/* -------------------------------------------------------------------------- */
/* Cartoes                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Monta o registro a partir do payload guardando apenas o que o tipo de cartao
 * usa. Sem esse recorte, trocar um cartao de credito para vale-refeicao deixaria
 * limite e datas de fatura para tras, e a tela mostraria uma barra de limite num
 * cartao que nao tem limite.
 */
function resolveCard(payload: CardPayload): Omit<Card, 'id'> {
  const base = {
    name: payload.name.trim(),
    institution: payload.institution.trim(),
    type: payload.type,
    status: payload.status,
    ...(payload.brand?.trim() ? { brand: payload.brand.trim() } : {}),
    ...(payload.lastDigits?.trim() ? { lastDigits: payload.lastDigits.trim() } : {}),
  };

  if (payload.name.trim().length < 2) {
    throw new ApiError('Informe o nome do cartão.', 422, 'erro_validacao');
  }
  if (payload.institution.trim().length < 2) {
    throw new ApiError('Informe a instituição do cartão.', 422, 'erro_validacao');
  }
  if (payload.lastDigits && !/^\d{4}$/.test(payload.lastDigits.trim())) {
    throw new ApiError('Os últimos dígitos precisam ser quatro números.', 422, 'erro_validacao');
  }

  if (payload.type === 'CREDITO') {
    if (typeof payload.limit !== 'number' || !Number.isFinite(payload.limit) || payload.limit <= 0) {
      throw new ApiError('Informe o limite do cartão.', 422, 'erro_validacao');
    }

    return {
      ...base,
      limit: payload.limit,
      closingDay: assertDay(payload.closingDay, 'fechamento'),
      dueDay: assertDay(payload.dueDay, 'vencimento'),
    };
  }

  if (payload.type === 'DEBITO') {
    const account = accounts.find((item) => item.id === payload.accountId);
    if (!account) {
      throw new ApiError('Escolha a conta vinculada ao cartão de débito.', 422, 'erro_validacao');
    }
    return { ...base, accountId: account.id, accountName: account.name };
  }

  const balance = payload.balance ?? 0;
  if (!Number.isFinite(balance) || balance < 0) {
    throw new ApiError('Informe um saldo válido para o cartão.', 422, 'erro_validacao');
  }
  return { ...base, balance };
}

export function createCard(payload: CardPayload): Card {
  cardSequence += 1;
  const created: Card = { id: `card-${cardSequence}`, ...resolveCard(payload) };
  cards.push(created);
  return created;
}

export function updateCard(id: string, payload: CardPayload): Card {
  const index = findCardIndexOrThrow(id);
  const updated: Card = { id, ...resolveCard(payload) };
  cards[index] = updated;

  // Nome desnormalizado nos lancamentos e nas compras parceladas, como viria da API.
  for (const item of transactions) {
    if (item.idOrigem === id) item.nomeOrigem = updated.name;
  }
  for (const purchase of installmentPurchases) {
    if (purchase.cardId === id) purchase.cardName = updated.name;
  }

  return updated;
}

/**
 * Mesma regra das contas: um cartao com passado nao se apaga, se inativa. As
 * compras parceladas contam junto porque suas parcelas continuam caindo nas
 * faturas dos proximos meses.
 */
export function deleteCard(id: string): void {
  const index = findCardIndexOrThrow(id);
  const linked =
    transactions.filter((item) => item.idOrigem === id).length +
    installmentPurchases.filter((item) => item.cardId === id).length;

  if (linked > 0) {
    throw new ApiError(
      `Este cartão tem ${linked} ${linked === 1 ? 'registro' : 'registros'} no histórico. Marque-o como inativo para tirá-lo dos lançamentos sem apagar o passado.`,
      409,
      'conflito',
    );
  }

  cards.splice(index, 1);
}

/* -------------------------------------------------------------------------- */
/* Compras parceladas                                                         */
/* -------------------------------------------------------------------------- */

function resolvePurchase(payload: InstallmentPayload): Omit<InstallmentPurchase, 'id'> {
  if (payload.description.trim().length < 2) {
    throw new ApiError('Informe a descrição da compra.', 422, 'erro_validacao');
  }
  if (!Number.isFinite(payload.totalAmount) || payload.totalAmount <= 0) {
    throw new ApiError('Informe o valor total da compra.', 422, 'erro_validacao');
  }
  if (!Number.isInteger(payload.count) || payload.count < 2 || payload.count > 48) {
    throw new ApiError('O parcelamento precisa ter de 2 a 48 parcelas.', 422, 'erro_validacao');
  }
  if (!isMonthKey(payload.firstMonth)) {
    throw new ApiError('Informe o mês da primeira parcela.', 422, 'erro_validacao');
  }

  const card = cards.find((item) => item.id === payload.cardId);
  if (!card) {
    throw new ApiError('O cartão informado não existe.', 422, 'erro_validacao');
  }
  if (card.type !== 'CREDITO') {
    throw new ApiError('Só cartões de crédito aceitam compras parceladas.', 422, 'erro_validacao');
  }

  return {
    description: payload.description.trim(),
    totalAmount: payload.totalAmount,
    count: payload.count,
    purchaseDate: payload.purchaseDate,
    firstMonth: payload.firstMonth,
    cardId: card.id,
    cardName: card.name,
    category: categories.find((item) => item.id === payload.categoryId) ?? null,
    ...(payload.notes?.trim() ? { notes: payload.notes.trim() } : {}),
  };
}

export function createInstallmentPurchase(payload: InstallmentPayload): InstallmentPurchase {
  purchaseSequence += 1;
  const created: InstallmentPurchase = { id: `ip-${purchaseSequence}`, ...resolvePurchase(payload) };
  installmentPurchases.unshift(created);
  return created;
}

export function updateInstallmentPurchase(id: string, payload: InstallmentPayload): InstallmentPurchase {
  const index = findPurchaseIndexOrThrow(id);
  const updated: InstallmentPurchase = { id, ...resolvePurchase(payload) };
  installmentPurchases[index] = updated;
  return updated;
}

export function deleteInstallmentPurchase(id: string): void {
  installmentPurchases.splice(findPurchaseIndexOrThrow(id), 1);
}
