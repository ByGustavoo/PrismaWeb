import { CreditCard, Wallet } from 'lucide-react';
import { ValorMonetario } from '@/components/comum';
import { Painel, CorpoPainel, CabecalhoPainel } from '@/components/ui';
import { corDaPaleta } from '@/constants/cores';
import { chaveDaOrigem, coresDasOrigens } from '@/constants/relatorio/relatorio';
import type { GastoOrigemDTO } from '@/types';
import { formatarPercentual } from '@/utils/formatacao';
import styles from './DistribuicaoOrigens.module.css';

interface DistribuicaoOrigensProps {
  dados: GastoOrigemDTO[];
}

export function DistribuicaoOrigens({ dados }: DistribuicaoOrigensProps) {
  const largest = dados[0]?.participacao ?? 1;
  const cores = coresDasOrigens(dados);

  return (
    <Painel className={`${styles.card} card-hover-accent`}>
      <CabecalhoPainel titulo="Gastos por conta e cartão" descricao="Participação de cada origem no total de despesas" />
      <CorpoPainel>
        {dados.length === 0 ? (
          <p className={styles.empty}>Nenhuma despesa registrada neste período.</p>
        ) : (
          <ul className={styles.list}>
            {dados.map((entry) => {
              const Icon = entry.grupo === 'CARTAO' ? CreditCard : Wallet;
              const chave = chaveDaOrigem(entry);
              const cor = corDaPaleta(cores.get(chave) ?? 1);

              return (
                <li key={chave} className={styles.row}>
                  <div className={styles.info}>
                    <span className={styles.iconBox} style={{ color: cor }} aria-hidden="true">
                      <Icon size={14} strokeWidth={2} />
                    </span>
                    <span className={styles.name}>{entry.nome}</span>
                    <span className={`${styles.share} tabular`}>{formatarPercentual(entry.participacao * 100, 0)}</span>
                    <ValorMonetario valor={entry.valor} tamanho="sm" tom="muted" />
                  </div>

                  <div className={styles.track}>
                    <div
                      className={styles.bar}
                      style={{ width: `${(entry.participacao / largest) * 100}%`, backgroundColor: cor }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CorpoPainel>
    </Painel>
  );
}
