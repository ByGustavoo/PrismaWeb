import { juntarClasses } from '@/utils/juntarClasses';
import styles from './Carregamento.module.css';

export interface IndicadorGiratorioProps {
  tamanho?: number;
  rotulo?: string;
}

export function IndicadorGiratorio({ tamanho = 20, rotulo }: IndicadorGiratorioProps) {
  return (
    <span className={styles.spinnerWrapper} role="status" aria-live="polite">
      <span className={styles.spinner} style={{ width: tamanho, height: tamanho }} />
      {rotulo ? <span className={styles.spinnerLabel}>{rotulo}</span> : <span className="visually-hidden">Carregando</span>}
    </span>
  );
}

export interface EsqueletoProps {
  largura?: string | number;
  altura?: string | number;
  raio?: string;
  className?: string;
}

export function Esqueleto({ largura = '100%', altura = 16, raio = 'var(--radius-xs)', className }: EsqueletoProps) {
  return (
    <span
      aria-hidden="true"
      className={juntarClasses(styles.skeleton, className)}
      style={{ width: largura, height: altura, borderRadius: raio }}
    />
  );
}

export function BlocoCarregando({ linhas = 3, altura = 240 }: { linhas?: number; altura?: number }) {
  return (
    <div className={styles.block} style={{ minHeight: altura }}>
      {Array.from({ length: linhas }).map((_, index) => (
        <Esqueleto key={index} altura={index === 0 ? 28 : 14} largura={index === 0 ? '45%' : `${90 - index * 12}%`} />
      ))}
    </div>
  );
}
