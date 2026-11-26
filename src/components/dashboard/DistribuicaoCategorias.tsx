import { useId, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { ChevronDown } from 'lucide-react';
import { Painel, CorpoPainel, CabecalhoPainel } from '@/components/ui';
import { ValorMonetario } from '@/components/comum';
import { corDaPaleta } from '@/constants/cores';
import { useIndicadoresRolagem } from '@/hooks/useIndicadoresRolagem';
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
  manterAlturaAoExpandir?: boolean;
  preencherAltura?: boolean;
  linhasMinimas?: number;
  className?: string;
}

export function DistribuicaoCategorias({
  dados,
  substantivoPeriodo,
  titulo = 'Gastos por categoria',
  descricao,
  rotuloVazio = 'Nenhuma despesa com categoria neste período.',
  manterAlturaAoExpandir = false,
  preencherAltura = false,
  linhasMinimas,
  className,
}: DistribuicaoCategoriasProps) {
  const [expanded, setExpanded] = useState(false);
  const [collapsedHeight, setCollapsedHeight] = useState<number | null>(null);
  const [minimumHeight, setMinimumHeight] = useState<number | null>(null);
  const revealRequested = useRef(false);
  const listId = useId();
  const largest = dados[0]?.participacao ?? 1;
  const hiddenCount = preencherAltura ? 0 : Math.max(dados.length - CATEGORIAS_VISIVEIS, 0);
  const visible = expanded || preencherAltura ? dados : dados.slice(0, CATEGORIAS_VISIVEIS);
  const scrollsWhenExpanded = manterAlturaAoExpandir && expanded && collapsedHeight !== null;

  const measureMinimumHeight = (list: HTMLUListElement) => {
    if (!preencherAltura || !linhasMinimas) return;
    const lastRequired = list.children[Math.min(linhasMinimas, list.children.length) - 1];
    setMinimumHeight(lastRequired instanceof HTMLElement ? lastRequired.offsetTop + lastRequired.offsetHeight : null);
  };

  const scroll = useIndicadoresRolagem<HTMLUListElement>(
    [visible.length, preencherAltura, linhasMinimas],
    measureMinimumHeight,
  );
  const { ref: listRef, medir: measureScroll } = scroll;

  const toggle = () => {
    if (!expanded && manterAlturaAoExpandir && listRef.current) {
      setCollapsedHeight(listRef.current.getBoundingClientRect().height);
      revealRequested.current = true;
    }
    setExpanded((value) => !value);
  };

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    if (!expanded) list.scrollTop = 0;
    measureScroll();
    if (!revealRequested.current) return;
    revealRequested.current = false;
    const firstRevealed = list.children[CATEGORIAS_VISIVEIS - 1];
    if (!(firstRevealed instanceof HTMLElement)) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    list.scrollTo({ top: firstRevealed.offsetTop, behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [expanded, listRef, measureScroll]);

  return (
    <Painel className={juntarClasses(preencherAltura && styles.fill, className)}>
      <CabecalhoPainel
        titulo={titulo}
        descricao={descricao ?? `Participação no total de despesas do ${substantivoPeriodo}`}
      />
      <CorpoPainel className={preencherAltura ? styles.fillBody : undefined}>
        {dados.length === 0 ? (
          <p className={styles.empty}>{rotuloVazio}</p>
        ) : (
          <>
            <div
              className={juntarClasses(styles.frame, preencherAltura && styles.fillFrame)}
              style={
                preencherAltura && minimumHeight !== null
                  ? ({ '--altura-minima-lista': `${minimumHeight}px` } as CSSProperties)
                  : undefined
              }
              {...(scroll.acima ? { 'data-acima': '' } : {})}
              {...(scroll.abaixo ? { 'data-abaixo': '' } : {})}
            >
              <ul
                ref={listRef}
                className={juntarClasses(
                  styles.list,
                  scrollsWhenExpanded && styles.listScrolls,
                  preencherAltura && styles.listFill,
                )}
                id={listId}
                style={
                  scrollsWhenExpanded ? ({ '--altura-recolhida': `${collapsedHeight}px` } as CSSProperties) : undefined
                }
                onScroll={measureScroll}
                {...(scroll.rolavel ? { tabIndex: 0, 'aria-label': titulo } : {})}
              >
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
            </div>
            {hiddenCount > 0 ? (
              <button
                type="button"
                className={styles.toggle}
                aria-expanded={expanded}
                aria-controls={listId}
                onClick={toggle}
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
