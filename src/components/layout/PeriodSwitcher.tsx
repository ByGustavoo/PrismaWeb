import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarRange, Check, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Select } from '@/components/ui';
import { usePeriod } from '@/providers/PeriodProvider';
import type { DashboardPeriod } from '@/services';
import type { Option } from '@/types';
import { cn } from '@/utils/cn';
import { monthKeyFromOffset, shiftMonthKey } from '@/utils/date';
import { capitalize, formatMonthLabel, formatPeriodLabel } from '@/utils/format';
import styles from './PeriodSwitcher.module.css';

/**
 * Quantos meses a lista do periodo personalizado oferece, contando o corrente.
 * Nao adianta oferecer mais do que o historico cobre: o seletor viraria um jeito
 * de chegar a um dashboard vazio.
 */
const CUSTOM_RANGE_MONTHS = 12;

interface Preset {
  id: string;
  label: string;
  resolve: (thisMonth: string) => DashboardPeriod;
}

const presets: Preset[] = [
  { id: 'this-month', label: 'Este mês', resolve: (m) => ({ from: m, to: m }) },
  {
    id: 'last-month',
    label: 'Mês passado',
    resolve: (m) => ({ from: shiftMonthKey(m, -1), to: shiftMonthKey(m, -1) }),
  },
  { id: 'last-3', label: 'Últimos 3 meses', resolve: (m) => ({ from: shiftMonthKey(m, -2), to: m }) },
  { id: 'last-6', label: 'Últimos 6 meses', resolve: (m) => ({ from: shiftMonthKey(m, -5), to: m }) },
  { id: 'this-year', label: 'Este ano', resolve: (m) => ({ from: `${m.slice(0, 4)}-01`, to: m }) },
];

function monthOptions(thisMonth: string): Option[] {
  return Array.from({ length: CUSTOM_RANGE_MONTHS }, (_, index) => {
    const value = shiftMonthKey(thisMonth, -(CUSTOM_RANGE_MONTHS - 1 - index));
    return { value, label: capitalize(formatMonthLabel(value)) };
  }).reverse();
}

/**
 * Recorte de tempo do dashboard. O caso comum — um mes de cada vez — fica nas
 * setas, e o painel guarda os periodos maiores, ate um intervalo proprio ("de
 * maio a agosto"). O periodo escolhido vive no `PeriodProvider`, fora da URL.
 */
export function PeriodSwitcher() {
  const { period, setPeriod, shiftPeriod } = usePeriod();
  const [open, setOpen] = useState(false);
  const [editingCustom, setEditingCustom] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const thisMonth = monthKeyFromOffset(0);
  const options = useMemo(() => monthOptions(thisMonth), [thisMonth]);

  const activePreset = presets.find((preset) => {
    const resolved = preset.resolve(thisMonth);
    return resolved.from === period.from && resolved.to === period.to;
  });

  const close = () => {
    setOpen(false);
    setEditingCustom(false);
  };

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      // A lista do Select vive num portal, fora deste no.
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
        <button type="button" className={styles.arrow} onClick={() => shiftPeriod(-1)} aria-label="Período anterior">
          <ChevronLeft size={16} strokeWidth={2} />
        </button>

        <button
          ref={triggerRef}
          type="button"
          className={cn(styles.label, open && styles.labelOpen)}
          onClick={() => (open ? close() : setOpen(true))}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <span className={styles.labelText}>{formatPeriodLabel(period.from, period.to)}</span>
          <ChevronDown className={cn(styles.chevron, open && styles.chevronOpen)} size={14} strokeWidth={2} />
        </button>

        <button type="button" className={styles.arrow} onClick={() => shiftPeriod(1)} aria-label="Próximo período">
          <ChevronRight size={16} strokeWidth={2} />
        </button>
      </div>

      {open ? (
        <div className={styles.panel} role="dialog" aria-label="Escolher período">
          <ul className={styles.presets}>
            {presets.map((preset) => {
              const selected = activePreset?.id === preset.id && !editingCustom;

              return (
                <li key={preset.id}>
                  <button
                    type="button"
                    className={cn(styles.preset, selected && styles.presetSelected)}
                    onClick={() => {
                      setPeriod(preset.resolve(thisMonth));
                      close();
                    }}
                  >
                    <span>{preset.label}</span>
                    {selected ? <Check size={15} strokeWidth={2.5} aria-hidden="true" /> : null}
                  </button>
                </li>
              );
            })}

            <li>
              <button
                type="button"
                className={cn(styles.preset, (editingCustom || !activePreset) && styles.presetSelected)}
                onClick={() => setEditingCustom(true)}
              >
                <span>Período personalizado</span>
                <CalendarRange size={15} strokeWidth={2} aria-hidden="true" />
              </button>
            </li>
          </ul>

          {editingCustom || !activePreset ? (
            <div className={styles.custom}>
              <Select
                label="De"
                options={options}
                value={period.from}
                onChange={(from) => setPeriod({ from, to: from > period.to ? from : period.to })}
                aria-label="Mês inicial"
              />
              <Select
                label="Até"
                options={options}
                value={period.to}
                onChange={(to) => setPeriod({ from: to < period.from ? to : period.from, to })}
                aria-label="Mês final"
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
