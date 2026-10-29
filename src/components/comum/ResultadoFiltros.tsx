import { X } from 'lucide-react';
import { Botao } from '@/components/ui';
import styles from './ResultadoFiltros.module.css';

interface ResultadoFiltrosProps {
  texto: string;
  visivel: boolean;
  aoLimpar: () => void;
}

export function ResultadoFiltros({ texto, visivel, aoLimpar }: ResultadoFiltrosProps) {
  return (
    <>
      <p className="visually-hidden" role="status" aria-live="polite">
        {texto}
      </p>

      {visivel ? (
        <div className={styles.result}>
          <span className={styles.count} aria-hidden="true">
            {texto}
          </span>
          <Botao variante="ghost" tamanho="sm" icone={X} onClick={aoLimpar}>
            Limpar filtros
          </Botao>
        </div>
      ) : null}
    </>
  );
}
