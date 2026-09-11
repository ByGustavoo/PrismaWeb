import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { CSSProperties, KeyboardEvent } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { juntarClasses } from '@/utils/juntarClasses';
import type { Opcao } from '@/types';
import styles from './CampoSelecao.module.css';

export interface CampoSelecaoProps {
  opcoes: Opcao[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  rotulo?: string;
  dica?: string;
  erro?: string;
  placeholder?: string;
  prefixo?: string;
  tamanho?: 'sm' | 'md';
  icone?: LucideIcon;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  className?: string;
  'aria-label'?: string;
}

const ALTURA_MAXIMA_MENU = 288;
const ESPACO_MENU = 8;

export function CampoSelecao({
  opcoes,
  value,
  defaultValue,
  onChange,
  rotulo,
  dica,
  erro,
  placeholder = 'Selecione',
  prefixo,
  tamanho = 'md',
  icone: Icon,
  disabled = false,
  required = false,
  id,
  className,
  'aria-label': ariaLabel,
}: CampoSelecaoProps) {
  const generatedId = useId();
  const baseId = id ?? generatedId;
  const listId = `${baseId}-list`;
  const labelId = rotulo ? `${baseId}-label` : undefined;
  const describedById = erro ? `${baseId}-error` : dica ? `${baseId}-hint` : undefined;

  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const currentValue = value ?? internalValue;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typeahead = useRef({ term: '', at: 0 });

  const selectedIndex = useMemo(
    () => opcoes.findIndex((option) => option.valor === currentValue),
    [opcoes, currentValue],
  );
  const selected = selectedIndex >= 0 ? opcoes[selectedIndex] : undefined;

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  const openMenu = useCallback(() => {
    if (disabled) return;
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  }, [disabled, selectedIndex]);

  const commit = useCallback(
    (index: number) => {
      const option = opcoes[index];
      if (!option) return;
      if (value === undefined) setInternalValue(option.valor);
      onChange?.(option.valor);
      close();
    },
    [close, onChange, opcoes, value],
  );

  const position = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom - ESPACO_MENU;
    const above = rect.top - ESPACO_MENU;
    const flip = below < Math.min(ALTURA_MAXIMA_MENU, above) && above > below;

    setMenuStyle({
      left: rect.left,
      width: rect.width,
      maxHeight: Math.min(ALTURA_MAXIMA_MENU, Math.max(flip ? above : below, 120)),
      ...(flip ? { bottom: window.innerHeight - rect.top + ESPACO_MENU } : { top: rect.bottom + ESPACO_MENU }),
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
      if (rootRef.current?.contains(target) || listRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex]);

  const moveActive = useCallback(
    (delta: number) => {
      setActiveIndex((current) => {
        if (opcoes.length === 0) return current;
        const next = current + delta;
        if (next < 0) return 0;
        if (next > opcoes.length - 1) return opcoes.length - 1;
        return next;
      });
    },
    [opcoes.length],
  );

  const handleTypeahead = useCallback(
    (char: string) => {
      const now = Date.now();
      const state = typeahead.current;
      state.term = now - state.at > 700 ? char : state.term + char;
      state.at = now;

      const term = state.term.toLowerCase();
      const match = opcoes.findIndex((option) => option.rotulo.toLowerCase().startsWith(term));
      if (match < 0) return;

      setActiveIndex(match);
      if (!open) commit(match);
    },
    [commit, open, opcoes],
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (open) moveActive(1);
        else openMenu();
        return;
      case 'ArrowUp':
        event.preventDefault();
        if (open) moveActive(-1);
        else openMenu();
        return;
      case 'Home':
        if (!open) return;
        event.preventDefault();
        setActiveIndex(0);
        return;
      case 'End':
        if (!open) return;
        event.preventDefault();
        setActiveIndex(opcoes.length - 1);
        return;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (open) commit(activeIndex);
        else openMenu();
        return;
      case 'Escape':
        if (!open) return;
        event.preventDefault();
        event.stopPropagation();
        close();
        return;
      case 'Tab':
        if (open) setOpen(false);
        return;
      default:
        if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
          event.preventDefault();
          handleTypeahead(event.key);
        }
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
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open ? `${baseId}-option-${activeIndex}` : undefined}
        aria-labelledby={labelId}
        aria-label={ariaLabel}
        aria-describedby={describedById}
        aria-invalid={erro ? true : undefined}
        aria-required={required || undefined}
        disabled={disabled}
        className={juntarClasses(
          styles.trigger,
          styles[tamanho],
          open && styles.triggerOpen,
          erro && styles.triggerError,
        )}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={handleKeyDown}
      >
        {Icon ? <Icon className={styles.icon} size={15} strokeWidth={2} aria-hidden="true" /> : null}

        <span className={styles.text}>
          {prefixo ? <span className={styles.prefix}>{prefixo}</span> : null}
          <span className={juntarClasses(styles.value, !selected && styles.placeholder)}>{selected?.rotulo ?? placeholder}</span>
        </span>

        <ChevronDown
          className={juntarClasses(styles.chevron, open && styles.chevronOpen)}
          size={16}
          strokeWidth={2}
          aria-hidden="true"
        />
      </button>

      {open
        ? createPortal(
            <ul
              ref={listRef}
              id={listId}
              role="listbox"
              aria-labelledby={labelId}
              className={styles.menu}
              style={menuStyle}
              tabIndex={-1}
            >
              {opcoes.map((option, index) => {
                const isSelected = option.valor === currentValue;
                const isActive = index === activeIndex;

                return (
                  <li
                    key={option.valor}
                    id={`${baseId}-option-${index}`}
                    role="option"
                    aria-selected={isSelected}
                    data-active={isActive}
                    className={juntarClasses(styles.option, isActive && styles.optionActive, isSelected && styles.optionSelected)}
                    onPointerEnter={() => setActiveIndex(index)}
                    onClick={() => commit(index)}
                  >
                    <span className={styles.optionLabel}>{option.rotulo}</span>
                    {isSelected ? (
                      <Check className={styles.check} size={15} strokeWidth={2.5} aria-hidden="true" />
                    ) : null}
                  </li>
                );
              })}

              {opcoes.length === 0 ? <li className={styles.emptyOption}>Nenhuma opção disponível</li> : null}
            </ul>,
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
