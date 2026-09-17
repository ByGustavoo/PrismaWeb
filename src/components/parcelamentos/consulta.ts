import type { Opcao, PlanoCompraParceladaDTO } from '@/types';

export type SituacaoCompraFiltro = 'TODAS' | 'EM_ANDAMENTO' | 'QUITADAS';

export type OrdenacaoCompra = 'recentes' | 'menos-restantes' | 'mais-restantes' | 'maior-restante';

export interface ConsultaCompra {
  situacao: SituacaoCompraFiltro;
  ordenacao: OrdenacaoCompra;
}

export const consultaCompraPadrao: ConsultaCompra = {
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
  return query.situacao !== consultaCompraPadrao.situacao || query.ordenacao !== consultaCompraPadrao.ordenacao;
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
  return plans
    .filter((plan) => {
      if (query.situacao === 'EM_ANDAMENTO') return !quitada(plan);
      if (query.situacao === 'QUITADAS') return quitada(plan);
      return true;
    })
    .sort((a, b) => comparar(a, b, query.ordenacao));
}
