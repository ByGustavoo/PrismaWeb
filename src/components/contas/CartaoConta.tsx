import { Trash2 } from 'lucide-react';
import { ValorMonetario } from '@/components/comum';
import { Selo, BarraProgresso } from '@/components/ui';
import { rotuloSituacaoConta, rotuloTipoConta } from '@/constants/contas';
import type { ContaDTO } from '@/types';
import { tomSituacaoConta, iconeTipoConta } from './aparencia';
import styles from './CartaoConta.module.css';

interface CartaoContaProps {
  conta: ContaDTO;
  participacao?: number;
  aoEditar: (account: ContaDTO) => void;
  aoExcluir: (account: ContaDTO) => void;
}

export function CartaoConta({ conta, participacao, aoEditar, aoExcluir }: CartaoContaProps) {
  const Icon = iconeTipoConta[conta.tipo];
  const inactive = conta.situacao === 'INATIVO';

  return (
    <li className={styles.card}>
      <button type="button" className={styles.open} onClick={() => aoEditar(conta)}>
        <span className="visually-hidden">Editar {conta.nome}</span>
      </button>

      <div className={styles.content}>
        <div className={styles.top}>
          <span className={styles.iconBox} aria-hidden="true">
            <Icon size={18} strokeWidth={1.75} />
          </span>

          <span className={styles.identity}>
            <span className={styles.name}>{conta.nome}</span>
            <span className={styles.meta}>
              {conta.instituicao}
              <span className={styles.separator} aria-hidden="true">
                ·
              </span>
              {rotuloTipoConta[conta.tipo]}
            </span>
          </span>

          <button
            type="button"
            className={styles.delete}
            aria-label={`Excluir ${conta.nome}`}
            onClick={() => aoExcluir(conta)}
          >
            <Trash2 size={16} strokeWidth={2} />
          </button>
        </div>

        <div className={styles.balance}>
          <span className={styles.balanceLabel}>Saldo</span>
          <ValorMonetario valor={conta.saldo} tamanho="lg" tom={inactive ? 'muted' : 'default'} />
        </div>

        {participacao === undefined ? null : (
          <div className={styles.share}>
            <BarraProgresso
              valor={participacao}
              rotulo={`Participação de ${conta.nome} no saldo total`}
              className={styles.shareBar}
            />
            <span className={styles.shareLabel}>
              <span className="tabular">{Math.round(participacao * 100)}%</span> do saldo total
            </span>
          </div>
        )}

        <div className={styles.bottom}>
          <Selo tom={tomSituacaoConta[conta.situacao]} ponto>
            {rotuloSituacaoConta[conta.situacao]}
          </Selo>
          {!conta.incluirNoTotal && !inactive ? (
            <span className={styles.note}>Fora do saldo total</span>
          ) : null}
        </div>
      </div>
    </li>
  );
}
