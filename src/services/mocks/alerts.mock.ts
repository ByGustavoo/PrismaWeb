import { CARD_LIMIT_CRITICAL_RATIO } from '@/constants/cards';
import { transactionKindLabel } from '@/constants/transactions';
import { paths } from '@/routes/paths';
import type { Alert } from '@/types';
import { daysBetween, todayISO } from '@/utils/date';
import { formatDueLabel } from '@/utils/format';
import { buildInvoices, cardsNearLimit } from './cards.mock';
import { transactions } from './data';

/** Janela de antecedencia dos avisos de vencimento. */
const HORIZON_DAYS = 15;

function severityByDays(days: number): Alert['severity'] {
  if (days <= 2) return 'CRITICO';
  if (days <= 7) return 'ATENCAO';
  return 'INFO';
}


/**
 * Os avisos nao sao uma lista fixa: saem dos mesmos mocks que alimentam as
 * telas. Assim a lista muda junto com os dados e o painel ja exercita o formato
 * que o backend vai precisar devolver.
 */
export function buildAlerts(): Alert[] {
  const today = todayISO();
  const alerts: Alert[] = [];

  // Faturas em aberto ou fechadas dentro do horizonte.
  for (const invoice of buildInvoices()) {
    if (invoice.status === 'PAGA' || invoice.status === 'FUTURA') continue;
    const days = daysBetween(today, invoice.dueDate);
    if (days > HORIZON_DAYS) continue;

    alerts.push({
      id: `alert-invoice-${invoice.id}`,
      kind: 'FATURA_VENCENDO',
      severity: days < 0 ? 'CRITICO' : severityByDays(days),
      title: `Fatura ${invoice.cardName}`,
      description: `Fatura ${formatDueLabel(invoice.dueDate, today)}`,
      date: invoice.dueDate,
      amount: invoice.total,
      to: paths.invoices,
    });
  }

  // Contas pendentes e lancamentos agendados.
  for (const transaction of transactions) {
    if (transaction.status === 'PAGO') continue;
    const days = daysBetween(today, transaction.date);
    if (days > HORIZON_DAYS) continue;

    const pending = transaction.status === 'PENDENTE';
    alerts.push({
      id: `alert-tx-${transaction.id}`,
      kind: pending ? 'CONTA_VENCENDO' : 'LANCAMENTO_AGENDADO',
      severity: pending ? severityByDays(days) : 'INFO',
      title: transaction.description,
      description: pending
        ? `${transaction.category?.name ?? transactionKindLabel[transaction.kind]} · ${formatDueLabel(transaction.date, today)}`
        : `Agendado · ${formatDueLabel(transaction.date, today)}`,
      date: transaction.date,
      amount: transaction.amount,
      to: paths.transactions,
    });
  }

  // Cartoes perto do limite.
  for (const { card, used, ratio } of cardsNearLimit()) {
    alerts.push({
      id: `alert-card-${card.id}`,
      kind: 'LIMITE_CARTAO',
      severity: ratio >= CARD_LIMIT_CRITICAL_RATIO ? 'CRITICO' : 'ATENCAO',
      title: `${card.name} perto do limite`,
      description: `${Math.round(ratio * 100)}% do limite utilizado`,
      date: today,
      amount: card.limit - used,
      to: paths.cards,
    });
  }

  // Mais urgente primeiro; dentro da mesma urgencia, o que vence antes.
  const order: Record<Alert['severity'], number> = { CRITICO: 0, ATENCAO: 1, INFO: 2 };
  return alerts.sort((a, b) => order[a.severity] - order[b.severity] || a.date.localeCompare(b.date));
}
