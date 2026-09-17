import { Plus, Trash2 } from 'lucide-react';
import { ValorMonetario } from '@/components/comum';
import { BarraProgresso } from '@/components/ui';
import { iconeClasseAtivo, rotuloClasseAtivo } from '@/constants/investimentos';
import type { PosicaoDTO } from '@/types';
import { formatarDataNumerica, formatarMesCurto, formatarPercentualComSinal } from '@/utils/formatacao';
import { corDaClasse, tomRendimento } from './aparencia';
import styles from './CartaoInvestimento.module.css';

interface CartaoInvestimentoProps {
  posicao: PosicaoDTO;
  aoAbrir: (position: PosicaoDTO) => void;
  aoAdicionarAporte: (position: PosicaoDTO) => void;
  aoExcluir: (position: PosicaoDTO) => void;
}

export function CartaoInvestimento({ posicao, aoAbrir, aoAdicionarAporte, aoExcluir }: CartaoInvestimentoProps) {
  const { investimento: investment, rendimento: profit, rentabilidade: profitability, participacao: share } = posicao;
  const Icon = iconeClasseAtivo[investment.classeAtivo];

  return (
    <li className={styles.card}>
      <button type="button" className={styles.open} onClick={() => aoAbrir(posicao)}>
        <span className="visually-hidden">Ver histórico de {investment.nome}</span>
      </button>

      <div className={styles.content}>
        <div className={styles.top}>
          <span
            className={styles.iconBox}
            style={{ color: corDaClasse(investment.classeAtivo) }}
            aria-hidden="true"
          >
            <Icon size={18} strokeWidth={1.75} />
          </span>

          <span className={styles.identity}>
            <span className={styles.name}>{investment.nome}</span>
            <span className={styles.meta}>
              {rotuloClasseAtivo[investment.classeAtivo]}
              <span className={styles.separator} aria-hidden="true">
                ·
              </span>
              {investment.instituicao}
            </span>
          </span>

          <button
            type="button"
            className={styles.delete}
            aria-label={`Excluir ${investment.nome}`}
            onClick={() => aoExcluir(posicao)}
          >
            <Trash2 size={16} strokeWidth={2} />
          </button>
        </div>

        <div className={styles.figures}>
          <span className={styles.value}>
            <span className={styles.figureLabel}>Valor atual</span>
            <ValorMonetario valor={investment.valorAtual} tamanho="lg" />
          </span>

          <span className={styles.profit}>
            <span className={styles.figureLabel}>Resultado</span>
            <span className={styles.profitRow}>
              <ValorMonetario valor={profit} tom={tomRendimento(profit)} sinal="auto" />
              <span className={`${styles.percent} tabular`}>{formatarPercentualComSinal(profitability * 100)}</span>
            </span>
          </span>
        </div>

        <div className={styles.share}>
          <BarraProgresso
            valor={share}
            rotulo={`Participação de ${investment.nome} no patrimônio`}
            className={styles.shareBar}
          />
          <span className={styles.shareLabel}>
            <span className="tabular">{Math.round(share * 100)}%</span> da carteira · aportado{' '}
            <ValorMonetario className={styles.inline} valor={investment.aportado} tamanho="sm" tom="muted" />
          </span>
        </div>

        <div className={styles.footer}>
          <p className={styles.since}>
            Desde {formatarMesCurto(investment.dataInicio.slice(0, 7))}
            <span className={styles.separator} aria-hidden="true">
              ·
            </span>
            saldo de {formatarDataNumerica(investment.dataAtualizacao).slice(0, 5)}
          </p>
          <button type="button" className={styles.contribute} onClick={() => aoAdicionarAporte(posicao)}>
            <Plus size={14} strokeWidth={2.25} aria-hidden="true" />
            Aporte
            <span className="visually-hidden"> em {investment.nome}</span>
          </button>
        </div>
      </div>
    </li>
  );
}
