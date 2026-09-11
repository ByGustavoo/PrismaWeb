import { juntarClasses } from '@/utils/juntarClasses';
import styles from './AlternadorVisualizacao.module.css';

export type VisualizacaoLancamentos = 'table' | 'cards';

interface AlternadorVisualizacaoProps {
  valor: VisualizacaoLancamentos;
  aoAlterar: (view: VisualizacaoLancamentos) => void;
  className?: string;
}

const opcoes: Array<{ valor: VisualizacaoLancamentos; rotulo: string; descricao: string }> = [
  { valor: 'table', rotulo: 'Tabela', descricao: 'Ver os lançamentos como tabela' },
  { valor: 'cards', rotulo: 'Cartões', descricao: 'Ver os lançamentos como cartões' },
];

export function AlternadorVisualizacao({ valor, aoAlterar, className }: AlternadorVisualizacaoProps) {
  return (
    <div className={juntarClasses(styles.group, className)} role="radiogroup" aria-label="Modo de exibição">
      <span className={styles.indicator} data-view={valor} aria-hidden="true" />

      {opcoes.map((option) => (
        <button
          key={option.valor}
          type="button"
          role="radio"
          aria-checked={valor === option.valor}
          aria-label={option.descricao}
          className={juntarClasses(styles.option, valor === option.valor && styles.selected)}
          onClick={() => aoAlterar(option.valor)}
        >
          <IconePilha variant={option.valor} />
          <span className={styles.label}>{option.rotulo}</span>
        </button>
      ))}
    </div>
  );
}

function IconePilha({ variant }: { variant: VisualizacaoLancamentos }) {
  return (
    <svg
      className={juntarClasses(styles.icon, styles[variant])}
      viewBox="0 0 16 16"
      width="16"
      height="16"
      aria-hidden="true"
      focusable="false"
    >
      <rect className={styles.bar} x="1.5" y="2.5" width="13" height="2" rx="1" />
      <rect className={styles.bar} x="1.5" y="7" width="13" height="2" rx="1" />
      <rect className={styles.bar} x="1.5" y="11.5" width="13" height="2" rx="1" />
    </svg>
  );
}
