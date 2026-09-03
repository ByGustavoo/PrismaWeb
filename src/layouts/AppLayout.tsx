import { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header, Sidebar } from '@/components/layout';
import { SIDEBAR_STORAGE_KEY } from '@/constants/app';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useIsTablet } from '@/hooks/useMediaQuery';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';
import { cn } from '@/utils/cn';
import styles from './AppLayout.module.css';

/** Alvo do link de salto; tambem serve de ancora para voltar ao topo. */
const CONTENT_ID = 'conteudo';

export function AppLayout() {
  const [collapsed, setCollapsed] = useLocalStorage(SIDEBAR_STORAGE_KEY, false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isTablet = useIsTablet();
  const location = useLocation();

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  // Fecha o drawer ao navegar.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Esc fecha o drawer: quem abriu pelo teclado precisa poder sair por ele.
  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen]);

  useLockBodyScroll(mobileOpen && isTablet);

  return (
    <div className={cn(styles.shell, collapsed && styles.shellCollapsed)}>
      <a className="skip-link" href={`#${CONTENT_ID}`}>
        Pular para o conteúdo
      </a>

      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        onCloseMobile={closeMobile}
      />

      <div className={styles.main}>
        <Header onOpenMenu={() => setMobileOpen(true)} />
        <main className={styles.content} id={CONTENT_ID} tabIndex={-1}>
          <div className={styles.container}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
