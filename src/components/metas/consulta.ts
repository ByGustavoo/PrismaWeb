import { LOCALIDADE } from '@/constants/aplicacao';
import { rotuloSituacaoMeta, situacoesMeta } from '@/constants/metas';
import type { AcompanhamentoMetaDTO, Opcao } from '@/types';
import { normalizarBusca } from '@/utils/formatacao';

export const TODOS = 'all';

export type OrdenacaoMeta = 'recent' | 'drop' | 'rise' | 'price-desc' | 'price-asc' | 'name';

export interface ConsultaMeta {
  busca: string;
  situacao: string;
  ordenacao: OrdenacaoMeta;
}

export const consultaMetaVazia: ConsultaMeta = {
  busca: '',
  situacao: TODOS,
  ordenacao: 'recent',
};

export const opcoesSituacao: Opcao[] = [
  { valor: TODOS, rotulo: 'Todas as situações' },
  ...situacoesMeta.map((status) => ({ valor: status, rotulo: rotuloSituacaoMeta[status] })),
];

export const opcoesOrdenacao: Opcao[] = [
  { valor: 'recent', rotulo: 'Atualizadas recentemente' },
  { valor: 'drop', rotulo: 'Maior queda' },
  { valor: 'rise', rotulo: 'Maior aumento' },
  { valor: 'price-desc', rotulo: 'Preço: maior primeiro' },
  { valor: 'price-asc', rotulo: 'Preço: menor primeiro' },
  { valor: 'name', rotulo: 'Nome (A–Z)' },
];

export function temFiltrosMetaAtivos(query: ConsultaMeta): boolean {
  return query.busca.trim() !== '' || query.situacao !== TODOS || query.ordenacao !== consultaMetaVazia.ordenacao;
}

function comparar(a: AcompanhamentoMetaDTO, b: AcompanhamentoMetaDTO, sort: OrdenacaoMeta): number {
  switch (sort) {
    case 'drop':
      return a.analise.variacaoPercentual - b.analise.variacaoPercentual;
    case 'rise':
      return b.analise.variacaoPercentual - a.analise.variacaoPercentual;
    case 'price-desc':
      return b.analise.precoAtual - a.analise.precoAtual;
    case 'price-asc':
      return a.analise.precoAtual - b.analise.precoAtual;
    case 'name':
      return a.meta.nome.localeCompare(b.meta.nome, LOCALIDADE);
    default:
      return b.analise.ultimaAtualizacao.localeCompare(a.analise.ultimaAtualizacao);
  }
}

export function aplicarConsultaMeta(items: AcompanhamentoMetaDTO[], query: ConsultaMeta): AcompanhamentoMetaDTO[] {
  const needle = normalizarBusca(query.busca.trim());

  return items
    .filter((item) => {
      if (query.situacao !== TODOS && item.meta.situacao !== query.situacao) return false;
      if (!needle) return true;
      return normalizarBusca(item.meta.nome).includes(needle) || normalizarBusca(item.meta.observacoes ?? '').includes(needle);
    })
    .sort((a, b) => comparar(a, b, query.ordenacao));
}
