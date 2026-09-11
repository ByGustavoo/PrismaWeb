import { ErroApi } from '@/api';
import { limitesTexto } from '@/constants/validacao';
import type { DespesaRecorrenteDTO, SalvarDespesaRecorrenteDTO } from '@/types';
import { cabeNaColunaValor } from '@/utils/validacao';
import { categorias, buscarOrigem, despesasRecorrentes } from './dados';

let sequencia = despesasRecorrentes.length;

function buscarIndiceOuFalhar(id: string): number {
  const index = despesasRecorrentes.findIndex((item) => item.id === id);
  if (index < 0) {
    throw new ErroApi('Despesa recorrente não encontrada!', 404, 'nao_encontrado');
  }
  return index;
}

function resolver(payload: SalvarDespesaRecorrenteDTO): Omit<DespesaRecorrenteDTO, 'id'> {
  if (payload.descricao.trim().length < 2) {
    throw new ErroApi('Informe a descrição da despesa!', 422, 'erro_validacao');
  }
  if (payload.descricao.trim().length > limitesTexto.descricao) {
    throw new ErroApi(`A descrição da despesa pode ter no máximo ${limitesTexto.descricao} caracteres!`, 422, 'erro_validacao');
  }
  if (!cabeNaColunaValor(payload.valor) || payload.valor <= 0) {
    throw new ErroApi('Informe um valor maior que zero!', 422, 'erro_validacao');
  }
  if ((payload.observacoes?.trim().length ?? 0) > limitesTexto.observacoes) {
    throw new ErroApi(`A observação pode ter no máximo ${limitesTexto.observacoes} caracteres!`, 422, 'erro_validacao');
  }
  if (!payload.proximoVencimento) {
    throw new ErroApi('Informe a data do próximo vencimento!', 422, 'erro_validacao');
  }

  const source = buscarOrigem(payload.idOrigem);
  if (!source) {
    throw new ErroApi('Escolha a conta ou o cartão que paga esta despesa!', 422, 'erro_validacao');
  }

  const category = categorias.find((item) => item.id === payload.idCategoria) ?? null;
  if (category && category.tipo !== 'DESPESA') {
    throw new ErroApi('Escolha uma categoria de despesa!', 422, 'erro_validacao');
  }

  return {
    descricao: payload.descricao.trim(),
    valor: payload.valor,
    categoria: category,
    frequencia: payload.frequencia,
    proximoVencimento: payload.proximoVencimento,
    idOrigem: source.id,
    nomeOrigem: source.nome,
    situacao: payload.situacao,
    ...(payload.observacoes?.trim() ? { observacoes: payload.observacoes.trim() } : {}),
  };
}

export function criarDespesaRecorrente(payload: SalvarDespesaRecorrenteDTO): DespesaRecorrenteDTO {
  sequencia += 1;
  const created: DespesaRecorrenteDTO = { id: `rec-${sequencia}`, ...resolver(payload) };
  despesasRecorrentes.unshift(created);
  return created;
}

export function atualizarDespesaRecorrente(id: string, payload: SalvarDespesaRecorrenteDTO): DespesaRecorrenteDTO {
  const index = buscarIndiceOuFalhar(id);
  const updated: DespesaRecorrenteDTO = { id, ...resolver(payload) };
  despesasRecorrentes[index] = updated;
  return updated;
}

export function excluirDespesaRecorrente(id: string): void {
  despesasRecorrentes.splice(buscarIndiceOuFalhar(id), 1);
}
