import { useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Menu, Moon, Plus, Sun } from 'lucide-react';
import { Button } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';
import { NEW_TRANSACTION_PARAM, paths } from '@/routes/paths';
import { GlobalSearch } from './GlobalSearch';
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

  // O painel monta uma vez e informa quantos avisos exigem atencao, para que o
  // ponto no sino nao dependa de o usuario abrir o painel antes.
  const closeAlerts = useCallback(() => setAlertsOpen(false), []);

  // O seletor so aparece onde ele muda alguma coisa. As demais telas ou nao tem
  // nocao de periodo ou tem o proprio filtro, como Lancamentos.
  const showPeriodSwitcher = location.pathname === paths.dashboard;

  return (
    <header className={styles.header}>
      <button type="button" className={styles.menuButton} onClick={onOpenMenu} aria-label="Abrir menu">
        <Menu size={20} strokeWidth={2} />
      </button>

      {showPeriodSwitcher ? <PeriodSwitcher /> : null}

      <GlobalSearch />

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

        <Button
          size="sm"
          icon={Plus}
          onClick={() => navigate(`${paths.transactions}?${NEW_TRANSACTION_PARAM}=despesa`)}
        >
          Novo lançamento
        </Button>
      </div>
    </header>
  );
}
