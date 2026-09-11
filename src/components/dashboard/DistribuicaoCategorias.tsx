import { Painel, CorpoPainel, CabecalhoPainel } from '@/components/ui';
import { ValorMonetario } from '@/components/comum';
import type { GastoCategoriaDTO } from '@/types';
import { formatarPercentual } from '@/utils/formatacao';
import styles from './DistribuicaoCategorias.module.css';

interface DistribuicaoCategoriasProps {
  dados: GastoCategoriaDTO[];
  substantivoPeriodo: string;
  titulo?: string;
  descricao?: string;
  rotuloVazio?: string;
}

export function DistribuicaoCategorias({
  dados,
  substantivoPeriodo,
  titulo = 'Gastos por categoria',
  descricao,
  rotuloVazio = 'Nenhuma despesa com categoria neste período.',
}: DistribuicaoCategoriasProps) {
  const largest = dados[0]?.participacao ?? 1;

  return (
    <Painel className={styles.card}>
      <CabecalhoPainel
        titulo={titulo}
        descricao={descricao ?? `Participação no total de despesas do ${substantivoPeriodo}`}
      />
      <CorpoPainel>
        {dados.length === 0 ? (
          <p className={styles.empty}>{rotuloVazio}</p>
        ) : (
          <ul className={styles.list}>
            {dados.map((entry) => (
              <li key={entry.categoria.id} className={styles.row}>
                <div className={styles.info}>
                  <span
                    className={styles.marker}
                    style={{ backgroundColor: `var(--chart-${entry.categoria.tokenCor})` }}
                    aria-hidden="true"
                  />
                  <span className={styles.name}>{entry.categoria.nome}</span>
                  <span className={`${styles.share} tabular`}>{formatarPercentual(entry.participacao * 100, 0)}</span>
                  <ValorMonetario valor={entry.valor} tamanho="sm" tom="muted" />
                </div>

                <div className={styles.track}>
                  <div
                    className={styles.bar}
                    style={{
                      width: `${(entry.participacao / largest) * 100}%`,
                      backgroundColor: `var(--chart-${entry.categoria.tokenCor})`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CorpoPainel>
    </Painel>
  );
}
