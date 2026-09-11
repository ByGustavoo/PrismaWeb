import { ErroApi } from '@/api';
import { limitesTexto } from '@/constants/validacao';
import type { CartaoDTO, CompraParceladaDTO, SalvarCartaoDTO, SalvarCompraParceladaDTO } from '@/types';
import { ehChaveMes } from '@/utils/data';
import { cabeNaColunaValor } from '@/utils/validacao';
import { contas, cartoes, categorias, comprasParceladas, lancamentos, despesasRecorrentes } from './dados';

let sequenciaCartao = cartoes.length;
let sequenciaCompra = comprasParceladas.length;

function buscarIndiceCartaoOuFalhar(id: string): number {
  const index = cartoes.findIndex((item) => item.id === id);
  if (index < 0) {
    throw new ErroApi('Cartão não encontrado!', 404, 'nao_encontrado');
  }
  return index;
}

function buscarIndiceCompraOuFalhar(id: string): number {
  const index = comprasParceladas.findIndex((item) => item.id === id);
  if (index < 0) {
    throw new ErroApi('Compra parcelada não encontrada!', 404, 'nao_encontrado');
  }
  return index;
}

function validarDia(value: number | undefined, field: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 31) {
    throw new ErroApi(`Informe um dia de ${field} entre 1 e 31!`, 422, 'erro_validacao');
  }
  return value;
}

function resolverCartao(payload: SalvarCartaoDTO): Omit<CartaoDTO, 'id'> {
  const base = {
    nome: payload.nome.trim(),
    instituicao: payload.instituicao.trim(),
    tipo: payload.tipo,
    situacao: payload.situacao,
    ...(payload.bandeira?.trim() ? { bandeira: payload.bandeira.trim() } : {}),
    ...(payload.ultimosDigitos?.trim() ? { ultimosDigitos: payload.ultimosDigitos.trim() } : {}),
  };

  if (payload.nome.trim().length < 2) {
    throw new ErroApi('Informe o nome do cartão!', 422, 'erro_validacao');
  }
  if (payload.nome.trim().length > limitesTexto.nomeCartao) {
    throw new ErroApi(`O nome do cartão pode ter no máximo ${limitesTexto.nomeCartao} caracteres!`, 422, 'erro_validacao');
  }
  if (payload.instituicao.trim().length < 2) {
    throw new ErroApi('Informe a instituição do cartão!', 422, 'erro_validacao');
  }
  if (payload.instituicao.trim().length > limitesTexto.instituicao) {
    throw new ErroApi(`O nome da instituição pode ter no máximo ${limitesTexto.instituicao} caracteres!`, 422, 'erro_validacao');
  }
  if ((payload.bandeira?.trim().length ?? 0) > limitesTexto.bandeiraCartao) {
    throw new ErroApi(`A bandeira pode ter no máximo ${limitesTexto.bandeiraCartao} caracteres!`, 422, 'erro_validacao');
  }
  if (payload.ultimosDigitos && !/^\d{4}$/.test(payload.ultimosDigitos.trim())) {
    throw new ErroApi('Os últimos dígitos precisam ser quatro números!', 422, 'erro_validacao');
  }

  if (payload.tipo === 'CREDITO') {
    if (typeof payload.limiteCredito !== 'number' || !cabeNaColunaValor(payload.limiteCredito) || payload.limiteCredito <= 0) {
      throw new ErroApi('Informe o limite do cartão!', 422, 'erro_validacao');
    }

    return {
      ...base,
      limiteCredito: payload.limiteCredito,
      diaFechamento: validarDia(payload.diaFechamento, 'fechamento'),
      diaVencimento: validarDia(payload.diaVencimento, 'vencimento'),
    };
  }

  if (payload.tipo === 'DEBITO') {
    const account = contas.find((item) => item.id === payload.idConta);
    if (!account) {
      throw new ErroApi('Escolha a conta vinculada ao cartão de débito!', 422, 'erro_validacao');
    }
    return { ...base, idConta: account.id, nomeConta: account.nome };
  }

  const balance = payload.saldo ?? 0;
  if (!cabeNaColunaValor(balance) || balance < 0) {
    throw new ErroApi('Informe um saldo válido para o cartão!', 422, 'erro_validacao');
  }
  return { ...base, saldo: balance };
}

