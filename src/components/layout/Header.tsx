import { useState } from 'react';
import { Bell, ChevronLeft, ChevronRight, Menu, Moon, Plus, Search, Sun } from 'lucide-react';
import { Button } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';
import { useToast } from '@/providers/ToastProvider';
import { capitalize, formatMonthLabel } from '@/utils/format';
import { monthKeyFromOffset } from '@/utils/date';
import styles from './Header.module.css';

interface HeaderProps {
  onOpenMenu: () => void;
}

export function Header({ onOpenMenu }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const [monthOffset, setMonthOffset] = useState(0);

  const monthLabel = capitalize(formatMonthLabel(monthKeyFromOffset(monthOffset)));

  return (
    <header className={styles.header}>
      <button type="button" className={styles.menuButton} onClick={onOpenMenu} aria-label="Abrir menu">
        <Menu size={20} strokeWidth={2} />
      </button>

      <div className={styles.monthSwitcher}>
        <button
          type="button"
          className={styles.monthArrow}
          onClick={() => setMonthOffset((value) => value - 1)}
          aria-label="Mes anterior"
        >
          <ChevronLeft size={16} strokeWidth={2} />
        </button>
        <span className={styles.monthLabel}>{monthLabel}</span>
        <button
          type="button"
          className={styles.monthArrow}
          onClick={() => setMonthOffset((value) => value + 1)}
          aria-label="Proximo mes"
        >
          <ChevronRight size={16} strokeWidth={2} />
        </button>
      </div>

      <div className={styles.search}>
        <Search size={16} strokeWidth={2} className={styles.searchIcon} aria-hidden="true" />
        <input type="search" placeholder="Buscar lancamento, conta ou categoria" aria-label="Buscar" />
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.iconButton}
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}
          title={theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}
        >
          {theme === 'dark' ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
        </button>

        <button type="button" className={styles.iconButton} aria-label="Avisos">
          <Bell size={18} strokeWidth={2} />
          <span className={styles.badgeDot} aria-hidden="true" />
        </button>

        <Button
          size="sm"
          icon={Plus}
          onClick={() => toast.notify({ title: 'Novo lancamento chega na proxima etapa', variant: 'info' })}
        >
          Novo lancamento
        </Button>
      </div>
    </header>
  );
}
