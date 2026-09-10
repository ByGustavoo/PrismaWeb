import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { CSSProperties, KeyboardEvent } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import { addDays, addMonths, fromISODate, fromMonthKey, toISODate, todayISO } from '@/utils/date';
import { capitalize, formatFullDate, formatMonthLabel, formatNumericDate } from '@/utils/format';
import styles from './DatePicker.module.css';

export interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  hint?: string;
  error?: string;
  min?: string;
  max?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md';
  id?: string;
  className?: string;
  'aria-label'?: string;
}

const PANEL_WIDTH = 292;
const PANEL_HEIGHT = 348;
const PANEL_GAP = 8;

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const WEEKS = 6;

function monthMatrix(monthKey: string): Array<Array<string | null>> {
  const first = fromMonthKey(monthKey);
  const offset = first.getDay();
  const total = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();

  const cells: Array<string | null> = Array.from({ length: offset }, () => null);
  for (let day = 1; day <= total; day += 1) {
    cells.push(toISODate(new Date(first.getFullYear(), first.getMonth(), day)));
  }
  while (cells.length < WEEKS * 7) cells.push(null);

  return Array.from({ length: WEEKS }, (_, row) => cells.slice(row * 7, row * 7 + 7));
}

export function DatePicker({
  value,
  onChange,
  label,
  hint,
  error,
  min,
  max,
  placeholder = 'dd/mm/aaaa',
  required = false,
  disabled = false,
  size = 'md',
  id,
  className,
  'aria-label': ariaLabel,
}: DatePickerProps) {
  const generatedId = useId();
  const baseId = id ?? generatedId;
  const gridId = `${baseId}-grid`;
  const monthId = `${baseId}-month`;
  const labelId = label ? `${baseId}-label` : undefined;
  const describedById = error ? `${baseId}-error` : hint ? `${baseId}-hint` : undefined;

  const today = todayISO();
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});
  const [cursor, setCursor] = useState(() => value || today);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const viewMonth = cursor.slice(0, 7);
  const weeks = useMemo(() => monthMatrix(viewMonth), [viewMonth]);

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
    setCursor((current) => toISODate(addDays(fromISODate(current), days)));
  }, []);

  const moveMonth = useCallback((months: number) => {
    setCursor((current) => {
      const date = fromISODate(current);
      const target = addMonths(date, months);
      const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
      return toISODate(new Date(target.getFullYear(), target.getMonth(), Math.min(date.getDate(), last)));
    });
  }, []);

  const position = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom - PANEL_GAP;
    const above = rect.top - PANEL_GAP;
    const flip = below < PANEL_HEIGHT && above > below;
    const left = Math.min(Math.max(PANEL_GAP, rect.left), window.innerWidth - PANEL_WIDTH - PANEL_GAP);

    setPanelStyle({
      left,
      width: PANEL_WIDTH,
      ...(flip ? { bottom: window.innerHeight - rect.top + PANEL_GAP } : { top: rect.bottom + PANEL_GAP }),
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
        moveCursor(-fromISODate(cursor).getDay());
        return;
      case 'End':
        event.preventDefault();
        moveCursor(6 - fromISODate(cursor).getDay());
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
    <div className={cn(styles.field, className)} ref={rootRef}>
      {label ? (
        <span className={styles.label} id={labelId}>
          {label}
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
        aria-invalid={error ? true : undefined}
        aria-required={required || undefined}
        disabled={disabled}
        className={cn(styles.trigger, styles[size], open && styles.triggerOpen, error && styles.triggerError)}
        onClick={() => (open ? setOpen(false) : openPanel())}
        onKeyDown={handleKeyDown}
      >
        <CalendarDays className={styles.icon} size={15} strokeWidth={2} aria-hidden="true" />

        <span className={cn(styles.value, !value && styles.placeholder, value && 'tabular')}>
          {value ? formatNumericDate(value) : placeholder}
        </span>
        {value ? <span className="visually-hidden">{formatFullDate(value)}</span> : null}
      </button>

      {open
        ? createPortal(
            <div ref={panelRef} className={styles.panel} style={panelStyle} role="dialog" aria-label="Escolher data">
              <header className={styles.head}>
                <button type="button" className={styles.nav} aria-label="Mês anterior" onClick={() => moveMonth(-1)}>
                  <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
                </button>

                <span className={styles.month} id={monthId} aria-live="polite">
                  {capitalize(formatMonthLabel(viewMonth))}
                </span>

                <button type="button" className={styles.nav} aria-label="Próximo mês" onClick={() => moveMonth(1)}>
                  <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
                </button>
              </header>

              <div className={styles.grid} role="grid" id={gridId} aria-labelledby={monthId}>
                <div className={styles.weekdays} role="row">
                  {WEEKDAYS.map((name, index) => (
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
                          className={cn(
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
                          {fromISODate(date).getDate()}
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
                <span className={cn(styles.cursorHint, 'tabular')}>{formatNumericDate(cursor)}</span>
              </footer>
            </div>,
            document.body,
          )
        : null}

      {error ? (
        <p className={styles.error} id={`${baseId}-error`}>
          {error}
        </p>
      ) : hint ? (
        <p className={styles.hint} id={`${baseId}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
