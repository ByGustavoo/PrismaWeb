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
  SituacaoFatura,
} from '@/types';
import { fromMonthKey, monthKeyRange, monthsBetween, shiftMonthKey, todayISO } from '@/utils/date';
import { cards, currentMonth, installmentPurchases, transactions } from './data';

const HISTORY_MONTHS = 6;
const HORIZON_MONTHS = 6;

function money(value: number): number {
  return Math.round(value * 100) / 100;
}

function monthDiff(from: string, to: string): number {
  return monthsBetween(from, to) - 1;
}

function dayIn(monthKey: string, day: number): string {
  const start = fromMonthKey(monthKey);
  const lastDay = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
  return `${monthKey}-${String(Math.min(day, lastDay)).padStart(2, '0')}`;
}

function closingDateOf(card: Card, monthKey: string): string {
  return isCreditCard(card) ? dayIn(monthKey, card.closingDay) : monthKeyRange(monthKey).to;
}

function dueDateOf(card: Card, monthKey: string): string {
  if (!isCreditCard(card)) return monthKeyRange(monthKey).to;
  const month = card.dueDay <= card.closingDay ? shiftMonthKey(monthKey, 1) : monthKey;
  return dayIn(month, card.dueDay);
}

function invoiceId(cardId: string, monthKey: string): string {
  return `inv-${cardId}-${monthKey}`;
}

function installmentAmounts(purchase: InstallmentPurchase): number[] {
  const base = Math.floor((purchase.totalAmount * 100) / purchase.count) / 100;
  const amounts = Array.from({ length: purchase.count }, () => base);
  amounts[purchase.count - 1] = money(purchase.totalAmount - base * (purchase.count - 1));
  return amounts;
}

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
      status: dueDate < today ? 'PAGA' : 'FUTURA',
    };
  });

  const current = schedule.find((item) => item.status !== 'PAGA') ?? null;
  if (current) current.status = 'ATUAL';

  const paid = schedule.filter((item) => item.status === 'PAGA');
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

function purchaseItems(card: Card, monthKey: string): InvoiceItem[] {
  const closing = closingDateOf(card, monthKey);
  const previousClosing = closingDateOf(card, shiftMonthKey(monthKey, -1));

  return transactions
    .filter(
      (item) =>
        item.idOrigem === card.id &&
        item.tipo === 'DESPESA' &&
        item.data > previousClosing &&
        item.data <= closing,
    )
    .map((item) => ({
      id: `item-${item.id}`,
      description: item.descricao,
      date: item.data,
      amount: item.valor,
      category: item.categoria,
    }));
}

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

function invoiceStatus(closingDate: string, dueDate: string, isOpenCycle: boolean): SituacaoFatura {
  const today = todayISO();
  if (closingDate >= today) return isOpenCycle ? 'ABERTA' : 'FUTURA';
  return dueDate >= today ? 'FECHADA' : 'PAGA';
}

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

    const isOpenCycle = !openFound && closingDate >= todayISO();
    const status = invoiceStatus(closingDate, dueDate, isOpenCycle);
    if (status === 'ABERTA') openFound = true;

    if (items.length === 0 && (status === 'FUTURA' || status === 'PAGA')) continue;

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

export function installmentTotalIn(monthKey: string): number {
  return money(
    installmentPurchases.reduce((total, purchase) => {
      const index = monthDiff(purchase.firstMonth, monthKey);
      if (index < 0 || index >= purchase.count) return total;
      return total + (installmentAmounts(purchase)[index] ?? 0);
    }, 0),
  );
}

export function usedLimitOf(cardId: string): number {
  return money(
    buildInvoices(cardId)
      .filter((invoice) => invoice.status !== 'PAGA')
      .reduce((total, invoice) => total + invoice.total, 0),
  );
}

export function buildCards(): Card[] {
  return cards.map((card) => (isCreditCard(card) ? { ...card, used: usedLimitOf(card.id) } : { ...card }));
}

export function cardsNearLimit(): Array<{ card: CreditCard; used: number; ratio: number }> {
  return buildCards()
    .filter(isCreditCard)
    .map((card) => {
      const used = card.used ?? 0;
      return { card, used, ratio: used / card.limit };
    })
    .filter((entry) => entry.ratio >= CARD_LIMIT_WARNING_RATIO);
}