export function criarCartao(payload: SalvarCartaoDTO): CartaoDTO {
  sequenciaCartao += 1;
  const created: CartaoDTO = { id: `card-${sequenciaCartao}`, ...resolverCartao(payload) };
  cartoes.push(created);
  return created;
}

export function atualizarCartao(id: string, payload: SalvarCartaoDTO): CartaoDTO {
  const index = buscarIndiceCartaoOuFalhar(id);
  const updated: CartaoDTO = { id, ...resolverCartao(payload) };
  cartoes[index] = updated;

  for (const item of lancamentos) {
    if (item.idOrigem === id) item.nomeOrigem = updated.nome;
  }
  for (const purchase of comprasParceladas) {
    if (purchase.idCartao === id) purchase.nomeCartao = updated.nome;
  }

  return updated;
}

export function excluirCartao(id: string): void {
  const index = buscarIndiceCartaoOuFalhar(id);
  const linked =
    lancamentos.filter((item) => item.idOrigem === id).length +
    comprasParceladas.filter((item) => item.idCartao === id).length +
    despesasRecorrentes.filter((item) => item.idOrigem === id).length;

  if (linked > 0) {
    throw new ErroApi(
      `Este cartão tem ${linked} ${linked === 1 ? 'registro' : 'registros'} no histórico. Marque-o como inativo para tirá-lo dos lançamentos sem apagar o passado!`,
      409,
      'conflito',
    );
  }

  cartoes.splice(index, 1);
}

function resolverCompra(payload: SalvarCompraParceladaDTO): Omit<CompraParceladaDTO, 'id'> {
  if (payload.descricao.trim().length < 2) {
    throw new ErroApi('Informe a descrição da compra!', 422, 'erro_validacao');
  }
  if (payload.descricao.trim().length > limitesTexto.descricao) {
    throw new ErroApi(`A descrição da compra pode ter no máximo ${limitesTexto.descricao} caracteres!`, 422, 'erro_validacao');
  }
  if (!cabeNaColunaValor(payload.valorTotal) || payload.valorTotal <= 0) {
    throw new ErroApi('Informe o valor total da compra!', 422, 'erro_validacao');
  }
  if ((payload.observacoes?.trim().length ?? 0) > limitesTexto.observacoes) {
    throw new ErroApi(`A observação pode ter no máximo ${limitesTexto.observacoes} caracteres!`, 422, 'erro_validacao');
  }
  if (!Number.isInteger(payload.parcelas) || payload.parcelas < 2 || payload.parcelas > 48) {
    throw new ErroApi('O parcelamento precisa ter de 2 a 48 parcelas!', 422, 'erro_validacao');
  }
  if (!ehChaveMes(payload.primeiroMes)) {
    throw new ErroApi('Informe o mês da primeira parcela!', 422, 'erro_validacao');
  }

  const card = cartoes.find((item) => item.id === payload.idCartao);
  if (!card) {
    throw new ErroApi('O cartão informado não existe!', 422, 'erro_validacao');
  }
  if (card.tipo !== 'CREDITO') {
    throw new ErroApi('Só cartões de crédito aceitam compras parceladas!', 422, 'erro_validacao');
  }

  return {
    descricao: payload.descricao.trim(),
    valorTotal: payload.valorTotal,
    parcelas: payload.parcelas,
    dataCompra: payload.dataCompra,
    primeiroMes: payload.primeiroMes,
    idCartao: card.id,
    nomeCartao: card.nome,
    categoria: categorias.find((item) => item.id === payload.idCategoria) ?? null,
    ...(payload.observacoes?.trim() ? { observacoes: payload.observacoes.trim() } : {}),
  };
}

export function criarCompraParcelada(payload: SalvarCompraParceladaDTO): CompraParceladaDTO {
  sequenciaCompra += 1;
  const created: CompraParceladaDTO = { id: `ip-${sequenciaCompra}`, ...resolverCompra(payload) };
  comprasParceladas.unshift(created);
  return created;
}

export function atualizarCompraParcelada(id: string, payload: SalvarCompraParceladaDTO): CompraParceladaDTO {
  const index = buscarIndiceCompraOuFalhar(id);
  const updated: CompraParceladaDTO = { id, ...resolverCompra(payload) };
  comprasParceladas[index] = updated;
  return updated;
}

export function excluirCompraParcelada(id: string): void {
  comprasParceladas.splice(buscarIndiceCompraOuFalhar(id), 1);
}
