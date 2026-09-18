import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { ValorMonetario, IndicadorVariacao } from '@/components/comum';
import type { VariacaoDTO } from '@/types';
import styles from './BlocoIndicador.module.css';

interface BlocoIndicadorProps {
  rotulo: string;
  valor: number;
  icone: LucideIcon;
  variacao?: VariacaoDTO;
  notaRodape?: ReactNode;
}

export function BlocoIndicador({ rotulo, valor, icone: Icon, variacao, notaRodape }: BlocoIndicadorProps) {
  return (
    <article className={`${styles.tile} card-hover-accent`}>
      <header className={styles.header}>
        <span className={styles.label}>{rotulo}</span>
        <span className={styles.iconBox} aria-hidden="true">
          <Icon size={16} strokeWidth={2} />
        </span>
      </header>

      <ValorMonetario valor={valor} tamanho="lg" animar contarAoAparecer />

      <footer className={styles.footer}>
        {variacao ? <IndicadorVariacao variacao={variacao} /> : null}
        {notaRodape ? <span className={styles.footnote}>{notaRodape}</span> : null}
      </footer>
    </article>
  );
}
