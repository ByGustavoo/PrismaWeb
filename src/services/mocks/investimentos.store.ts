import { ErroApi } from '@/api';
import { limitesTexto } from '@/constants/validacao';
import type { InvestimentoDTO, SalvarInvestimentoDTO } from '@/types';
import { hojeISO } from '@/utils/data';
import { cabeNaColunaValor } from '@/utils/validacao';
import { investimentos } from './dados';

let sequencia = investimentos.length;

function buscarIndiceOuFalhar(id: string): number {
  const index = investimentos.findIndex((item) => item.id === id);
  if (index < 0) {
    throw new ErroApi('Investimento não encontrado!', 404, 'nao_encontrado');
  }
  return index;
}

function resolver(payload: SalvarInvestimentoDTO): Omit<InvestimentoDTO, 'id'> {
  if (payload.nome.trim().length < 2) {
    throw new ErroApi('Informe o nome do investimento!', 422, 'erro_validacao');
  }
  if (payload.nome.trim().length > limitesTexto.nomeInvestimento) {
    throw new ErroApi(
      `O nome do investimento pode ter no máximo ${limitesTexto.nomeInvestimento} caracteres!`,
      422,
      'erro_validacao',
    );
  }
  if (payload.instituicao.trim().length < 2) {
    throw new ErroApi('Informe a instituição onde o dinheiro está aplicado!', 422, 'erro_validacao');
  }
  if (payload.instituicao.trim().length > limitesTexto.instituicao) {
    throw new ErroApi(`O nome da instituição pode ter no máximo ${limitesTexto.instituicao} caracteres!`, 422, 'erro_validacao');
  }
  if (!cabeNaColunaValor(payload.aportado) || payload.aportado <= 0) {
    throw new ErroApi('Informe quanto já foi aportado!', 422, 'erro_validacao');
  }
  if (!cabeNaColunaValor(payload.valorAtual) || payload.valorAtual < 0) {
    throw new ErroApi('Informe quanto a posição vale hoje!', 422, 'erro_validacao');
  }
  if ((payload.observacoes?.trim().length ?? 0) > limitesTexto.observacoes) {
    throw new ErroApi(`A observação pode ter no máximo ${limitesTexto.observacoes} caracteres!`, 422, 'erro_validacao');
  }
  if (!payload.dataInicio) {
    throw new ErroApi('Informe a data do primeiro aporte!', 422, 'erro_validacao');
  }
  if (payload.dataInicio > hojeISO()) {
    throw new ErroApi('A data do primeiro aporte não pode estar no futuro!', 422, 'erro_validacao');
  }

  return {
    nome: payload.nome.trim(),
    classeAtivo: payload.classeAtivo,
    instituicao: payload.instituicao.trim(),
    aportado: payload.aportado,
    valorAtual: payload.valorAtual,
    dataInicio: payload.dataInicio,
    ...(payload.observacoes?.trim() ? { observacoes: payload.observacoes.trim() } : {}),
  };
}

export function criarInvestimento(payload: SalvarInvestimentoDTO): InvestimentoDTO {
  sequencia += 1;
  const created: InvestimentoDTO = { id: `inv-${sequencia}`, ...resolver(payload) };
  investimentos.unshift(created);
  return created;
}

export function atualizarInvestimento(id: string, payload: SalvarInvestimentoDTO): InvestimentoDTO {
  const index = buscarIndiceOuFalhar(id);
  const updated: InvestimentoDTO = { id, ...resolver(payload) };
  investimentos[index] = updated;
  return updated;
}

export function excluirInvestimento(id: string): void {
  investimentos.splice(buscarIndiceOuFalhar(id), 1);
}
