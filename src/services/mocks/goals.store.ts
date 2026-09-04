import { ApiError } from '@/api';
import type { Goal, GoalPayload, GoalPriceEntry, GoalPricePayload, GoalUpdatePayload } from '@/types';
import { todayISO } from '@/utils/date';
import { goals } from './data';

/**
 * Escrita do cadastro de metas. Como nas demais stores, o formato de erro e o
 * mesmo que a API real usara.
 *
 * A regra que vale mais do que todas as outras aqui: registrar um preco novo
 * nunca sobrescreve o anterior. Sem a serie inteira, a tela perde menor preco,
 * media, variacao e grafico — sobra o ultimo numero digitado, que qualquer
 * campo de texto ja daria.
 */

let goalSequence = goals.length;
let priceSequence = goals.reduce((total, goal) => total + goal.history.length, 0);

function findIndexOrThrow(id: string): number {
  const index = goals.findIndex((item) => item.id === id);
  if (index < 0) {
    throw new ApiError('Meta não encontrada.', 404, 'not_found');
  }
  return index;
}

function findOrThrow(id: string): Goal {
  const goal = goals[findIndexOrThrow(id)];
  if (!goal) throw new ApiError('Meta não encontrada.', 404, 'not_found');
  return goal;
}

/** Aceita so o que o navegador consegue abrir; um "www.loja.com" solto nao abre. */
function assertLink(value: string | undefined, field: string): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  if (!/^https?:\/\/\S+$/i.test(trimmed)) {
    throw new ApiError(`Informe um ${field} começando com http:// ou https://.`, 422, 'validation_error');
  }
  return trimmed;
}

function assertPrice(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new ApiError('Informe um preço maior que zero.', 422, 'validation_error');
  }
  return value;
}

function assertDate(value: string): string {
  if (!value) {
    throw new ApiError('Informe a data do registro.', 422, 'validation_error');
  }
  // Um preco consultado no futuro nao foi consultado: a serie perderia o
  // sentido de "o que eu vi, e quando".
  if (value > todayISO()) {
    throw new ApiError('A data do registro não pode estar no futuro.', 422, 'validation_error');
  }
  return value;
}

function nextPriceId(): string {
  priceSequence += 1;
  return `gp-${priceSequence}`;
}

export function createGoal(payload: GoalPayload): Goal {
  if (payload.name.trim().length < 2) {
    throw new ApiError('Informe o nome do produto.', 422, 'validation_error');
  }

  const price = assertPrice(payload.price);
  const date = assertDate(payload.date || todayISO());
  const url = assertLink(payload.url, 'link do produto');
  const imageUrl = assertLink(payload.imageUrl, 'link da imagem');

  goalSequence += 1;

  const entry: GoalPriceEntry = { id: nextPriceId(), date, price };
  const created: Goal = {
    id: `goal-${goalSequence}`,
    name: payload.name.trim(),
    status: payload.status,
    createdAt: date,
    history: [entry],
    ...(url ? { url } : {}),
    ...(imageUrl ? { imageUrl } : {}),
    ...(payload.notes?.trim() ? { notes: payload.notes.trim() } : {}),
  };

  goals.unshift(created);
  return created;
}

/** Edicao mexe em identidade e situacao; o preco tem caminho proprio. */
export function updateGoal(id: string, payload: GoalUpdatePayload): Goal {
  const index = findIndexOrThrow(id);
  const current = findOrThrow(id);

  if (payload.name.trim().length < 2) {
    throw new ApiError('Informe o nome do produto.', 422, 'validation_error');
  }

  const url = assertLink(payload.url, 'link do produto');
  const imageUrl = assertLink(payload.imageUrl, 'link da imagem');

  const updated: Goal = {
    id: current.id,
    name: payload.name.trim(),
    status: payload.status,
    createdAt: current.createdAt,
    history: current.history,
    ...(url ? { url } : {}),
    ...(imageUrl ? { imageUrl } : {}),
    ...(payload.notes?.trim() ? { notes: payload.notes.trim() } : {}),
  };

  goals[index] = updated;
  return updated;
}

export function addGoalPrice(id: string, payload: GoalPricePayload): Goal {
  const goal = findOrThrow(id);
  const price = assertPrice(payload.price);
  const date = assertDate(payload.date || todayISO());

  // Um registro anterior ao primeiro trocaria silenciosamente o "preco
  // inicial", que e a referencia de toda a variacao mostrada na tela.
  if (date < goal.createdAt) {
    throw new ApiError('A data do registro não pode ser anterior ao primeiro preço.', 422, 'validation_error');
  }

  // Mesmo preco no mesmo dia e clique repetido, nao consulta nova.
  const duplicated = goal.history.some((entry) => entry.date === date && entry.price === price);
  if (duplicated) {
    throw new ApiError('Já existe um registro com esse preço nesta data.', 409, 'conflict');
  }

  goal.history.push({
    id: nextPriceId(),
    date,
    price,
    ...(payload.note?.trim() ? { note: payload.note.trim() } : {}),
  });

  return goal;
}

/**
 * A meta nao deixa rastro em outra tela — nao ha lancamento nem fatura preso a
 * ela —, entao aqui a exclusao e simples, sem o 409 das contas e dos cartoes.
 * O que se perde e o historico de precos, e por isso a tela confirma antes.
 */
export function deleteGoal(id: string): void {
  goals.splice(findIndexOrThrow(id), 1);
}
