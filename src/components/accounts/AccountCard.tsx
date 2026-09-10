import { Trash2 } from 'lucide-react';
import { Amount } from '@/components/common';
import { Badge, ProgressBar } from '@/components/ui';
import { accountStatusLabel, accountTypeLabel } from '@/constants/accounts';
import type { Account } from '@/types';
import { accountStatusTone, accountTypeIcon } from './meta';
import styles from './AccountCard.module.css';

interface AccountCardProps {
  account: Account;
  share?: number;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
}

export function AccountCard({ account, share, onEdit, onDelete }: AccountCardProps) {
  const Icon = accountTypeIcon[account.type];
  const inactive = account.status === 'INATIVO';

  return (
    <li className={styles.card}>
      <button type="button" className={styles.open} onClick={() => onEdit(account)}>
        <span className="visually-hidden">Editar {account.name}</span>
      </button>

      <div className={styles.content}>
        <div className={styles.top}>
          <span className={styles.iconBox} aria-hidden="true">
            <Icon size={18} strokeWidth={1.75} />
          </span>

          <span className={styles.identity}>
            <span className={styles.name}>{account.name}</span>
            <span className={styles.meta}>
              {account.institution}
              <span className={styles.separator} aria-hidden="true">
                ·
              </span>
              {accountTypeLabel[account.type]}
            </span>
          </span>

          <button
            type="button"
            className={styles.delete}
            aria-label={`Excluir ${account.name}`}
            onClick={() => onDelete(account)}
          >
            <Trash2 size={16} strokeWidth={2} />
          </button>
        </div>

        <div className={styles.balance}>
          <span className={styles.balanceLabel}>Saldo</span>
          <Amount value={account.balance} size="lg" tone={inactive ? 'muted' : 'default'} />
        </div>

        {share === undefined ? null : (
          <div className={styles.share}>
            <ProgressBar
              value={share}
              label={`Participação de ${account.name} no saldo total`}
              className={styles.shareBar}
            />
            <span className={styles.shareLabel}>
              <span className="tabular">{Math.round(share * 100)}%</span> do saldo total
            </span>
          </div>
        )}

        <div className={styles.bottom}>
          <Badge tone={accountStatusTone[account.status]} dot>
            {accountStatusLabel[account.status]}
          </Badge>
          {!account.includeInTotal && !inactive ? (
            <span className={styles.note}>Fora do saldo total</span>
          ) : null}
        </div>
      </div>
    </li>
  );
}
