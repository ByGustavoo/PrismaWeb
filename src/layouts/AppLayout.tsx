import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header, Sidebar } from '@/components/layout';
import { SIDEBAR_STORAGE_KEY } from '@/constants/app';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useIsTablet } from '@/hooks/useMediaQuery';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';
import { cn } from '@/utils/cn';
import styles from './AppLayout.module.css';

export function AppLayout() {
  const [collapsed, setCollapsed] = useLocalStorage(SIDEBAR_STORAGE_KEY, false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isTablet = useIsTablet();
  const location = useLocation();

  // Fecha o drawer ao navegar.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useLockBodyScroll(mobileOpen && isTablet);

  return (
    <div className={cn(styles.shell, collapsed && styles.shellCollapsed)}>
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className={styles.main}>
        <Header onOpenMenu={() => setMobileOpen(true)} />
        <main className={styles.content}>
          <div className={styles.container}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
