import type { Opcao, PlanoCompraParceladaDTO } from '@/types';
import { normalizarBusca } from '@/utils/formatacao';

export type SituacaoCompraFiltro = 'TODAS' | 'EM_ANDAMENTO' | 'QUITADAS';

export type OrdenacaoCompra = 'recentes' | 'menos-restantes' | 'mais-restantes' | 'maior-restante';

export interface ConsultaCompra {
  busca: string;
  situacao: SituacaoCompraFiltro;
  ordenacao: OrdenacaoCompra;
}

export const consultaCompraPadrao: ConsultaCompra = {
  busca: '',
  situacao: 'TODAS',
  ordenacao: 'recentes',
};

export const opcoesSituacaoCompra: Opcao[] = [
  { valor: 'TODAS', rotulo: 'Todas' },
  { valor: 'EM_ANDAMENTO', rotulo: 'Em andamento' },
  { valor: 'QUITADAS', rotulo: 'Quitadas' },
];

export const opcoesOrdenacaoCompra: Opcao[] = [
  { valor: 'recentes', rotulo: 'Mais recentes' },
  { valor: 'menos-restantes', rotulo: 'Menos parcelas restantes' },
  { valor: 'mais-restantes', rotulo: 'Mais parcelas restantes' },
  { valor: 'maior-restante', rotulo: 'Maior valor a pagar' },
];

export function temConsultaCompraAtiva(query: ConsultaCompra): boolean {
  return (
    query.busca.trim() !== '' ||
    query.situacao !== consultaCompraPadrao.situacao ||
    query.ordenacao !== consultaCompraPadrao.ordenacao
  );
}

export function rotuloResultadoCompras(query: ConsultaCompra, count: number): string {
  if (query.busca.trim() === '' && query.situacao === consultaCompraPadrao.situacao) return '';
  if (count === 0) return 'Nenhuma compra encontrada';
  return `${count} ${count === 1 ? 'compra encontrada' : 'compras encontradas'}`;
}

function correspondeBusca(plan: PlanoCompraParceladaDTO, needle: string): boolean {
  return [plan.compra.descricao, plan.compra.categoria?.nome ?? '', plan.compra.nomeCartao].some((text) =>
    normalizarBusca(text).includes(needle),
  );
}

function quitada(plan: PlanoCompraParceladaDTO): boolean {
  return plan.parcelasRestantes === 0;
}

function comparar(a: PlanoCompraParceladaDTO, b: PlanoCompraParceladaDTO, sort: OrdenacaoCompra): number {
  const settled = Number(quitada(a)) - Number(quitada(b));
  if (settled !== 0) return settled;

  switch (sort) {
    case 'menos-restantes':
      return a.parcelasRestantes - b.parcelasRestantes || a.valorRestante - b.valorRestante;
    case 'mais-restantes':
      return b.parcelasRestantes - a.parcelasRestantes || b.valorRestante - a.valorRestante;
    case 'maior-restante':
      return b.valorRestante - a.valorRestante;
    default:
      return b.compra.dataCompra.localeCompare(a.compra.dataCompra);
  }
}

export function aplicarConsultaCompra(plans: PlanoCompraParceladaDTO[], query: ConsultaCompra): PlanoCompraParceladaDTO[] {
  const needle = normalizarBusca(query.busca.trim());

  return plans
    .filter((plan) => {
      if (query.situacao === 'EM_ANDAMENTO' && quitada(plan)) return false;
      if (query.situacao === 'QUITADAS' && !quitada(plan)) return false;
      return !needle || correspondeBusca(plan, needle);
    })
    .sort((a, b) => comparar(a, b, query.ordenacao));
}
