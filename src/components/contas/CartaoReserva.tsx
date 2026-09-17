import { ChevronRight, Trash2 } from 'lucide-react';
import { ValorMonetario } from '@/components/comum';
import { MiniCurva } from '@/components/graficos';
import { Selo } from '@/components/ui';
import { MESES_EVOLUCAO_CONTA, rotuloSituacaoConta, rotuloTipoConta } from '@/constants/contas';
import type { EvolucaoContaDTO } from '@/types';
import { formatarPercentualComSinal } from '@/utils/formatacao';
import { iconeTipoConta, tomSituacaoConta } from './aparencia';
import styles from './CartaoReserva.module.css';

interface CartaoReservaProps {
  evolucao: EvolucaoContaDTO;
  aoAbrir: (evolution: EvolucaoContaDTO) => void;
  aoExcluir: (evolution: EvolucaoContaDTO) => void;
}

export function CartaoReserva({ evolucao, aoAbrir, aoExcluir }: CartaoReservaProps) {
  const { conta: account } = evolucao;
  const Icon = iconeTipoConta[account.tipo];
  const inactive = account.situacao === 'INATIVO';

  return (
    <li className={styles.card}>
      <button type="button" className={styles.open} onClick={() => aoAbrir(evolucao)}>
        <span className="visually-hidden">Ver evolução de {account.nome}</span>
      </button>

      <div className={styles.content}>
        <div className={styles.top}>
          <span className={styles.iconBox} aria-hidden="true">
            <Icon size={18} strokeWidth={1.75} />
          </span>

          <span className={styles.identity}>
            <span className={styles.name}>{account.nome}</span>
            <span className={styles.meta}>
              {account.instituicao}
              <span className={styles.separator} aria-hidden="true">
                ·
              </span>
              {rotuloTipoConta[account.tipo]}
            </span>
          </span>

          <button
            type="button"
            className={styles.delete}
            aria-label={`Excluir ${account.nome}`}
            onClick={() => aoExcluir(evolucao)}
          >
            <Trash2 size={16} strokeWidth={2} />
          </button>
        </div>

        <div className={styles.figures}>
          <div className={styles.balance}>
            <span className={styles.label}>Saldo</span>
            <ValorMonetario valor={account.saldo} tamanho="lg" tom={inactive ? 'muted' : 'default'} />
          </div>
          <div className={styles.yield}>
            <span className={styles.label}>Rendeu em {MESES_EVOLUCAO_CONTA} meses</span>
            <span className={styles.yieldRow}>
              <ValorMonetario
                valor={evolucao.rendimentos}
                tamanho="sm"
                sinal="auto"
                tom={evolucao.rendimentos > 0 ? 'positive' : 'muted'}
              />
              <span className={`${styles.percent} tabular`}>{formatarPercentualComSinal(evolucao.rentabilidade * 100)}</span>
            </span>
          </div>
        </div>

        <MiniCurva className={styles.curve} valores={evolucao.evolucao.map((point) => point.valor)} />

        <p className={styles.story}>
          <span>
            Começou o período com <ValorMonetario valor={evolucao.saldoInicial} tamanho="sm" tom="muted" />
          </span>
          <span>
            Aportes líquidos de <ValorMonetario valor={evolucao.aportes - evolucao.resgates} tamanho="sm" tom="muted" />
          </span>
        </p>

        <div className={styles.bottom}>
          <Selo tom={tomSituacaoConta[account.situacao]} ponto>
            {rotuloSituacaoConta[account.situacao]}
          </Selo>
          {!account.incluirNoTotal && !inactive ? <span className={styles.note}>Fora do saldo total</span> : null}
          <span className={styles.more} aria-hidden="true">
            Ver evolução
            <ChevronRight size={14} strokeWidth={2} />
          </span>
        </div>
      </div>
    </li>
  );
}
