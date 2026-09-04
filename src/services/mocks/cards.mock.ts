import { CARD_LIMIT_WARNING_RATIO, isCreditCard } from '@/constants/cards';
import type { CreditCard } from '@/constants/cards';
import type {
  Card,
  Installment,
  InstallmentPlan,
  InstallmentPurchase,
  Invoice,
  InvoiceDetail,
  InvoiceItem,
  InvoiceStatus,
} from '@/types';
import { fromMonthKey, monthKeyRange, monthsBetween, shiftMonthKey, todayISO } from '@/utils/date';
import { cards, currentMonth, installmentPurchases, transactions } from './data';

/**
 * Faturas e parcelamentos nao sao uma lista escrita a mao: eles saem das compras
 * do cartao e das compras parceladas, do mesmo jeito que os avisos saem dos
 * lancamentos. Assim uma compra cadastrada agora aparece na fatura do mes, no
 * limite comprometido do cartao e no cronograma de parcelas sem nenhum ajuste
 * manual — e o formato calculado aqui e exatamente o que o backend vai devolver.
 */

/** Meses de historico e de projecao gerados alem do que as parcelas exigem. */
const HISTORY_MONTHS = 6;
const HORIZON_MONTHS = 6;

function money(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Diferenca em meses com sinal: ("2026-09", "2026-07") -> -2. */
function monthDiff(from: string, to: string): number {
  return monthsBetween(from, to) - 1;
}

/**
 * Data ISO do dia `day` no mes indicado. Dia 31 num mes de 30 cai no ultimo dia,
 * como fazem as operadoras: uma fatura nao deixa de fechar porque fevereiro e
 * curto.
 */
function dayIn(monthKey: string, day: number): string {
  const start = fromMonthKey(monthKey);
  const lastDay = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
  return `${monthKey}-${String(Math.min(day, lastDay)).padStart(2, '0')}`;
}

function closingDateOf(card: Card, monthKey: string): string {
  return isCreditCard(card) ? dayIn(monthKey, card.closingDay) : monthKeyRange(monthKey).to;
}

/**
 * Vencimento da fatura do mes. Quando o dia de vencimento e anterior ou igual ao
 * de fechamento, ele so pode ser no mes seguinte — e o arranjo usual: fecha dia
 * 28, vence dia 8.
 */
function dueDateOf(card: Card, monthKey: string): string {
  if (!isCreditCard(card)) return monthKeyRange(monthKey).to;
  const month = card.dueDay <= card.closingDay ? shiftMonthKey(monthKey, 1) : monthKey;
  return dayIn(month, card.dueDay);
}

function invoiceId(cardId: string, monthKey: string): string {
  return `inv-${cardId}-${monthKey}`;
}

/* -------------------------------------------------------------------------- */
/* Compras parceladas                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Valor de cada parcela. As primeiras levam o valor arredondado para baixo e a
 * ultima absorve a sobra, para que a soma feche exatamente com o total da
 * compra: 3x de R$ 1.000,00 nao pode virar R$ 999,99.
 */
function installmentAmounts(purchase: InstallmentPurchase): number[] {
  const base = Math.floor((purchase.totalAmount * 100) / purchase.count) / 100;
  const amounts = Array.from({ length: purchase.count }, () => base);
  amounts[purchase.count - 1] = money(purchase.totalAmount - base * (purchase.count - 1));
  return amounts;
}

/** Mes da fatura em que a parcela `index` (base zero) cai. */
function installmentMonth(purchase: InstallmentPurchase, index: number): string {
  return shiftMonthKey(purchase.firstMonth, index);
}

export function buildInstallmentPlan(purchase: InstallmentPurchase): InstallmentPlan {
  const today = todayISO();
  const card = cards.find((item) => item.id === purchase.cardId);
  const amounts = installmentAmounts(purchase);

  const schedule: Installment[] = amounts.map((amount, index) => {
    const month = installmentMonth(purchase, index);
    const dueDate = card ? dueDateOf(card, month) : monthKeyRange(month).to;

    return {
      number: index + 1,
      month,
      dueDate,
      amount,
      // A parcela deixa de ser cobranca futura quando a fatura dela vence: e o
      // unico marco que o mock conhece, ja que nao ha registro de pagamento.
      status: dueDate < today ? 'paid' : 'upcoming',
    };
  });

  // A primeira ainda nao vencida e a que esta em curso; as demais seguem futuras.
  const current = schedule.find((item) => item.status !== 'paid') ?? null;
  if (current) current.status = 'current';

  const paid = schedule.filter((item) => item.status === 'paid');
  const paidAmount = money(paid.reduce((total, item) => total + item.amount, 0));

  return {
    purchase,
    installmentAmount: amounts[0] ?? 0,
    paidCount: paid.length,
    remainingCount: purchase.count - paid.length,
    paidAmount,
    remainingAmount: money(purchase.totalAmount - paidAmount),
    current,
    schedule,
  };
}

/** Compras parceladas em curso primeiro; entre elas, a que termina antes. */
export function buildInstallmentPlans(cardId?: string): InstallmentPlan[] {
  return installmentPurchases
    .filter((purchase) => (cardId ? purchase.cardId === cardId : true))
    .map(buildInstallmentPlan)
    .sort((a, b) => {
      const settled = Number(a.remainingCount === 0) - Number(b.remainingCount === 0);
      if (settled !== 0) return settled;
      return a.purchase.purchaseDate.localeCompare(b.purchase.purchaseDate) * -1;
    });
}

/* -------------------------------------------------------------------------- */
/* Faturas                                                                    */
/* -------------------------------------------------------------------------- */

/** Compras avulsas do ciclo: depois do fechamento anterior, ate o deste mes. */
function purchaseItems(card: Card, monthKey: string): InvoiceItem[] {
  const closing = closingDateOf(card, monthKey);
  const previousClosing = closingDateOf(card, shiftMonthKey(monthKey, -1));

  return transactions
    .filter(
      (item) =>
        item.accountId === card.id &&
        item.kind === 'expense' &&
        item.date > previousClosing &&
        item.date <= closing,
    )
    .map((item) => ({
      id: `item-${item.id}`,
      description: item.description,
      date: item.date,
      amount: item.amount,
      category: item.category,
    }));
}

/** Parcelas que caem na fatura deste mes. */
function installmentItems(card: Card, monthKey: string): InvoiceItem[] {
  const items: InvoiceItem[] = [];

  for (const purchase of installmentPurchases) {
    if (purchase.cardId !== card.id) continue;

    const index = monthDiff(purchase.firstMonth, monthKey);
    if (index < 0 || index >= purchase.count) continue;

    const amount = installmentAmounts(purchase)[index];
    if (amount === undefined) continue;

    items.push({
      id: `item-${purchase.id}-${index + 1}`,
      // A data e a da compra, nao a do mes da parcela: e ela que o extrato
      // mostra, e o selo "3/10" ao lado ja explica por que a data e antiga.
      description: purchase.description,
      date: purchase.purchaseDate,
      amount,
      category: purchase.category,
      installment: { number: index + 1, total: purchase.count, purchaseId: purchase.id },
    });
  }

  return items;
}

function invoiceItems(card: Card, monthKey: string): InvoiceItem[] {
  return [...purchaseItems(card, monthKey), ...installmentItems(card, monthKey)].sort(
    (a, b) => a.date.localeCompare(b.date) || a.description.localeCompare(b.description),
  );
}

/**
 * Situacao da fatura a partir das datas. O mock nao registra pagamento, entao
 * fatura vencida e tratada como paga — o que interessa exercitar na tela e a
 * distincao entre o ciclo aberto, o fechado a pagar e o encerrado.
 */
function invoiceStatus(closingDate: string, dueDate: string, isOpenCycle: boolean): InvoiceStatus {
  const today = todayISO();
  if (closingDate >= today) return isOpenCycle ? 'open' : 'future';
  return dueDate >= today ? 'closed' : 'paid';
}

/** Ate onde as faturas vao: o horizonte fixo ou a ultima parcela, o que for maior. */
function horizonFor(card: Card): number {
  const furthest = installmentPurchases
    .filter((purchase) => purchase.cardId === card.id)
    .reduce((max, purchase) => {
      const lastMonth = installmentMonth(purchase, purchase.count - 1);
      return Math.max(max, monthDiff(currentMonth, lastMonth));
    }, 0);

  return Math.max(HORIZON_MONTHS, furthest);
}

function buildCardInvoices(card: Card): Invoice[] {
  if (!isCreditCard(card)) return [];

  const horizon = horizonFor(card);
  const invoices: Invoice[] = [];
  let openFound = false;

  for (let offset = -HISTORY_MONTHS; offset <= horizon; offset += 1) {
    const month = shiftMonthKey(currentMonth, offset);
    const closingDate = closingDateOf(card, month);
    const dueDate = dueDateOf(card, month);
    const items = invoiceItems(card, month);

    // O ciclo aberto e o primeiro que ainda nao fechou; os seguintes sao previstos.
    const isOpenCycle = !openFound && closingDate >= todayISO();
    const status = invoiceStatus(closingDate, dueDate, isOpenCycle);
    if (status === 'open') openFound = true;

    // Fatura futura sem nada dentro nao existe: so polui a lista com zeros.
    if (items.length === 0 && (status === 'future' || status === 'paid')) continue;

    // A anterior e a ultima que entrou na lista, e nao a do mes -1: um mes sem
    // compra nenhuma nao vira fatura, e comparar com um buraco nao diz nada.
    const previous = invoices[invoices.length - 1];

    invoices.push({
      id: invoiceId(card.id, month),
      cardId: card.id,
      cardName: card.name,
      month,
      total: money(items.reduce((sum, item) => sum + item.amount, 0)),
      status,
      closingDate,
      dueDate,
      itemCount: items.length,
      ...(previous ? { previousTotal: previous.total } : {}),
    });
  }

  return invoices;
}

/** Todas as faturas, da mais proxima do vencimento para a mais distante. */
export function buildInvoices(cardId?: string): Invoice[] {
  return cards
    .filter((card) => (cardId ? card.id === cardId : true))
    .flatMap(buildCardInvoices)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.cardName.localeCompare(b.cardName));
}

