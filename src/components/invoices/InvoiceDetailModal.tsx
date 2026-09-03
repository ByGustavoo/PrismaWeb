import { useCallback } from 'react';
import { Receipt } from 'lucide-react';
import { invoiceStatusTone } from '@/components/cards';
import { Amount } from '@/components/common';
import { Badge, Button, EmptyState, LoadingBlock, Modal } from '@/components/ui';
import { invoiceStatusLabel } from '@/constants/cards';
import { useAsyncData } from '@/hooks/useAsyncData';
import { cardsService } from '@/services';
import type { Invoice } from '@/types';
import { capitalize, formatFullDate, formatMonthLabel, formatShortDate } from '@/utils/format';
import styles from './InvoiceDetailModal.module.css';

interface InvoiceDetailModalProps {
  /** A fatura escolhida na lista; `null` mantem o modal fechado. */
  invoice: Invoice | null;
  onClose: () => void;
}

/**
 * As compras de uma fatura. O cabecalho vem do resumo que a lista ja tem, entao
 * ele aparece cheio no primeiro quadro; so os itens esperam a resposta. Assim o
 * modal nunca abre como uma caixa vazia carregando.
 */
export function InvoiceDetailModal({ invoice, onClose }: InvoiceDetailModalProps) {
  const invoiceId = invoice?.id ?? null;

  const fetchDetail = useCallback(
    (signal: AbortSignal) => (invoiceId ? cardsService.getInvoice(invoiceId, signal) : Promise.resolve(null)),
    [invoiceId],
  );

  const { data, loading, error } = useAsyncData(fetchDetail, [invoiceId]);

  if (!invoice) return null;

  const items = data?.items ?? [];

  return (
    <Modal
      open
      onClose={onClose}
      title={`Fatura de ${capitalize(formatMonthLabel(invoice.month))}`}
      description={invoice.cardName}
      size="lg"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Fechar
        </Button>
      }
    >
      <header className={styles.summary}>
        <div className={styles.summaryMain}>
          <span className={styles.summaryLabel}>Total da fatura</span>
          <Amount value={invoice.total} size="lg" />
        </div>

        <dl className={styles.summaryDates}>
          <div>
            <dt>Fechamento</dt>
            <dd>{formatFullDate(invoice.closingDate)}</dd>
          </div>
          <div>
            <dt>Vencimento</dt>
            <dd>{formatFullDate(invoice.dueDate)}</dd>
          </div>
          <div>
            <dt>Situação</dt>
            <dd>
              <Badge tone={invoiceStatusTone[invoice.status]} dot>
                {invoiceStatusLabel[invoice.status]}
              </Badge>
            </dd>
          </div>
        </dl>
      </header>

      {loading ? (
        <LoadingBlock lines={5} height={220} />
      ) : error ? (
        <EmptyState title="Não foi possível carregar as compras" description={error.message} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Nenhuma compra nesta fatura"
          description="O ciclo ainda não recebeu lançamentos neste cartão."
        />
      ) : (
        <ul className={styles.items}>
          {items.map((item) => (
            <li key={item.id} className={styles.item}>
              <span className={`${styles.itemDate} tabular`}>{formatShortDate(item.date)}</span>

              <span className={styles.itemText}>
                <span className={styles.itemDescription}>
                  {item.description}
                  {item.installment ? (
                    <span className={styles.installment}>
                      {item.installment.number}/{item.installment.total}
                    </span>
                  ) : null}
                </span>

                {item.category ? (
                  <span className={styles.category}>
                    <span
                      className={styles.categoryDot}
                      style={{ backgroundColor: `var(--chart-${item.category.colorToken})` }}
                      aria-hidden="true"
                    />
                    {item.category.name}
                  </span>
                ) : null}
              </span>

              <Amount value={item.amount} size="sm" />
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
