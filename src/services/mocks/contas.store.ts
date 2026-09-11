import { ErroApi } from '@/api';
import { limitesTexto } from '@/constants/validacao';
import type { ContaDTO, SalvarContaDTO } from '@/types';
import { cabeNaColunaValor } from '@/utils/validacao';
import { contas, cartoes, lancamentos, despesasRecorrentes } from './dados';

let sequencia = contas.length;

function proximoId(): string {
  sequencia += 1;
  return `acc-${sequencia}`;
}

function buscarIndiceOuFalhar(id: string): number {
  const index = contas.findIndex((item) => item.id === id);
  if (index < 0) {
    throw new ErroApi('Conta não encontrada!', 404, 'nao_encontrado');
  }
  return index;
}

function validar(payload: SalvarContaDTO, id?: string): void {
  if (payload.nome.trim().length < 2) {
    throw new ErroApi('Informe o nome da conta!', 422, 'erro_validacao');
  }
  if (payload.nome.trim().length > limitesTexto.nomeConta) {
    throw new ErroApi(`O nome da conta pode ter no máximo ${limitesTexto.nomeConta} caracteres!`, 422, 'erro_validacao');
  }
  if (payload.instituicao.trim().length < 2) {
    throw new ErroApi('Informe a instituição da conta!', 422, 'erro_validacao');
  }
  if (payload.instituicao.trim().length > limitesTexto.instituicao) {
    throw new ErroApi(`O nome da instituição pode ter no máximo ${limitesTexto.instituicao} caracteres!`, 422, 'erro_validacao');
  }
  if (!cabeNaColunaValor(payload.saldo)) {
    throw new ErroApi('Informe um saldo válido!', 422, 'erro_validacao');
  }

  const name = payload.nome.trim().toLowerCase();
  const institution = payload.instituicao.trim().toLowerCase();
  const duplicated = contas.some(
    (item) =>
      item.id !== id &&
      item.nome.trim().toLowerCase() === name &&
      item.instituicao.trim().toLowerCase() === institution,
  );

  if (duplicated) {
    throw new ErroApi('Já existe uma conta com esse nome nessa instituição!', 409, 'conflito');
  }
}

function resolver(payload: SalvarContaDTO): Omit<ContaDTO, 'id'> {
  return {
    nome: payload.nome.trim(),
    instituicao: payload.instituicao.trim(),
    tipo: payload.tipo,
    saldo: payload.saldo,
    situacao: payload.situacao,
    incluirNoTotal: payload.situacao === 'ATIVO' && payload.incluirNoTotal,
  };
}

export function criarConta(payload: SalvarContaDTO): ContaDTO {
  validar(payload);
  const created: ContaDTO = { id: proximoId(), ...resolver(payload) };
  contas.push(created);
  return created;
}

export function atualizarConta(id: string, payload: SalvarContaDTO): ContaDTO {
  const index = buscarIndiceOuFalhar(id);
  validar(payload, id);

  const updated: ContaDTO = { id, ...resolver(payload) };
  contas[index] = updated;

  for (const item of lancamentos) {
    if (item.idOrigem === id) item.nomeOrigem = updated.nome;
    if (item.idContaDestino === id) item.nomeContaDestino = updated.nome;
  }

  return updated;
}

export function excluirConta(id: string): void {
  const index = buscarIndiceOuFalhar(id);
  const linked =
    lancamentos.filter((item) => item.idOrigem === id || item.idContaDestino === id).length +
    despesasRecorrentes.filter((item) => item.idOrigem === id).length;

  if (linked > 0) {
    throw new ErroApi(
      `Esta conta tem ${linked} ${linked === 1 ? 'registro' : 'registros'} no histórico. Marque-a como inativa para tirá-la do saldo sem apagar o passado!`,
      409,
      'conflito',
    );
  }

  const linkedCards = cartoes.filter((item) => item.idConta === id).length;

  if (linkedCards === 1) {
    throw new ErroApi(
      'Esta conta está vinculada a um cartão de débito. Troque a conta desse cartão ou exclua-o antes de excluir a conta!',
      409,
      'conflito',
    );
  }

  if (linkedCards > 1) {
    throw new ErroApi(
      `Esta conta está vinculada a ${linkedCards} cartões de débito. Troque a conta desses cartões ou exclua-os antes de excluir a conta!`,
      409,
      'conflito',
    );
  }

  contas.splice(index, 1);
}
