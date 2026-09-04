import { ArrowRight, Pencil, Trash2 } from 'lucide-react';
import { Amount } from '@/components/common';
import { Badge, Button, ProgressBar } from '@/components/ui';
import { cardStatusLabel, cardTypeShortLabel, isCreditCard, isVoucherCard } from '@/constants/cards';
import type { Card, Invoice } from '@/types';
import { formatFullDate } from '@/utils/format';
import { cardStatusTone, cardTypeIcon, limitTone } from './meta';
import styles from './CardTile.module.css';

interface CardTileProps {
  card: Card;
  /** Fatura em curso; so cartao de credito tem uma. */
  invoice?: Invoice | undefined;
  /**
   * Saldo da conta que o cartao de debito acessa. E o numero que responde quanto
   * ele pode gastar: sem ele, o unico cartao da tela sem valor algum era
   * justamente o que se usa todo dia.
   */
  accountBalance?: number | undefined;
  onEdit: (card: Card) => void;
  onDelete: (card: Card) => void;
  onOpenInvoices: (card: Card) => void;
}

/**
 * Um cartao no cadastro. Os quatro tipos dividem o cabecalho e mudam so o miolo:
 * credito mostra limite e fatura, debito mostra a conta que ele acessa e os
 * vales mostram o saldo carregado. Repetir a moldura em quatro componentes
 * separados faria a mesma identidade visual divergir com o tempo.
 */
export function CardTile({ card, invoice, accountBalance, onEdit, onDelete, onOpenInvoices }: CardTileProps) {
  const Icon = cardTypeIcon[card.type];
  const credit = isCreditCard(card);
  const used = card.used ?? 0;
  const ratio = credit ? Math.min(used / card.limit, 1) : 0;

  return (
    <li className={styles.tile}>
      <header className={styles.header}>
        <span className={styles.iconBox} aria-hidden="true">
          <Icon size={18} strokeWidth={1.75} />
        </span>
        <span className={styles.nameRow}>
          <span className={styles.name}>{card.name}</span>
          <Badge>{cardTypeShortLabel[card.type]}</Badge>
          {card.status === 'inactive' ? (
            <Badge tone={cardStatusTone.inactive} dot>
              {cardStatusLabel.inactive}
            </Badge>
          ) : null}
        </span>

        <span className={styles.actions}>
          <Button
            variant="ghost"
            size="sm"
            icon={Pencil}
            aria-label={`Editar ${card.name}`}
            onClick={() => onEdit(card)}
          />
          <Button
            variant="ghost"
            size="sm"
            icon={Trash2}
            className={styles.delete}
            aria-label={`Excluir ${card.name}`}
            onClick={() => onDelete(card)}
          />
        </span>

        {/*
          A linha de identificacao ocupa a largura do nome mais a das acoes: com
          ela espremida na coluna do nome, "Banco Nova · Mastercard · •••• 4417"
          quebrava em duas e deixava um separador solto no fim da primeira.
          Espaco inquebravel nos digitos: "•••• 4417" partido no meio vira dois
          lixos visuais.
        */}
        <span className={styles.meta}>
          {[card.institution, card.brand, card.lastDigits ? `•••• ${card.lastDigits}` : null]
            .filter(Boolean)
            .join(' · ')}
        </span>
      </header>

      {credit ? (
        <>
          <div className={styles.limit}>
            <div className={styles.limitTop}>
              <span className={styles.limitLabel}>Limite disponível</span>
              <span className={styles.limitTotal}>
                de <Amount value={card.limit} size="sm" tone="muted" />
              </span>
            </div>

            <Amount value={Math.max(card.limit - used, 0)} size="lg" />

            <ProgressBar
              value={ratio}
              tone={limitTone(ratio)}
              label={`Limite utilizado de ${card.name}`}
              className={styles.bar}
            />

            <span className={styles.limitFoot}>
              <span className="tabular">{Math.round(ratio * 100)}%</span> do limite comprometido
            </span>
          </div>

          <dl className={styles.facts}>
            <div className={styles.fact}>
              <dt>Fatura atual</dt>
              <dd>
                <Amount value={invoice?.total ?? 0} size="sm" />
              </dd>
            </div>
            <div className={styles.fact}>
              <dt>Fechamento</dt>
              <dd className="tabular">Dia {card.closingDay}</dd>
            </div>
            <div className={styles.fact}>
              <dt>Vencimento</dt>
              <dd className="tabular">Dia {card.dueDay}</dd>
            </div>
          </dl>

          <footer className={styles.footer}>
            <span className={styles.due}>
              {invoice ? `Vence em ${formatFullDate(invoice.dueDate)}` : 'Sem fatura em aberto'}
            </span>
            <Button
              variant="secondary"
              size="sm"
              icon={ArrowRight}
              iconPosition="right"
              onClick={() => onOpenInvoices(card)}
            >
              Ver faturas
            </Button>
          </footer>
        </>
      ) : (
        <div className={styles.simple}>
          {isVoucherCard(card) ? (
            <>
              <span className={styles.simpleLabel}>Saldo disponível</span>
              <Amount value={card.balance ?? 0} size="lg" />
            </>
          ) : accountBalance === undefined ? (
            <>
              <span className={styles.simpleLabel}>Debita direto na conta</span>
              <span className={styles.linked}>{card.accountName ?? 'Conta não vinculada'}</span>
            </>
          ) : (
            <>
              <span className={styles.simpleLabel}>Disponível na conta</span>
              <Amount value={accountBalance} size="lg" />
              <span className={styles.linked}>{card.accountName}</span>
            </>
          )}
        </div>
      )}
    </li>
  );
}
