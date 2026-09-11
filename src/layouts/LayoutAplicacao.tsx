import { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Cabecalho, MenuLateral } from '@/components/layout';
import { CHAVE_MENU_LATERAL } from '@/constants/aplicacao';
import { useArmazenamentoLocal } from '@/hooks/useArmazenamentoLocal';
import { useEhTablet } from '@/hooks/useConsultaMidia';
import { useTravarRolagem } from '@/hooks/useTravarRolagem';
import { juntarClasses } from '@/utils/juntarClasses';
import styles from './LayoutAplicacao.module.css';

const ID_CONTEUDO = 'conteudo';

export function LayoutAplicacao() {
  const [collapsed, setCollapsed] = useArmazenamentoLocal(CHAVE_MENU_LATERAL, false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isTablet = useEhTablet();
  const location = useLocation();

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isTablet) setMobileOpen(false);
  }, [isTablet]);

  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen]);

  useTravarRolagem(mobileOpen && isTablet);

  return (
    <div className={juntarClasses(styles.shell, collapsed && styles.shellCollapsed)}>
      <a className="skip-link" href={`#${ID_CONTEUDO}`}>
        Pular para o conteúdo
      </a>

      <MenuLateral
        recolhido={collapsed}
        abertoNoMobile={mobileOpen}
        aoAlternarRecolhido={() => setCollapsed(!collapsed)}
        aoFecharMobile={closeMobile}
      />

      <div className={styles.main}>
        <Cabecalho aoAbrirMenu={() => setMobileOpen(true)} />
        <main className={styles.content} id={ID_CONTEUDO} tabIndex={-1}>
          <div className={styles.container}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
