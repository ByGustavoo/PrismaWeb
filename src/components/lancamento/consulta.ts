import type {
  DirecaoOrdenacao,
  FiltroLancamentoDTO,
  Opcao,
  OrdenacaoLancamento,
  SituacaoLancamento,
  TipoLancamento,
} from '@/types';
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

export const direcaoInicialOrdenacao: Record<OrdenacaoLancamento, DirecaoOrdenacao> = {
  DATA: 'DESC',
  DESCRICAO: 'ASC',
  VALOR: 'DESC',
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
  campoOrdenacao: OrdenacaoLancamento;
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
  campoOrdenacao: 'DATA',
  direcaoOrdenacao: 'DESC',
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

function resolverPeriodo(query: ConsultaLancamento): { from?: string; to?: string } {
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

const valorOuNada = (valor: string) => (valor === TODOS || valor === '' ? undefined : valor);

export function paraFiltroDoServidor(
  query: ConsultaLancamento,
  tipoDaTela: TipoLancamento | undefined,
  pagina: number,
  tamanho: number,
): FiltroLancamentoDTO {
  const { from, to } = resolverPeriodo(query);

  return {
    tipo: tipoDaTela ?? (valorOuNada(query.tipo) as TipoLancamento | undefined),
    busca: valorOuNada(query.busca.trim()),
    dataInicial: from,
    dataFinal: to,
    idCategoria: valorOuNada(query.idCategoria),
    idOrigem: valorOuNada(query.idOrigem),
    situacao: valorOuNada(query.situacao) as SituacaoLancamento | undefined,
    pagina,
    tamanho,
    ordenacao: query.campoOrdenacao,
    direcao: query.direcaoOrdenacao,
  };
}
