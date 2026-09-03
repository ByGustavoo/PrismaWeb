import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Option } from '@/types';
import styles from './Select.module.css';

export interface SelectProps {
  options: Option[];
  /** Controlado. Sem ele o componente guarda o proprio valor. */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  label?: string;
  hint?: string;
  error?: string;
  /** Texto exibido quando nenhuma opcao esta escolhida. */
  placeholder?: string;
  /** Rotulo fixo antes do valor no gatilho: "Conta: Todas as contas". */
  prefix?: string;
  icon?: LucideIcon;
  disabled?: boolean;
  id?: string;
  className?: string;
  'aria-label'?: string;
}

/**
 * Select proprio, no lugar do <select> nativo: o navegador desenha a lista do
 * elemento nativo com as cores do sistema e ignora os tokens do tema, o que
 * deixava as opcoes ilegiveis no tema escuro. Aqui a lista e HTML comum, entao
 * segue o design system nos dois temas.
 *
 * A navegacao segue o padrao de combobox: o foco permanece no gatilho e a opcao
 * ativa e anunciada por aria-activedescendant.
 */
export function Select({
  options,
  value,
  defaultValue,
  onChange,
  label,
  hint,
  error,
  placeholder = 'Selecione',
  prefix,
  icon: Icon,
  disabled = false,
  id,
  className,
  'aria-label': ariaLabel,
}: SelectProps) {
  const generatedId = useId();
  const baseId = id ?? generatedId;
  const listId = `${baseId}-list`;
  const labelId = label ? `${baseId}-label` : undefined;
  const describedById = error ? `${baseId}-error` : hint ? `${baseId}-hint` : undefined;

  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const currentValue = value ?? internalValue;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typeahead = useRef({ term: '', at: 0 });

  const selectedIndex = useMemo(
    () => options.findIndex((option) => option.value === currentValue),
    [options, currentValue],
  );
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

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
      const option = options[index];
      if (!option) return;
      if (value === undefined) setInternalValue(option.value);
      onChange?.(option.value);
      close();
    },
    [close, onChange, options, value],
  );

  // Fecha ao clicar fora sem roubar o clique do alvo.
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  // Mantem a opcao ativa visivel durante a navegacao pelo teclado.
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex]);

  const moveActive = useCallback(
    (delta: number) => {
      setActiveIndex((current) => {
        if (options.length === 0) return current;
        const next = current + delta;
        if (next < 0) return 0;
        if (next > options.length - 1) return options.length - 1;
        return next;
      });
    },
    [options.length],
  );

  const handleTypeahead = useCallback(
    (char: string) => {
      const now = Date.now();
      const state = typeahead.current;
      state.term = now - state.at > 700 ? char : state.term + char;
      state.at = now;

      const term = state.term.toLowerCase();
      const match = options.findIndex((option) => option.label.toLowerCase().startsWith(term));
      if (match < 0) return;

      setActiveIndex(match);
      if (!open) commit(match);
    },
    [commit, open, options],
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
        setActiveIndex(options.length - 1);
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
    <div className={cn(styles.field, className)} ref={rootRef}>
      {label ? (
        <span className={styles.label} id={labelId}>
          {label}
        </span>
      ) : null}

      <div className={styles.anchor}>
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
          aria-invalid={error ? true : undefined}
          disabled={disabled}
          className={cn(styles.trigger, open && styles.triggerOpen, error && styles.triggerError)}
          onClick={() => (open ? setOpen(false) : openMenu())}
          onKeyDown={handleKeyDown}
        >
          {Icon ? <Icon className={styles.icon} size={15} strokeWidth={2} aria-hidden="true" /> : null}

          <span className={styles.text}>
            {prefix ? <span className={styles.prefix}>{prefix}</span> : null}
            <span className={cn(styles.value, !selected && styles.placeholder)}>{selected?.label ?? placeholder}</span>
          </span>

          <ChevronDown
            className={cn(styles.chevron, open && styles.chevronOpen)}
            size={16}
            strokeWidth={2}
            aria-hidden="true"
          />
        </button>

        {open ? (
          <ul ref={listRef} id={listId} role="listbox" aria-labelledby={labelId} className={styles.menu} tabIndex={-1}>
            {options.map((option, index) => {
              const isSelected = option.value === currentValue;
              const isActive = index === activeIndex;

              return (
                <li
                  key={option.value}
                  id={`${baseId}-option-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  data-active={isActive}
                  className={cn(styles.option, isActive && styles.optionActive, isSelected && styles.optionSelected)}
                  onPointerEnter={() => setActiveIndex(index)}
                  onClick={() => commit(index)}
                >
                  <span className={styles.optionLabel}>{option.label}</span>
                  {isSelected ? <Check className={styles.check} size={15} strokeWidth={2.5} aria-hidden="true" /> : null}
                </li>
              );
            })}

            {options.length === 0 ? <li className={styles.emptyOption}>Nenhuma opção disponível</li> : null}
          </ul>
        ) : null}
      </div>

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
