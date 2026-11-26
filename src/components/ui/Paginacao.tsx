import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatarInteiro } from '@/utils/formatacao';
import { juntarClasses } from '@/utils/juntarClasses';
import { faixaDaPagina, paginasVisiveis } from '@/utils/paginacao';
import styles from './Paginacao.module.css';

interface PaginacaoProps {
  pagina: number;
  quantidadePaginas: number;
  quantidadeTotal: number;
  tamanho: number;
  rotulo: string;
  aoMudar: (pagina: number) => void;
}

export function Paginacao({ pagina, quantidadePaginas, quantidadeTotal, tamanho, rotulo, aoMudar }: PaginacaoProps) {
  if (quantidadePaginas <= 1) return null;

  const { primeiro, ultimo } = faixaDaPagina(pagina, tamanho, quantidadeTotal);
  const naPrimeira = pagina <= 0;
  const naUltima = pagina >= quantidadePaginas - 1;
  const ir = (destino: number) => {
    if (destino !== pagina && destino >= 0 && destino < quantidadePaginas) aoMudar(destino);
  };

  return (
    <nav className={styles.paginacao} aria-label={rotulo}>
      <p className={styles.resumo} aria-live="polite">
        <span className="tabular">
          {formatarInteiro(primeiro)}–{formatarInteiro(ultimo)}
        </span>{' '}
        de <span className="tabular">{formatarInteiro(quantidadeTotal)}</span>
      </p>

      <div className={styles.controles}>
        <button
          type="button"
          className={styles.seta}
          aria-label="Página anterior"
          aria-disabled={naPrimeira}
          onClick={() => ir(pagina - 1)}
        >
          <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
        </button>

        <ol className={styles.numeros}>
          {paginasVisiveis(pagina, quantidadePaginas).map((item) =>
            typeof item === 'number' ? (
              <li key={item}>
                <button
                  type="button"
                  className={juntarClasses(styles.numero, 'tabular', item === pagina && styles.atual)}
                  aria-label={`Página ${item + 1}`}
                  aria-current={item === pagina ? 'page' : undefined}
                  onClick={() => ir(item)}
                >
                  {item + 1}
                </button>
              </li>
            ) : (
              <li key={item} className={styles.reticencias} aria-hidden="true">
                …
              </li>
            ),
          )}
        </ol>

        <span className={juntarClasses(styles.compacto, 'tabular')}>
          Página {formatarInteiro(pagina + 1)} de {formatarInteiro(quantidadePaginas)}
        </span>

        <button
          type="button"
          className={styles.seta}
          aria-label="Próxima página"
          aria-disabled={naUltima}
          onClick={() => ir(pagina + 1)}
        >
          <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
