import { ErroApi } from '@/api';
import { limitesTexto } from '@/constants/validacao';
import type { LancamentoDTO, SalvarLancamentoDTO } from '@/types';
import { hojeISO } from '@/utils/data';
import { cabeNaColunaValor } from '@/utils/validacao';
import { cartoes, categorias, buscarOrigem, lancamentos } from './dados';

let sequencia = lancamentos.length;

function proximoId(): string {
  sequencia += 1;
  return `tx-${String(sequencia).padStart(2, '0')}`;
}

function buscarIndiceOuFalhar(id: string): number {
  const index = lancamentos.findIndex((item) => item.id === id);
  if (index < 0) {
    throw new ErroApi('Lançamento não encontrado!', 404, 'nao_encontrado');
  }
  return index;
}

function resolver(payload: SalvarLancamentoDTO): Omit<LancamentoDTO, 'id'> {
  if (payload.descricao.trim().length < 2) {
    throw new ErroApi('Informe a descrição do lançamento!', 422, 'erro_validacao');
  }
  if (payload.descricao.trim().length > limitesTexto.descricao) {
    throw new ErroApi(
      `A descrição do lançamento pode ter no máximo ${limitesTexto.descricao} caracteres!`,
      422,
      'erro_validacao',
    );
  }
  if (!cabeNaColunaValor(payload.valor) || payload.valor <= 0) {
    throw new ErroApi('Informe um valor maior que zero!', 422, 'erro_validacao');
  }
  if (!payload.data) {
    throw new ErroApi('Informe a data do lançamento!', 422, 'erro_validacao');
  }
  if ((payload.observacoes?.trim().length ?? 0) > limitesTexto.observacoes) {
    throw new ErroApi(`A observação pode ter no máximo ${limitesTexto.observacoes} caracteres!`, 422, 'erro_validacao');
  }
  if (payload.situacao === 'PAGO' && payload.data > hojeISO()) {
    throw new ErroApi(
      'Um lançamento com data futura não pode estar concluído: marque como agendado ou pendente!',
      422,
      'erro_validacao',
    );
  }

  const source = buscarOrigem(payload.idOrigem);
  if (!source) {
    throw new ErroApi('A conta informada não existe!', 422, 'erro_validacao');
  }
  if (cartoes.find((item) => item.id === source.id)?.tipo === 'DEBITO') {
    throw new ErroApi(
      'O cartão de débito não é origem de lançamento: escolha a conta que ele movimenta!',
      422,
      'erro_validacao',
    );
  }

  const destination = payload.idContaDestino ? buscarOrigem(payload.idContaDestino) : undefined;

  if (payload.tipo === 'TRANSFERENCIA') {
    if (!destination) {
      throw new ErroApi('A conta de destino informada não existe!', 422, 'erro_validacao');
    }
    if (source.grupo !== 'CONTA') {
      throw new ErroApi('A transferência precisa sair de uma conta!', 422, 'erro_validacao');
    }
    if (destination.id === source.id) {
      throw new ErroApi('A conta de destino precisa ser diferente da origem!', 422, 'erro_validacao');
    }
  }

  const category =
    payload.tipo === 'TRANSFERENCIA'
      ? null
      : categorias.find((item) => item.id === payload.idCategoria) ?? null;

  if (payload.tipo !== 'TRANSFERENCIA' && !category) {
    throw new ErroApi('A categoria informada não existe!', 422, 'erro_validacao');
  }
  if (payload.tipo === 'DESPESA' && category && category.tipo !== 'DESPESA') {
    throw new ErroApi('Escolha uma categoria de despesa!', 422, 'erro_validacao');
  }
  if (payload.tipo === 'RECEITA' && category && category.tipo !== 'RECEITA') {
    throw new ErroApi('Escolha uma categoria de receita!', 422, 'erro_validacao');
  }

  if (source.grupo === 'CARTAO' && payload.forma !== 'CARTAO_CREDITO') {
    throw new ErroApi('Um lançamento no cartão precisa ter a forma de pagamento cartão!', 422, 'erro_validacao');
  }
  if (source.grupo === 'CONTA' && payload.forma === 'CARTAO_CREDITO') {
    throw new ErroApi(
      'Um lançamento na conta não pode ter a forma de pagamento cartão de crédito!',
      422,
      'erro_validacao',
    );
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
    nomeOrigem: source.nome,
    ...(destination && payload.tipo === 'TRANSFERENCIA'
      ? { idContaDestino: destination.id, nomeContaDestino: destination.nome }
      : {}),
    ...(payload.observacoes?.trim() ? { observacoes: payload.observacoes.trim() } : {}),
  };
}

export function criarLancamento(payload: SalvarLancamentoDTO): LancamentoDTO {
  const created: LancamentoDTO = { id: proximoId(), ...resolver(payload) };
  lancamentos.unshift(created);
  return created;
}

export function atualizarLancamento(id: string, payload: SalvarLancamentoDTO): LancamentoDTO {
  const index = buscarIndiceOuFalhar(id);
  const updated: LancamentoDTO = { id, ...resolver(payload) };
  lancamentos[index] = updated;
  return updated;
}

export function excluirLancamento(id: string): void {
  lancamentos.splice(buscarIndiceOuFalhar(id), 1);
}
