import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { CSSProperties, KeyboardEvent } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { juntarClasses } from '@/utils/juntarClasses';
import { somarDias, somarMeses, deDataISO, deChaveMes, paraDataISO, hojeISO } from '@/utils/data';
import { capitalizar, formatarDataCompleta, formatarRotuloMes, formatarDataNumerica } from '@/utils/formatacao';
import styles from './SeletorData.module.css';

export interface SeletorDataProps {
  value: string;
  onChange: (value: string) => void;
  rotulo?: string;
  dica?: string;
  erro?: string;
  min?: string;
  max?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  tamanho?: 'sm' | 'md';
  id?: string;
  className?: string;
  'aria-label'?: string;
}

const LARGURA_PAINEL = 292;
const ALTURA_PAINEL = 348;
const ESPACO_PAINEL = 8;

const DIAS_DA_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const SEMANAS = 6;

function matrizDoMes(monthKey: string): Array<Array<string | null>> {
  const first = deChaveMes(monthKey);
  const offset = first.getDay();
  const total = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();

  const cells: Array<string | null> = Array.from({ length: offset }, () => null);
  for (let day = 1; day <= total; day += 1) {
    cells.push(paraDataISO(new Date(first.getFullYear(), first.getMonth(), day)));
  }
  while (cells.length < SEMANAS * 7) cells.push(null);

  return Array.from({ length: SEMANAS }, (_, row) => cells.slice(row * 7, row * 7 + 7));
}

