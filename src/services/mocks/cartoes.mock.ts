import { PROPORCAO_ALERTA_LIMITE_CARTAO, ehCartaoCredito } from '@/constants/cartoes';
import type { CartaoCredito } from '@/constants/cartoes';
import type {
  CartaoDTO,
  CompraParceladaDTO,
  DetalheFaturaDTO,
  FaturaCartaoDTO,
  ItemFaturaDTO,
  ParcelaDTO,
  PlanoCompraParceladaDTO,
  SituacaoFatura,
} from '@/types';
import { deChaveMes, periodoDaChaveMes, mesesEntre, deslocarChaveMes, hojeISO } from '@/utils/data';
import { cartoes, mesAtual, comprasParceladas, lancamentos } from './dados';

const MESES_HISTORICO = 6;
const MESES_HORIZONTE = 6;

function dinheiro(value: number): number {
  return Math.round(value * 100) / 100;
}

function diferencaMeses(from: string, to: string): number {
  return mesesEntre(from, to) - 1;
}

function diaNoMes(monthKey: string, day: number): string {
  const start = deChaveMes(monthKey);
  const lastDay = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
  return `${monthKey}-${String(Math.min(day, lastDay)).padStart(2, '0')}`;
}

function dataFechamentoDe(card: CartaoDTO, monthKey: string): string {
  return ehCartaoCredito(card) ? diaNoMes(monthKey, card.diaFechamento) : periodoDaChaveMes(monthKey).to;
}

function dataVencimentoDe(card: CartaoDTO, monthKey: string): string {
  if (!ehCartaoCredito(card)) return periodoDaChaveMes(monthKey).to;
  const month = card.diaVencimento <= card.diaFechamento ? deslocarChaveMes(monthKey, 1) : monthKey;
  return diaNoMes(month, card.diaVencimento);
}

function idFatura(cardId: string, monthKey: string): string {
  return `inv-${cardId}-${monthKey}`;
}

function valoresParcelas(purchase: CompraParceladaDTO): number[] {
  const base = Math.floor((purchase.valorTotal * 100) / purchase.parcelas) / 100;
  const amounts = Array.from({ length: purchase.parcelas }, () => base);
  amounts[purchase.parcelas - 1] = dinheiro(purchase.valorTotal - base * (purchase.parcelas - 1));
  return amounts;
}

function mesDaParcela(purchase: CompraParceladaDTO, index: number): string {
  return deslocarChaveMes(purchase.primeiroMes, index);
}

export function montarPlanoCompraParcelada(purchase: CompraParceladaDTO): PlanoCompraParceladaDTO {
  const today = hojeISO();
  const card = cartoes.find((item) => item.id === purchase.idCartao);
  const amounts = valoresParcelas(purchase);

  const schedule: ParcelaDTO[] = amounts.map((amount, index) => {
    const month = mesDaParcela(purchase, index);
    const dueDate = card ? dataVencimentoDe(card, month) : periodoDaChaveMes(month).to;

    return {
      numero: index + 1,
      mes: month,
      dataVencimento: dueDate,
      valor: amount,
      situacao: dueDate < today ? 'PAGA' : 'FUTURA',
    };
  });

  const current = schedule.find((item) => item.situacao !== 'PAGA') ?? null;
  if (current) current.situacao = 'ATUAL';

  const paid = schedule.filter((item) => item.situacao === 'PAGA');
  const paidAmount = dinheiro(paid.reduce((total, item) => total + item.valor, 0));

  return {
    compra: purchase,
    valorParcela: amounts[0] ?? 0,
    parcelasPagas: paid.length,
    parcelasRestantes: purchase.parcelas - paid.length,
    valorPago: paidAmount,
    valorRestante: dinheiro(purchase.valorTotal - paidAmount),
    parcelaAtual: current,
    cronograma: schedule,
  };
}

export function montarPlanosComprasParceladas(cardId?: string): PlanoCompraParceladaDTO[] {
  return comprasParceladas
    .filter((purchase) => (cardId ? purchase.idCartao === cardId : true))
    .map(montarPlanoCompraParcelada)
    .sort((a, b) => {
      const settled = Number(a.parcelasRestantes === 0) - Number(b.parcelasRestantes === 0);
      if (settled !== 0) return settled;
      return a.compra.dataCompra.localeCompare(b.compra.dataCompra) * -1;
    });
}

function itensDeCompras(card: CartaoDTO, monthKey: string): ItemFaturaDTO[] {
  const closing = dataFechamentoDe(card, monthKey);
  const previousClosing = dataFechamentoDe(card, deslocarChaveMes(monthKey, -1));

  return lancamentos
    .filter(
      (item) =>
        item.idOrigem === card.id &&
        item.tipo === 'DESPESA' &&
        item.data > previousClosing &&
        item.data <= closing,
    )
    .map((item) => ({
      id: `item-${item.id}`,
      descricao: item.descricao,
      data: item.data,
      valor: item.valor,
      categoria: item.categoria,
    }));
}

