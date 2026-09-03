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

  // O painel monta uma vez e informa quantos avisos exigem atencao, para que o
  // ponto no sino nao dependa de o usuario abrir o painel antes.
  const closeAlerts = useCallback(() => setAlertsOpen(false), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  // O seletor so aparece onde ele muda alguma coisa. As demais telas ou nao tem
  // nocao de periodo ou tem o proprio filtro, como Lancamentos.
  //
  // No celular ele sai daqui: o header ja carrega menu, busca, tema, avisos e a
  // acao principal, e o seletor ficava com largura para escrever "Sete...". Quem
  // o exibe nessa faixa e o proprio dashboard, junto dos controles da tela.
  const showPeriodSwitcher = location.pathname === paths.dashboard && !isMobile;

  // Pelo mesmo motivo, o header cede a busca e a acao principal onde a tela ja
  // traz as suas. Em Lancamentos a caixa dos filtros peneira a lista a cada
  // tecla — duas caixas quase iguais, uma que navega e outra que filtra, so
  // fazem escolher errado — e o cadastro ja aparece logo abaixo, separado por
  // tipo, do qual "Novo lancamento" seria so um quarto caminho para o mesmo
  // formulario. O campo da tela ocupa o espaco da busca pelo HeaderSlot.
  const pageOwnsControls = location.pathname.startsWith(paths.transactions);

  return (
    <header className={styles.header}>
      <button type="button" className={styles.menuButton} onClick={onOpenMenu} aria-label="Abrir menu">
        <Menu size={20} strokeWidth={2} />
      </button>

      {showPeriodSwitcher ? <PeriodSwitcher /> : null}

      {pageOwnsControls ? (
        // Espaco a disposicao da tela, preenchido por HeaderSlot. Ver o
        // comentario la.
        <div id={HEADER_SLOT_ID} className={styles.slot} />
      ) : (
        <GlobalSearch expanded={searchOpen} onCollapse={closeSearch} />
      )}

      <div className={styles.actions}>
        {/*
         * Em tela estreita o campo nao cabe ao lado das acoes, entao ele vira
         * este botao, que abre a busca sobre o header. Esconder a busca sem
         * substituto tirava do celular o caminho mais curto para um lancamento.
         */}
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

        {/*
         * No celular o rotulo sai e sobra o "+", mas a acao continua a mesma e o
         * nome acessivel nao depende do texto visivel.
         */}
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
    </header>
  );
}
