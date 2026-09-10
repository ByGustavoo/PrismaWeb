import { useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Menu, Moon, Plus, Search, Sun } from 'lucide-react';
import { Button } from '@/components/ui';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useTheme } from '@/providers/ThemeProvider';
import { NEW_TRANSACTION_PARAM, paths } from '@/routes/paths';
import { GlobalSearch } from './GlobalSearch';
import { HEADER_SLOT_ID } from './HeaderSlot';
import { NotificationsPanel } from './NotificationsPanel';
import { PeriodSwitcher } from './PeriodSwitcher';
import styles from './Header.module.css';

interface HeaderProps {
  onOpenMenu: () => void;
}

export function Header({ onOpenMenu }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const isMobile = useIsMobile();

  const closeAlerts = useCallback(() => setAlertsOpen(false), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  const showPeriodSwitcher = location.pathname === paths.dashboard && !isMobile;

  const pageOwnsControls = location.pathname.startsWith(paths.transactions);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <button type="button" className={styles.menuButton} onClick={onOpenMenu} aria-label="Abrir menu">
          <Menu size={20} strokeWidth={2} />
        </button>

        {showPeriodSwitcher ? <PeriodSwitcher /> : null}

        {pageOwnsControls ? (
          <div id={HEADER_SLOT_ID} className={styles.slot} />
        ) : (
          <GlobalSearch expanded={searchOpen} onCollapse={closeSearch} />
        )}

        <div className={styles.actions}>
          {pageOwnsControls ? null : (
            <button
              type="button"
              className={`${styles.iconButton} ${styles.searchButton}`}
              onClick={() => setSearchOpen(true)}
              aria-label="Buscar"
            >
              <Search size={18} strokeWidth={2} />
            </button>
          )}

          <button
            type="button"
            className={styles.iconButton}
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}
            title={theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}
          >
            {theme === 'dark' ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
          </button>

          <div className={styles.notifications}>
            <button
              type="button"
              data-notifications-trigger
              className={styles.iconButton}
              onClick={() => setAlertsOpen((value) => !value)}
              aria-label={alertCount > 0 ? `Avisos (${alertCount} exigem atenção)` : 'Avisos'}
              aria-expanded={alertsOpen}
              aria-haspopup="dialog"
            >
              <Bell size={18} strokeWidth={2} />
              {alertCount > 0 ? <span className={styles.badgeDot} aria-hidden="true" /> : null}
            </button>

            <NotificationsPanel open={alertsOpen} onClose={closeAlerts} onCountChange={setAlertCount} />
          </div>

          {pageOwnsControls ? null : (
            <Button
              className={styles.newButton}
              size="sm"
              icon={Plus}
              aria-label="Novo lançamento"
              onClick={() => navigate(`${paths.transactions}?${NEW_TRANSACTION_PARAM}=despesa`)}
            >
              <span className={styles.newLabel}>Novo lançamento</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
