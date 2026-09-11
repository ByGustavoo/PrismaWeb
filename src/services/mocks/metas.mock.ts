import { TOLERANCIA_EXTREMOS_META, LIMIAR_ESTABILIDADE_META } from '@/constants/metas';
import type {
  AcompanhamentoMetaDTO,
  AnaliseMetaDTO,
  LeituraMeta,
  MetaDTO,
  MetaPrecoDTO,
  ResumoMetasDTO,
  SituacaoMeta,
  Tendencia,
} from '@/types';
import { normalizarBusca } from '@/utils/formatacao';
import { metas } from './dados';

function dinheiro(value: number): number {
  return Math.round(value * 100) / 100;
}

function ordenado(goal: MetaDTO): MetaPrecoDTO[] {
  return [...goal.historico].sort((a, b) => a.data.localeCompare(b.data));
}

function leituraDe(
  current: number,
  lowest: number,
  highest: number,
  average: number,
  entryCount: number,
): LeituraMeta {
  if (entryCount < 2) return 'PRIMEIRO';

  const span = highest - lowest;
  if (span < 0.01) return 'ESTAVEL';

  const position = (current - lowest) / span;
  if (position <= TOLERANCIA_EXTREMOS_META) return 'MENOR';
  if (position >= 1 - TOLERANCIA_EXTREMOS_META) return 'MAIOR';

  return current < average ? 'ABAIXO_DA_MEDIA' : 'ACIMA_DA_MEDIA';
}

function tendenciaDe(change: number, initial: number): Tendencia {
  if (initial <= 0) return 'ESTAVEL';
  if (Math.abs(change / initial) <= LIMIAR_ESTABILIDADE_META) return 'ESTAVEL';
  return change > 0 ? 'ALTA' : 'BAIXA';
}

export function analisarMeta(goal: MetaDTO): AnaliseMetaDTO {
  const history = ordenado(goal);
  const first = history[0];
  const last = history[history.length - 1];

  if (!first || !last) {
    return {
      precoInicial: 0,
      precoAtual: 0,
      menorPreco: 0,
      maiorPreco: 0,
      precoMedio: 0,
      variacao: 0,
      variacaoPercentual: 0,
      tendencia: 'ESTAVEL',
      economia: 0,
      ultimaAtualizacao: goal.dataCriacao,
      quantidadeRegistros: 0,
      leitura: 'ESTAVEL',
    };
  }

  const prices = history.map((entry) => entry.preco);
  const initialPrice = first.preco;
  const currentPrice = last.preco;
  const lowestPrice = dinheiro(Math.min(...prices));
  const highestPrice = dinheiro(Math.max(...prices));
  const averagePrice = dinheiro(prices.reduce((total, price) => total + price, 0) / prices.length);
  const change = dinheiro(currentPrice - initialPrice);

  return {
    precoInicial: initialPrice,
    precoAtual: currentPrice,
    menorPreco: lowestPrice,
    maiorPreco: highestPrice,
    precoMedio: averagePrice,
    variacao: change,
    variacaoPercentual: initialPrice > 0 ? (change / initialPrice) * 100 : 0,
    tendencia: tendenciaDe(change, initialPrice),
    economia: dinheiro(Math.max(highestPrice - currentPrice, 0)),
    ultimaAtualizacao: last.data,
    quantidadeRegistros: history.length,
    leitura: leituraDe(currentPrice, lowestPrice, highestPrice, averagePrice, history.length),
  };
}

export function montarAcompanhamentoMeta(goal: MetaDTO): AcompanhamentoMetaDTO {
  return { meta: { ...goal, historico: ordenado(goal) }, analise: analisarMeta(goal) };
}

export interface FiltroMeta {
  situacao?: SituacaoMeta;
  busca?: string;
}

function corresponde(goal: MetaDTO, filters: FiltroMeta): boolean {
  if (filters.situacao && goal.situacao !== filters.situacao) return false;

  const term = filters.busca?.trim();
  if (!term) return true;

  const needle = normalizarBusca(term);
  return normalizarBusca(goal.nome).includes(needle) || normalizarBusca(goal.observacoes ?? '').includes(needle);
}

export function montarResumoMetas(filters: FiltroMeta = {}): ResumoMetasDTO {
  const items = metas
    .filter((goal) => corresponde(goal, filters))
    .map(montarAcompanhamentoMeta)
    .sort((a, b) => b.analise.ultimaAtualizacao.localeCompare(a.analise.ultimaAtualizacao));

  const tracking = items.filter((item) => item.meta.situacao === 'ACOMPANHANDO');
  const currentTotal = dinheiro(tracking.reduce((total, item) => total + item.analise.precoAtual, 0));
  const initialTotal = dinheiro(tracking.reduce((total, item) => total + item.analise.precoInicial, 0));

  return {
    itens: items,
    quantidadeAcompanhando: tracking.length,
    quantidadeCompradas: items.filter((item) => item.meta.situacao === 'COMPRADA').length,
    totalAtual: currentTotal,
    totalInicial: initialTotal,
    variacaoTotal: dinheiro(currentTotal - initialTotal),
    economiaTotal: dinheiro(tracking.reduce((total, item) => total + item.analise.economia, 0)),
  };
}
