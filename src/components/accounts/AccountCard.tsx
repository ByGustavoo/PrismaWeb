import { Trash2 } from 'lucide-react';
import { Amount } from '@/components/common';
import { Badge } from '@/components/ui';
import { accountStatusLabel, accountTypeLabel } from '@/constants/accounts';
import type { Account } from '@/types';
import { accountStatusTone, accountTypeIcon } from './meta';
import styles from './AccountCard.module.css';

interface AccountCardProps {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
}

/**
 * Uma conta no cadastro. O cartao inteiro abre a edicao — o botao que cobre a
 * area fica atras do conteudo e so o excluir volta a receber ponteiro, o mesmo
 * arranjo da lista de lancamentos, para que a acao destrutiva continue exigindo
 * um toque proprio.
 */
export function AccountCard({ account, onEdit, onDelete }: AccountCardProps) {
  const Icon = accountTypeIcon[account.type];
  const inactive = account.status === 'inactive';

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

        <div className={styles.bottom}>
          <Badge tone={accountStatusTone[account.status]} dot>
            {accountStatusLabel[account.status]}
          </Badge>
          {/*
            So a ausencia e digna de nota: escrever "Soma no saldo total" nas
            outras quatro contas repetiria o padrao em vez de sinalizar a excecao.
          */}
          {!account.includeInTotal && !inactive ? (
            <span className={styles.note}>Fora do saldo total</span>
          ) : null}
        </div>
      </div>
    </li>
  );
}
