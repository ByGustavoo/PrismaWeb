import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarRange, Check, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { CampoSelecao } from '@/components/ui';
import { usePeriodo } from '@/providers/ProvedorPeriodo';
import type { PeriodoDashboard } from '@/services';
import type { Opcao } from '@/types';
import { juntarClasses } from '@/utils/juntarClasses';
import { chaveMesPorDeslocamento, deslocarChaveMes, mesesEntre } from '@/utils/data';
import { capitalizar, formatarRotuloMes, formatarRotuloPeriodo } from '@/utils/formatacao';
import styles from './SeletorPeriodo.module.css';

const MESES_PERIODO_PERSONALIZADO = 12;

interface Atalho {
  id: string;
  rotulo: string;
  resolver: (thisMonth: string) => PeriodoDashboard;
}

const atalhos: Atalho[] = [
  { id: 'this-month', rotulo: 'Este mês', resolver: (m) => ({ dataInicial: m, dataFinal: m }) },
  {
    id: 'last-month',
    rotulo: 'Mês passado',
    resolver: (m) => ({ dataInicial: deslocarChaveMes(m, -1), dataFinal: deslocarChaveMes(m, -1) }),
  },
  { id: 'last-3', rotulo: 'Últimos 3 meses', resolver: (m) => ({ dataInicial: deslocarChaveMes(m, -2), dataFinal: m }) },
  { id: 'last-6', rotulo: 'Últimos 6 meses', resolver: (m) => ({ dataInicial: deslocarChaveMes(m, -5), dataFinal: m }) },
  { id: 'this-year', rotulo: 'Este ano', resolver: (m) => ({ dataInicial: `${m.slice(0, 4)}-01`, dataFinal: m }) },
];

function opcoesMeses(thisMonth: string): Opcao[] {
  return Array.from({ length: MESES_PERIODO_PERSONALIZADO }, (_, index) => {
    const value = deslocarChaveMes(thisMonth, -(MESES_PERIODO_PERSONALIZADO - 1 - index));
    return { valor: value, rotulo: capitalizar(formatarRotuloMes(value)) };
  }).reverse();
}

export function SeletorPeriodo() {
  const { periodo, definirPeriodo } = usePeriodo();
  const [open, setOpen] = useState(false);
  const [editingCustom, setEditingCustom] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const thisMonth = chaveMesPorDeslocamento(0);
  const oldestMonth = deslocarChaveMes(thisMonth, -(MESES_PERIODO_PERSONALIZADO - 1));
  const options = useMemo(() => opcoesMeses(thisMonth), [thisMonth]);

  const canGoBack = periodo.dataInicial > oldestMonth;
  const canGoForward = periodo.dataFinal < thisMonth;

  const activePreset = atalhos.find((preset) => {
    const resolved = preset.resolver(thisMonth);
    return resolved.dataInicial === periodo.dataInicial && resolved.dataFinal === periodo.dataFinal;
  });

  const shiftPeriod = (direction: -1 | 1) => {
    const size = mesesEntre(periodo.dataInicial, periodo.dataFinal);
    const room =
      direction < 0 ? mesesEntre(oldestMonth, periodo.dataInicial) - 1 : mesesEntre(periodo.dataFinal, thisMonth) - 1;
    const step = direction * Math.min(size, room);
    if (step === 0) return;

    definirPeriodo({
      dataInicial: deslocarChaveMes(periodo.dataInicial, step),
      dataFinal: deslocarChaveMes(periodo.dataFinal, step),
    });
  };

  const close = () => {
    setOpen(false);
    setEditingCustom(false);
  };

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if ((target as HTMLElement).closest?.('[role="listbox"]')) return;
      close();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      close();
      triggerRef.current?.focus();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div className={styles.root} ref={rootRef}>
      <div className={styles.switcher}>
        <button
          type="button"
          className={styles.arrow}
          onClick={() => shiftPeriod(-1)}
          aria-disabled={!canGoBack}
          aria-label="Período anterior"
          title={canGoBack ? undefined : 'Não há histórico anterior a este período'}
        >
          <ChevronLeft size={16} strokeWidth={2} />
        </button>

        <button
          ref={triggerRef}
          type="button"
          className={juntarClasses(styles.label, open && styles.labelOpen)}
          onClick={() => (open ? close() : setOpen(true))}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <span className={styles.labelText}>{formatarRotuloPeriodo(periodo.dataInicial, periodo.dataFinal)}</span>
          <ChevronDown className={juntarClasses(styles.chevron, open && styles.chevronOpen)} size={14} strokeWidth={2} />
        </button>

        <button
          type="button"
          className={styles.arrow}
          onClick={() => shiftPeriod(1)}
          aria-disabled={!canGoForward}
          aria-label="Próximo período"
          title={canGoForward ? undefined : 'O período já chega ao mês atual'}
        >
          <ChevronRight size={16} strokeWidth={2} />
        </button>
      </div>

      {open ? (
        <div className={styles.panel} role="dialog" aria-label="Escolher período">
          <ul className={styles.presets}>
            {atalhos.map((preset) => {
              const selected = activePreset?.id === preset.id && !editingCustom;

              return (
                <li key={preset.id}>
                  <button
                    type="button"
                    className={juntarClasses(styles.preset, selected && styles.presetSelected)}
                    onClick={() => {
                      definirPeriodo(preset.resolver(thisMonth));
                      close();
                    }}
                  >
                    <span>{preset.rotulo}</span>
                    {selected ? <Check size={15} strokeWidth={2.5} aria-hidden="true" /> : null}
                  </button>
                </li>
              );
            })}

            <li>
              <button
                type="button"
                className={juntarClasses(styles.preset, (editingCustom || !activePreset) && styles.presetSelected)}
                onClick={() => setEditingCustom(true)}
              >
                <span>Período personalizado</span>
                <CalendarRange size={15} strokeWidth={2} aria-hidden="true" />
              </button>
            </li>
          </ul>

          {editingCustom || !activePreset ? (
            <div className={styles.custom}>
              <CampoSelecao
                rotulo="De"
                opcoes={options}
                value={periodo.dataInicial}
                onChange={(from) => definirPeriodo({ dataInicial: from, dataFinal: from > periodo.dataFinal ? from : periodo.dataFinal })}
                aria-label="Mês inicial"
              />
              <CampoSelecao
                rotulo="Até"
                opcoes={options}
                value={periodo.dataFinal}
                onChange={(to) => definirPeriodo({ dataInicial: to < periodo.dataInicial ? to : periodo.dataInicial, dataFinal: to })}
                aria-label="Mês final"
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
