import { ErroApi } from '@/api';
import { limitesTexto } from '@/constants/validacao';
import type { AtualizarMetaDTO, MetaDTO, MetaPrecoDTO, SalvarMetaDTO, SalvarMetaPrecoDTO } from '@/types';
import { hojeISO } from '@/utils/data';
import { cabeNaColunaValor } from '@/utils/validacao';
import { metas } from './dados';

let sequenciaMeta = metas.length;
let sequenciaPreco = metas.reduce((total, goal) => total + goal.historico.length, 0);

function buscarIndiceOuFalhar(id: string): number {
  const index = metas.findIndex((item) => item.id === id);
  if (index < 0) {
    throw new ErroApi('Meta não encontrada!', 404, 'nao_encontrado');
  }
  return index;
}

function buscarOuFalhar(id: string): MetaDTO {
  const goal = metas[buscarIndiceOuFalhar(id)];
  if (!goal) throw new ErroApi('Meta não encontrada!', 404, 'nao_encontrado');
  return goal;
}

function validarLink(value: string | undefined, field: string): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  if (trimmed.length > limitesTexto.link) {
    throw new ErroApi(`O ${field} pode ter no máximo ${limitesTexto.link} caracteres!`, 422, 'erro_validacao');
  }
  if (!/^https?:\/\/\S+$/i.test(trimmed)) {
    throw new ErroApi(`Informe um ${field} começando com http:// ou https://!`, 422, 'erro_validacao');
  }
  return trimmed;
}

function validarNome(value: string): string {
  const name = value.trim();
  if (name.length < 2) {
    throw new ErroApi('Informe o nome do produto!', 422, 'erro_validacao');
  }
  if (name.length > limitesTexto.nomeMeta) {
    throw new ErroApi(`O nome do produto pode ter no máximo ${limitesTexto.nomeMeta} caracteres!`, 422, 'erro_validacao');
  }
  return name;
}

function validarPreco(value: number): number {
  if (!cabeNaColunaValor(value) || value <= 0) {
    throw new ErroApi('Informe um preço maior que zero!', 422, 'erro_validacao');
  }
  return value;
}

function validarData(value: string): string {
  if (!value) {
    throw new ErroApi('Informe a data do registro!', 422, 'erro_validacao');
  }
  if (value > hojeISO()) {
    throw new ErroApi('A data do registro não pode estar no futuro!', 422, 'erro_validacao');
  }
  return value;
}

function validarTamanhoObservacao(value: string | undefined): void {
  if ((value?.trim().length ?? 0) > limitesTexto.observacoes) {
    throw new ErroApi(`A observação pode ter no máximo ${limitesTexto.observacoes} caracteres!`, 422, 'erro_validacao');
  }
}

function proximoIdPreco(): string {
  sequenciaPreco += 1;
  return `gp-${sequenciaPreco}`;
}

export function criarMeta(payload: SalvarMetaDTO): MetaDTO {
  const name = validarNome(payload.nome);
  const price = validarPreco(payload.preco);
  const date = validarData(payload.data || hojeISO());
  const url = validarLink(payload.url, 'link do produto');
  const imageUrl = validarLink(payload.urlImagem, 'link da imagem');
  validarTamanhoObservacao(payload.observacoes);

  sequenciaMeta += 1;

  const entry: MetaPrecoDTO = { id: proximoIdPreco(), data: date, preco: price };
  const created: MetaDTO = {
    id: `goal-${sequenciaMeta}`,
    nome: name,
    situacao: payload.situacao,
    dataCriacao: date,
    historico: [entry],
    ...(url ? { url } : {}),
    ...(imageUrl ? { urlImagem: imageUrl } : {}),
    ...(payload.observacoes?.trim() ? { observacoes: payload.observacoes.trim() } : {}),
  };

  metas.unshift(created);
  return created;
}

export function atualizarMeta(id: string, payload: AtualizarMetaDTO): MetaDTO {
  const index = buscarIndiceOuFalhar(id);
  const current = buscarOuFalhar(id);

  const name = validarNome(payload.nome);
  const url = validarLink(payload.url, 'link do produto');
  const imageUrl = validarLink(payload.urlImagem, 'link da imagem');
  validarTamanhoObservacao(payload.observacoes);

  const updated: MetaDTO = {
    id: current.id,
    nome: name,
    situacao: payload.situacao,
    dataCriacao: current.dataCriacao,
    historico: current.historico,
    ...(url ? { url } : {}),
    ...(imageUrl ? { urlImagem: imageUrl } : {}),
    ...(payload.observacoes?.trim() ? { observacoes: payload.observacoes.trim() } : {}),
  };

  metas[index] = updated;
  return updated;
}

export function adicionarPrecoMeta(id: string, payload: SalvarMetaPrecoDTO): MetaDTO {
  const goal = buscarOuFalhar(id);
  const price = validarPreco(payload.preco);
  const date = validarData(payload.data || hojeISO());
  validarTamanhoObservacao(payload.observacao);

  if (date < goal.dataCriacao) {
    throw new ErroApi('A data do registro não pode ser anterior ao primeiro preço!', 422, 'erro_validacao');
  }

  const duplicated = goal.historico.some((entry) => entry.data === date && entry.preco === price);
  if (duplicated) {
    throw new ErroApi('Já existe um registro com esse preço nesta data!', 409, 'conflito');
  }

  goal.historico.push({
    id: proximoIdPreco(),
    data: date,
    preco: price,
    ...(payload.observacao?.trim() ? { observacao: payload.observacao.trim() } : {}),
  });

  return goal;
}

export function excluirMeta(id: string): void {
  metas.splice(buscarIndiceOuFalhar(id), 1);
}
