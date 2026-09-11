import { LOCALIDADE } from '@/constants/aplicacao';
import { rotuloSituacaoLancamento } from '@/constants/lancamentos';
import type { LancamentoDTO, Opcao } from '@/types';
import { periodoUltimosDias, periodoDoMes, periodoDoAno } from '@/utils/data';

export const TODOS = 'all';

export type AtalhoPeriodo =
  | typeof TODOS
  | 'this-month'
  | 'last-month'
  | 'last-30'
  | 'last-90'
  | 'this-year'
  | 'custom';

export type DirecaoOrdenacao = 'asc' | 'desc';
export type CampoOrdenacao = 'date' | 'description' | 'amount';

export const direcaoInicialOrdenacao: Record<CampoOrdenacao, DirecaoOrdenacao> = {
  date: 'desc',
  description: 'asc',
  amount: 'desc',
};

export interface ConsultaLancamento {
  busca: string;
  periodo: AtalhoPeriodo;
  dataInicial: string;
  dataFinal: string;
  tipo: string;
  idCategoria: string;
  idOrigem: string;
  situacao: string;
  campoOrdenacao: CampoOrdenacao;
  direcaoOrdenacao: DirecaoOrdenacao;
}

export const consultaVazia: ConsultaLancamento = {
  busca: '',
  periodo: TODOS,
  dataInicial: '',
  dataFinal: '',
  tipo: TODOS,
  idCategoria: TODOS,
  idOrigem: TODOS,
  situacao: TODOS,
  campoOrdenacao: 'date',
  direcaoOrdenacao: 'desc',
};

export const opcoesPeriodo: Opcao[] = [
  { valor: TODOS, rotulo: 'Todo o período' },
  { valor: 'this-month', rotulo: 'Este mês' },
  { valor: 'last-month', rotulo: 'Mês passado' },
  { valor: 'last-30', rotulo: 'Últimos 30 dias' },
  { valor: 'last-90', rotulo: 'Últimos 90 dias' },
  { valor: 'this-year', rotulo: 'Este ano' },
  { valor: 'custom', rotulo: 'Período personalizado' },
];

export function resolverPeriodo(query: ConsultaLancamento): { from?: string; to?: string } {
  switch (query.periodo) {
    case 'this-month':
      return periodoDoMes(0);
    case 'last-month':
      return periodoDoMes(-1);
    case 'last-30':
      return periodoUltimosDias(30);
    case 'last-90':
      return periodoUltimosDias(90);
    case 'this-year':
      return periodoDoAno();
    case 'custom':
      return {
        ...(query.dataInicial ? { from: query.dataInicial } : {}),
        ...(query.dataFinal ? { to: query.dataFinal } : {}),
      };
    default:
      return {};
  }
}

export function temFiltrosAtivos(query: ConsultaLancamento): boolean {
  return (
    query.busca.trim() !== '' ||
    query.periodo !== TODOS ||
    query.tipo !== TODOS ||
    query.idCategoria !== TODOS ||
    query.idOrigem !== TODOS ||
    query.situacao !== TODOS
  );
}

function correspondeBusca(item: LancamentoDTO, term: string): boolean {
  if (!term) return true;
  return (
    item.descricao.toLowerCase().includes(term) ||
    (item.observacoes?.toLowerCase().includes(term) ?? false) ||
    (item.categoria?.nome.toLowerCase().includes(term) ?? false) ||
    item.nomeOrigem.toLowerCase().includes(term) ||
    (item.nomeContaDestino?.toLowerCase().includes(term) ?? false) ||
    rotuloSituacaoLancamento[item.situacao].toLowerCase().includes(term)
  );
}

function comparar(a: LancamentoDTO, b: LancamentoDTO, field: CampoOrdenacao): number {
  switch (field) {
    case 'amount':
      return a.valor - b.valor;
    case 'description':
      return a.descricao.localeCompare(b.descricao, LOCALIDADE);
    default:
      return a.data.localeCompare(b.data) || a.descricao.localeCompare(b.descricao, LOCALIDADE);
  }
}

export function aplicarConsulta(list: LancamentoDTO[], query: ConsultaLancamento): LancamentoDTO[] {
  const term = query.busca.trim().toLowerCase();
  const { from, to } = resolverPeriodo(query);

  const filtered = list.filter((item) => {
    if (query.tipo !== TODOS && item.tipo !== query.tipo) return false;
    if (query.situacao !== TODOS && item.situacao !== query.situacao) return false;
    if (query.idCategoria !== TODOS && item.categoria?.id !== query.idCategoria) return false;
    if (from && item.data < from) return false;
    if (to && item.data > to) return false;

    if (query.idOrigem !== TODOS && item.idOrigem !== query.idOrigem && item.idContaDestino !== query.idOrigem) {
      return false;
    }

    return correspondeBusca(item, term);
  });

  const direction = query.direcaoOrdenacao === 'asc' ? 1 : -1;
  return filtered.sort((a, b) => comparar(a, b, query.campoOrdenacao) * direction);
}

export function totalLiquido(list: LancamentoDTO[]): number {
  return list.reduce((sum, item) => {
    if (item.tipo === 'RECEITA') return sum + item.valor;
    if (item.tipo === 'DESPESA') return sum - item.valor;
    return sum;
  }, 0);
}
