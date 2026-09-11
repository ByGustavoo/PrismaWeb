import { ErroApi } from '@/api';
import type { OrcamentoDTO, SalvarOrcamentoDTO } from '@/types';
import { cabeNaColunaValor } from '@/utils/validacao';
import { orcamentos, categorias } from './dados';

let sequencia = orcamentos.length;

function buscarIndiceOuFalhar(id: string): number {
  const index = orcamentos.findIndex((item) => item.id === id);
  if (index < 0) {
    throw new ErroApi('Orçamento não encontrado!', 404, 'nao_encontrado');
  }
  return index;
}

function resolver(payload: SalvarOrcamentoDTO, currentId?: string): Omit<OrcamentoDTO, 'id'> {
  const category = categorias.find((item) => item.id === payload.idCategoria);

  if (!category) {
    throw new ErroApi('Escolha a categoria do orçamento!', 422, 'erro_validacao');
  }
  if (category.tipo !== 'DESPESA') {
    throw new ErroApi('Só categorias de despesa aceitam orçamento!', 422, 'erro_validacao');
  }
  if (!cabeNaColunaValor(payload.limiteMensal) || payload.limiteMensal <= 0) {
    throw new ErroApi('Informe um limite maior que zero!', 422, 'erro_validacao');
  }

  const duplicated = orcamentos.some((item) => item.categoria.id === category.id && item.id !== currentId);
  if (duplicated) {
    throw new ErroApi(
      `Já existe um orçamento para ${category.nome}. Edite o limite existente em vez de criar outro!`,
      409,
      'conflito',
    );
  }

  return { categoria: category, limiteMensal: payload.limiteMensal };
}

export function criarOrcamento(payload: SalvarOrcamentoDTO): OrcamentoDTO {
  sequencia += 1;
  const created: OrcamentoDTO = { id: `bud-${sequencia}`, ...resolver(payload) };
  orcamentos.push(created);
  return created;
}

export function atualizarOrcamento(id: string, payload: SalvarOrcamentoDTO): OrcamentoDTO {
  const index = buscarIndiceOuFalhar(id);
  const updated: OrcamentoDTO = { id, ...resolver(payload, id) };
  orcamentos[index] = updated;
  return updated;
}

export function excluirOrcamento(id: string): void {
  orcamentos.splice(buscarIndiceOuFalhar(id), 1);
}