function itensDeParcelas(card: CartaoDTO, monthKey: string): ItemFaturaDTO[] {
  const items: ItemFaturaDTO[] = [];

  for (const purchase of comprasParceladas) {
    if (purchase.idCartao !== card.id) continue;

    const index = diferencaMeses(purchase.primeiroMes, monthKey);
    if (index < 0 || index >= purchase.parcelas) continue;

    const amount = valoresParcelas(purchase)[index];
    if (amount === undefined) continue;

    items.push({
      id: `item-${purchase.id}-${index + 1}`,
      descricao: purchase.descricao,
      data: purchase.dataCompra,
      valor: amount,
      categoria: purchase.categoria,
      parcela: { numero: index + 1, total: purchase.parcelas, idCompra: purchase.id },
    });
  }

  return items;
}

function itensDaFatura(card: CartaoDTO, monthKey: string): ItemFaturaDTO[] {
  return [...itensDeCompras(card, monthKey), ...itensDeParcelas(card, monthKey)].sort(
    (a, b) => a.data.localeCompare(b.data) || a.descricao.localeCompare(b.descricao),
  );
}

function situacaoDaFatura(closingDate: string, dueDate: string, isOpenCycle: boolean): SituacaoFatura {
  const today = hojeISO();
  if (closingDate >= today) return isOpenCycle ? 'ABERTA' : 'FUTURA';
  return dueDate >= today ? 'FECHADA' : 'PAGA';
}

function horizonteDe(card: CartaoDTO): number {
  const furthest = comprasParceladas
    .filter((purchase) => purchase.idCartao === card.id)
    .reduce((max, purchase) => {
      const lastMonth = mesDaParcela(purchase, purchase.parcelas - 1);
      return Math.max(max, diferencaMeses(mesAtual, lastMonth));
    }, 0);

  return Math.max(MESES_HORIZONTE, furthest);
}

function montarFaturasDoCartao(card: CartaoDTO): FaturaCartaoDTO[] {
  if (!ehCartaoCredito(card)) return [];

  const horizon = horizonteDe(card);
  const invoices: FaturaCartaoDTO[] = [];
  let openFound = false;

  for (let offset = -MESES_HISTORICO; offset <= horizon; offset += 1) {
    const month = deslocarChaveMes(mesAtual, offset);
    const closingDate = dataFechamentoDe(card, month);
    const dueDate = dataVencimentoDe(card, month);
    const items = itensDaFatura(card, month);

    const isOpenCycle = !openFound && closingDate >= hojeISO();
    const status = situacaoDaFatura(closingDate, dueDate, isOpenCycle);
    if (status === 'ABERTA') openFound = true;

    if (items.length === 0 && (status === 'FUTURA' || status === 'PAGA')) continue;

    const previous = invoices[invoices.length - 1];

    invoices.push({
      id: idFatura(card.id, month),
      idCartao: card.id,
      nomeCartao: card.nome,
      mes: month,
      total: dinheiro(items.reduce((sum, item) => sum + item.valor, 0)),
      situacao: status,
      dataFechamento: closingDate,
      dataVencimento: dueDate,
      quantidadeItens: items.length,
      ...(previous ? { totalAnterior: previous.total } : {}),
    });
  }

  return invoices;
}

export function montarFaturas(cardId?: string): FaturaCartaoDTO[] {
  return cartoes
    .filter((card) => (cardId ? card.id === cardId : true))
    .flatMap(montarFaturasDoCartao)
    .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento) || a.nomeCartao.localeCompare(b.nomeCartao));
}

export function montarDetalheFatura(id: string): DetalheFaturaDTO | undefined {
  const invoice = montarFaturas().find((item) => item.id === id);
  if (!invoice) return undefined;

  const card = cartoes.find((item) => item.id === invoice.idCartao);
  if (!card) return undefined;

  return { ...invoice, itens: itensDaFatura(card, invoice.mes) };
}

export function totalParcelasEm(monthKey: string): number {
  return dinheiro(
    comprasParceladas.reduce((total, purchase) => {
      const index = diferencaMeses(purchase.primeiroMes, monthKey);
      if (index < 0 || index >= purchase.parcelas) return total;
      return total + (valoresParcelas(purchase)[index] ?? 0);
    }, 0),
  );
}

export function limiteComprometidoDe(cardId: string): number {
  return dinheiro(
    montarFaturas(cardId)
      .filter((invoice) => invoice.situacao !== 'PAGA')
      .reduce((total, invoice) => total + invoice.total, 0),
  );
}

export function montarCartoes(): CartaoDTO[] {
  return cartoes.map((card) => (ehCartaoCredito(card) ? { ...card, limiteComprometido: limiteComprometidoDe(card.id) } : { ...card }));
}

export function cartoesPertoDoLimite(): Array<{ card: CartaoCredito; used: number; ratio: number }> {
  return montarCartoes()
    .filter(ehCartaoCredito)
    .map((card) => {
      const used = card.limiteComprometido ?? 0;
      return { card, used, ratio: used / card.limiteCredito };
    })
    .filter((entry) => entry.ratio >= PROPORCAO_ALERTA_LIMITE_CARTAO);
}
