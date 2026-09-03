import { ArrowRight, ChevronRight } from 'lucide-react';
import { Amount } from '@/components/common';
import { Badge, Button } from '@/components/ui';
import { invoiceStatusTone } from '@/components/cards';
import { invoiceStatusLabel } from '@/constants/cards';
import type { Invoice } from '@/types';
import { capitalize, formatDueLabel, formatFullDate, formatMonthLabel, formatShortDate } from '@/utils/format';
import styles from './InvoiceEntry.module.css';

interface InvoiceEntryProps {
  invoice: Invoice;
  onOpen: (invoice: Invoice) => void;
}

function itemsLabel(count: number): string {
  return `${count} ${count === 1 ? 'compra' : 'compras'}`;
}

/**
 * A fatura do ciclo em curso, em destaque. Ela e a unica que pede uma decisao
 * agora, entao ganha o valor grande, as duas datas por extenso e a distancia ate
 * o vencimento em palavras — uma data sozinha obriga quem le a fazer a conta.
 */
export function InvoiceHighlight({ invoice, onOpen }: InvoiceEntryProps) {
  const empty = invoice.itemCount === 0;

  return (
    <article className={styles.highlight}>
      <header className={styles.highlightHeader}>
        <span className={styles.cardName}>{invoice.cardName}</span>
        <Badge tone={invoiceStatusTone[invoice.status]} dot>
          {invoiceStatusLabel[invoice.status]}
        </Badge>
      </header>

      <h3 className={styles.month}>{capitalize(formatMonthLabel(invoice.month))}</h3>

      <Amount value={invoice.total} size="lg" />
      <span className={styles.items}>{empty ? 'Nenhuma compra ainda' : itemsLabel(invoice.itemCount)}</span>

      <dl className={styles.dates}>
        <div className={styles.date}>
          <dt>Fechamento</dt>
          <dd>{formatFullDate(invoice.closingDate)}</dd>
        </div>
        <div className={styles.date}>
          <dt>Vencimento</dt>
          <dd>{formatFullDate(invoice.dueDate)}</dd>
        </div>
      </dl>

      <footer className={styles.highlightFooter}>
        <span className={styles.due}>{capitalize(formatDueLabel(invoice.dueDate))}</span>
        <Button
          variant="secondary"
          size="sm"
          icon={ArrowRight}
          iconPosition="right"
          disabled={empty}
          onClick={() => onOpen(invoice)}
        >
          Ver compras
        </Button>
      </footer>
    </article>
  );
}

/**
 * Fatura futura ou ja encerrada. Sao muitas linhas e nenhuma exige acao, entao
 * elas ficam compactas: mes, cartao, as duas datas em forma curta, o valor e a
 * situacao. A linha inteira e um botao, para abrir as compras num toque.
 */
export function InvoiceRow({ invoice, onOpen }: InvoiceEntryProps) {
  return (
    <li>
      <button type="button" className={styles.row} onClick={() => onOpen(invoice)}>
        <span className={styles.rowIdentity}>
          <span className={styles.rowMonth}>{capitalize(formatMonthLabel(invoice.month))}</span>
          <span className={styles.rowCard}>
            {invoice.cardName}
            <span className={styles.separator} aria-hidden="true">
              ·
            </span>
            {itemsLabel(invoice.itemCount)}
          </span>
        </span>

        <span className={styles.rowDates}>
          <span>
            Fecha <span className="tabular">{formatShortDate(invoice.closingDate)}</span>
          </span>
          <span>
            Vence <span className="tabular">{formatShortDate(invoice.dueDate)}</span>
          </span>
        </span>

        <span className={styles.rowValue}>
          <Amount value={invoice.total} size="sm" />
        </span>

        <span className={styles.rowStatus}>
          <Badge tone={invoiceStatusTone[invoice.status]} dot>
            {invoiceStatusLabel[invoice.status]}
          </Badge>
        </span>

        <ChevronRight className={styles.chevron} size={16} strokeWidth={2} aria-hidden="true" />
      </button>
    </li>
  );
}
