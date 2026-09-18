import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Painel, CorpoPainel, CabecalhoPainel } from '@/components/ui';
import { ValorMonetario } from '@/components/comum';
import { corDaPaleta } from '@/constants/cores';
import type { GastoCategoriaDTO } from '@/types';
import { formatarPercentual } from '@/utils/formatacao';
import { juntarClasses } from '@/utils/juntarClasses';
import styles from './DistribuicaoCategorias.module.css';

const CATEGORIAS_VISIVEIS = 6;

interface DistribuicaoCategoriasProps {
  dados: GastoCategoriaDTO[];
  substantivoPeriodo: string;
  titulo?: string;
  descricao?: string;
  rotuloVazio?: string;
  className?: string;
}

export function DistribuicaoCategorias({
  dados,
  substantivoPeriodo,
  titulo = 'Gastos por categoria',
  descricao,
  rotuloVazio = 'Nenhuma despesa com categoria neste período.',
  className,
}: DistribuicaoCategoriasProps) {
  const [expanded, setExpanded] = useState(false);
  const listId = useId();
  const largest = dados[0]?.participacao ?? 1;
  const hiddenCount = Math.max(dados.length - CATEGORIAS_VISIVEIS, 0);
  const visible = expanded ? dados : dados.slice(0, CATEGORIAS_VISIVEIS);

  return (
    <Painel className={className}>
      <CabecalhoPainel
        titulo={titulo}
        descricao={descricao ?? `Participação no total de despesas do ${substantivoPeriodo}`}
      />
      <CorpoPainel>
        {dados.length === 0 ? (
          <p className={styles.empty}>{rotuloVazio}</p>
        ) : (
          <>
            <ul className={styles.list} id={listId}>
              {visible.map((entry) => (
                <li key={entry.categoria.id} className={styles.row}>
                  <div className={styles.info}>
                    <span
                      className={styles.marker}
                      style={{ backgroundColor: corDaPaleta(entry.categoria.tokenCor) }}
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
                        backgroundColor: corDaPaleta(entry.categoria.tokenCor),
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
            {hiddenCount > 0 ? (
              <button
                type="button"
                className={styles.toggle}
                aria-expanded={expanded}
                aria-controls={listId}
                onClick={() => setExpanded((value) => !value)}
              >
                {expanded
                  ? 'Mostrar só as principais'
                  : `Ver mais ${hiddenCount} ${hiddenCount === 1 ? 'categoria' : 'categorias'}`}
                <ChevronDown className={juntarClasses(styles.chevron, expanded && styles.chevronOpen)} size={15} strokeWidth={2} />
              </button>
            ) : null}
          </>
        )}
      </CorpoPainel>
    </Painel>
  );
}
