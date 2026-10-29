import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
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
  manterAlturaAoExpandir?: boolean;
  className?: string;
}

export function DistribuicaoCategorias({
  dados,
  substantivoPeriodo,
  titulo = 'Gastos por categoria',
  descricao,
  rotuloVazio = 'Nenhuma despesa com categoria neste período.',
  manterAlturaAoExpandir = false,
  className,
}: DistribuicaoCategoriasProps) {
  const [expanded, setExpanded] = useState(false);
  const [collapsedHeight, setCollapsedHeight] = useState<number | null>(null);
  const [scroll, setScroll] = useState({ possible: false, above: false, below: false });
  const listRef = useRef<HTMLUListElement>(null);
  const revealRequested = useRef(false);
  const listId = useId();
  const largest = dados[0]?.participacao ?? 1;
  const hiddenCount = Math.max(dados.length - CATEGORIAS_VISIVEIS, 0);
  const visible = expanded ? dados : dados.slice(0, CATEGORIAS_VISIVEIS);
  const scrollsWhenExpanded = manterAlturaAoExpandir && expanded && collapsedHeight !== null;

  const measureScroll = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    setScroll({
      possible: list.scrollHeight > list.clientHeight + 1,
      above: list.scrollTop > 1,
      below: list.scrollTop + list.clientHeight < list.scrollHeight - 1,
    });
  }, []);

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
  }, [expanded, measureScroll]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const observer = new ResizeObserver(measureScroll);
    observer.observe(list);
    return () => observer.disconnect();
  }, [measureScroll, dados.length]);

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
            <div
              className={styles.frame}
              {...(scroll.above ? { 'data-acima': '' } : {})}
              {...(scroll.below ? { 'data-abaixo': '' } : {})}
            >
              <ul
                ref={listRef}
                className={juntarClasses(styles.list, scrollsWhenExpanded && styles.listScrolls)}
                id={listId}
                style={
                  scrollsWhenExpanded ? ({ '--altura-recolhida': `${collapsedHeight}px` } as CSSProperties) : undefined
                }
                onScroll={measureScroll}
                {...(scroll.possible ? { tabIndex: 0, 'aria-label': titulo } : {})}
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