export function buildInvoiceDetail(id: string): InvoiceDetail | undefined {
  const invoice = buildInvoices().find((item) => item.id === id);
  if (!invoice) return undefined;

  const card = cards.find((item) => item.id === invoice.cardId);
  if (!card) return undefined;

  return { ...invoice, items: invoiceItems(card, invoice.month) };
}

/**
 * Soma das parcelas que caem nas faturas de um mes, de todos os cartoes. E o
 * que a previsao financeira precisa saber: uma compra em doze vezes ja e uma
 * despesa assumida dos proximos doze meses, mesmo sem lancamento nenhum.
 */
export function installmentTotalIn(monthKey: string): number {
  return money(
    installmentPurchases.reduce((total, purchase) => {
      const index = monthDiff(purchase.firstMonth, monthKey);
      if (index < 0 || index >= purchase.count) return total;
      return total + (installmentAmounts(purchase)[index] ?? 0);
    }, 0),
  );
}

/* -------------------------------------------------------------------------- */
/* Cartoes                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Limite comprometido: tudo que ainda nao foi pago, incluindo as parcelas que so
 * vao cair nos proximos meses. E o numero que responde "quanto ainda posso
 * gastar" — somar apenas a fatura aberta esconderia doze parcelas ja assumidas.
 */
export function usedLimitOf(cardId: string): number {
  return money(
    buildInvoices(cardId)
      .filter((invoice) => invoice.status !== 'paid')
      .reduce((total, invoice) => total + invoice.total, 0),
  );
}

/** Cartoes com o limite comprometido ja calculado, do jeito que a API devolveria. */
export function buildCards(): Card[] {
  return cards.map((card) => (isCreditCard(card) ? { ...card, used: usedLimitOf(card.id) } : { ...card }));
}

/** Cartoes de credito acima da faixa de atencao, para o painel de avisos. */
export function cardsNearLimit(): Array<{ card: CreditCard; used: number; ratio: number }> {
  return buildCards()
    .filter(isCreditCard)
    .map((card) => {
      const used = card.used ?? 0;
      return { card, used, ratio: used / card.limit };
    })
    .filter((entry) => entry.ratio >= CARD_LIMIT_WARNING_RATIO);
}
