import { useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Menu, Moon, Plus, Search, Sun } from 'lucide-react';
import { Botao } from '@/components/ui';
import { useEhMobile } from '@/hooks/useConsultaMidia';
import { useTema } from '@/providers/ProvedorTema';
import { PARAMETRO_NOVO_LANCAMENTO, caminhos } from '@/routes/caminhos';
import { BuscaGlobal } from './BuscaGlobal';
import { ID_ESPACO_CABECALHO } from './EspacoCabecalho';
import { PainelAvisos } from './PainelAvisos';
import { SeletorPeriodo } from './SeletorPeriodo';
import styles from './Cabecalho.module.css';

interface CabecalhoProps {
  aoAbrirMenu: () => void;
}

export function Cabecalho({ aoAbrirMenu }: CabecalhoProps) {
  const { tema, alternarTema } = useTema();
  const navigate = useNavigate();
  const location = useLocation();
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const isMobile = useEhMobile();

  const closeAlerts = useCallback(() => setAlertsOpen(false), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  const showPeriodSwitcher = location.pathname === caminhos.dashboard && !isMobile;

  const pageOwnsControls = location.pathname.startsWith(caminhos.lancamentos);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <button type="button" className={styles.menuButton} onClick={aoAbrirMenu} aria-label="Abrir menu">
          <Menu size={20} strokeWidth={2} />
        </button>

        {showPeriodSwitcher ? <SeletorPeriodo /> : null}

        {pageOwnsControls ? (
          <div id={ID_ESPACO_CABECALHO} className={styles.slot} />
        ) : (
          <BuscaGlobal expandido={searchOpen} aoRecolher={closeSearch} />
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
            onClick={alternarTema}
            aria-label={tema === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}
            title={tema === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}
          >
            {tema === 'dark' ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
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

            <PainelAvisos aberto={alertsOpen} aoFechar={closeAlerts} aoMudarQuantidade={setAlertCount} />
          </div>

          {pageOwnsControls ? null : (
            <Botao
              className={styles.newButton}
              tamanho="sm"
              icone={Plus}
              aria-label="Novo lançamento"
              onClick={() => navigate(`${caminhos.lancamentos}?${PARAMETRO_NOVO_LANCAMENTO}=despesa`)}
            >
              <span className={styles.newLabel}>Novo lançamento</span>
            </Botao>
          )}
        </div>
      </div>
    </header>
  );
}