export function SeletorData({
  value,
  onChange,
  rotulo,
  dica,
  erro,
  min,
  max,
  placeholder = 'dd/mm/aaaa',
  required = false,
  disabled = false,
  tamanho = 'md',
  id,
  className,
  'aria-label': ariaLabel,
}: SeletorDataProps) {
  const generatedId = useId();
  const baseId = id ?? generatedId;
  const gridId = `${baseId}-grid`;
  const monthId = `${baseId}-month`;
  const labelId = rotulo ? `${baseId}-label` : undefined;
  const describedById = erro ? `${baseId}-error` : dica ? `${baseId}-hint` : undefined;

  const today = hojeISO();
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});
  const [cursor, setCursor] = useState(() => value || today);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const viewMonth = cursor.slice(0, 7);
  const weeks = useMemo(() => matrizDoMes(viewMonth), [viewMonth]);

  const isBlocked = useCallback(
    (date: string) => (min !== undefined && min !== '' && date < min) || (max !== undefined && max !== '' && date > max),
    [max, min],
  );

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  const openPanel = useCallback(() => {
    if (disabled) return;
    setCursor(value || today);
    setOpen(true);
  }, [disabled, today, value]);

  const commit = useCallback(
    (date: string) => {
      if (isBlocked(date)) return;
      onChange(date);
      close();
    },
    [close, isBlocked, onChange],
  );

  const moveCursor = useCallback((days: number) => {
    setCursor((current) => paraDataISO(somarDias(deDataISO(current), days)));
  }, []);

  const moveMonth = useCallback((months: number) => {
    setCursor((current) => {
      const date = deDataISO(current);
      const target = somarMeses(date, months);
      const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
      return paraDataISO(new Date(target.getFullYear(), target.getMonth(), Math.min(date.getDate(), last)));
    });
  }, []);

  const position = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom - ESPACO_PAINEL;
    const above = rect.top - ESPACO_PAINEL;
    const flip = below < ALTURA_PAINEL && above > below;
    const left = Math.min(Math.max(ESPACO_PAINEL, rect.left), window.innerWidth - LARGURA_PAINEL - ESPACO_PAINEL);

    setPanelStyle({
      left,
      width: LARGURA_PAINEL,
      ...(flip ? { bottom: window.innerHeight - rect.top + ESPACO_PAINEL } : { top: rect.bottom + ESPACO_PAINEL }),
    });
  }, []);

  useLayoutEffect(() => {
    if (open) position();
  }, [open, position]);

  useEffect(() => {
    if (!open) return;

    const handleReposition = () => position();
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);
    return () => {
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [open, position]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (!open) {
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openPanel();
      }
      return;
    }

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        moveCursor(-1);
        return;
      case 'ArrowRight':
        event.preventDefault();
        moveCursor(1);
        return;
      case 'ArrowUp':
        event.preventDefault();
        moveCursor(-7);
        return;
      case 'ArrowDown':
        event.preventDefault();
        moveCursor(7);
        return;
      case 'Home':
        event.preventDefault();
        moveCursor(-deDataISO(cursor).getDay());
        return;
      case 'End':
        event.preventDefault();
        moveCursor(6 - deDataISO(cursor).getDay());
        return;
      case 'PageUp':
        event.preventDefault();
        moveMonth(-1);
        return;
      case 'PageDown':
        event.preventDefault();
        moveMonth(1);
        return;
      case 'Enter':
      case ' ':
        event.preventDefault();
        commit(cursor);
        return;
      case 'Escape':
        event.preventDefault();
        event.stopPropagation();
        close();
        return;
      case 'Tab':
        setOpen(false);
        return;
      default:
    }
  };

  return (
    <div className={juntarClasses(styles.field, className)} ref={rootRef}>
      {rotulo ? (
        <span className={styles.label} id={labelId}>
          {rotulo}
          {required ? (
            <span className={styles.required} aria-hidden="true">
              *
            </span>
          ) : null}
        </span>
      ) : null}

      <button
        ref={triggerRef}
        type="button"
        id={baseId}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? gridId : undefined}
        aria-activedescendant={open ? `${baseId}-day-${cursor}` : undefined}
        aria-labelledby={labelId}
        aria-label={ariaLabel}
        aria-describedby={describedById}
        aria-invalid={erro ? true : undefined}
        aria-required={required || undefined}
        disabled={disabled}
        className={juntarClasses(styles.trigger, styles[tamanho], open && styles.triggerOpen, erro && styles.triggerError)}
        onClick={() => (open ? setOpen(false) : openPanel())}
        onKeyDown={handleKeyDown}
      >
        <CalendarDays className={styles.icon} size={15} strokeWidth={2} aria-hidden="true" />

        <span className={juntarClasses(styles.value, !value && styles.placeholder, value && 'tabular')}>
          {value ? formatarDataNumerica(value) : placeholder}
        </span>
        {value ? <span className="visually-hidden">{formatarDataCompleta(value)}</span> : null}
      </button>

      {open
        ? createPortal(
            <div ref={panelRef} className={styles.panel} style={panelStyle} role="dialog" aria-label="Escolher data">
              <header className={styles.head}>
                <button type="button" className={styles.nav} aria-label="Mês anterior" onClick={() => moveMonth(-1)}>
                  <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
                </button>

                <span className={styles.month} id={monthId} aria-live="polite">
                  {capitalizar(formatarRotuloMes(viewMonth))}
                </span>

                <button type="button" className={styles.nav} aria-label="Próximo mês" onClick={() => moveMonth(1)}>
                  <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
                </button>
              </header>

              <div className={styles.grid} role="grid" id={gridId} aria-labelledby={monthId}>
                <div className={styles.weekdays} role="row">
                  {DIAS_DA_SEMANA.map((name, index) => (
                    <span key={index} role="columnheader" className={styles.weekday}>
                      {name}
                    </span>
                  ))}
                </div>

                {weeks.map((week, row) => (
                  <div key={row} className={styles.week} role="row">
                    {week.map((date, column) =>
                      date === null ? (
                        <span key={column} className={styles.blank} role="gridcell" aria-hidden="true" />
                      ) : (
                        <span
                          key={date}
                          id={`${baseId}-day-${date}`}
                          role="gridcell"
                          aria-selected={date === value}
                          aria-disabled={isBlocked(date) || undefined}
                          aria-current={date === today ? 'date' : undefined}
                          className={juntarClasses(
                            styles.day,
                            'tabular',
                            date === value && styles.selected,
                            date === today && styles.today,
                            date === cursor && styles.cursor,
                            isBlocked(date) && styles.blocked,
                          )}
                          onClick={() => commit(date)}
                          onPointerEnter={() => setCursor(date)}
                        >
                          {deDataISO(date).getDate()}
                        </span>
                      ),
                    )}
                  </div>
                ))}
              </div>

              <footer className={styles.foot}>
                <button
                  type="button"
                  className={styles.action}
                  disabled={isBlocked(today)}
                  onClick={() => commit(today)}
                >
                  Hoje
                </button>
                <span className={juntarClasses(styles.cursorHint, 'tabular')}>{formatarDataNumerica(cursor)}</span>
              </footer>
            </div>,
            document.body,
          )
        : null}

      {erro ? (
        <p className={styles.error} id={`${baseId}-error`}>
          {erro}
        </p>
      ) : dica ? (
        <p className={styles.hint} id={`${baseId}-hint`}>
          {dica}
        </p>
      ) : null}
    </div>
  );
}
