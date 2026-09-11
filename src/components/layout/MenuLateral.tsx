import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { NOME_APLICACAO, SLOGAN_APLICACAO } from '@/constants/aplicacao';
import { navegacao } from '@/constants/navegacao';
import { MarcaPrisma } from '@/components/comum';
import type { ItemNavegacao } from '@/constants/navegacao';
import { manterTabDentro } from '@/utils/foco';
import { juntarClasses } from '@/utils/juntarClasses';
import styles from './MenuLateral.module.css';

interface MenuLateralProps {
  recolhido: boolean;
  abertoNoMobile: boolean;
  aoAlternarRecolhido: () => void;
  aoFecharMobile: () => void;
}

export function MenuLateral({ recolhido, abertoNoMobile, aoAlternarRecolhido, aoFecharMobile }: MenuLateralProps) {
  const sidebarRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!abertoNoMobile) return;

    const sidebar = sidebarRef.current;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (sidebar) manterTabDentro(event, sidebar);
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      const focused = document.activeElement;
      const focusLeftWithMenu = !focused || focused === document.body || Boolean(sidebar?.contains(focused));
      if (focusLeftWithMenu && opener && !sidebar?.contains(opener)) opener.focus();
    };
  }, [abertoNoMobile]);

  return (
    <>
      <div
        className={juntarClasses(styles.scrim, abertoNoMobile && styles.scrimVisible)}
        onClick={aoFecharMobile}
        aria-hidden="true"
      />

      <aside
        ref={sidebarRef}
        className={juntarClasses(styles.sidebar, recolhido && styles.collapsed, abertoNoMobile && styles.mobileOpen)}
        aria-label="Navegação principal"
      >
        <div className={styles.brand}>
          <span className={styles.brandMark}>
            <MarcaPrisma tamanho={26} />
          </span>
          <span className={styles.brandText}>
            <span className={styles.brandName}>{NOME_APLICACAO}</span>
            <span className={styles.brandTagline}>{SLOGAN_APLICACAO}</span>
          </span>
          <button
            ref={closeButtonRef}
            type="button"
            className={styles.closeMobile}
            onClick={aoFecharMobile}
            aria-label="Fechar menu"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <nav className={styles.nav}>
          {navegacao.map((section, index) => (
            <div className={styles.section} key={section.titulo ?? `section-${index}`}>
              {section.titulo && !recolhido ? <p className={styles.sectionTitle}>{section.titulo}</p> : null}
              {section.itens.map((item) => (
                <ItemMenuLateral key={item.rotulo} item={item} recolhido={recolhido} />
              ))}
            </div>
          ))}
        </nav>

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.collapseButton}
            onClick={aoAlternarRecolhido}
            aria-label={recolhido ? 'Expandir menu' : 'Recolher menu'}
            title={recolhido ? 'Expandir menu' : 'Recolher menu'}
          >
            {recolhido ? <PanelLeftOpen size={18} strokeWidth={2} /> : <PanelLeftClose size={18} strokeWidth={2} />}
          </button>
        </div>
      </aside>
    </>
  );
}

interface ItemMenuLateralProps {
  item: ItemNavegacao;
  recolhido: boolean;
}

function ItemMenuLateral({ item, recolhido }: ItemMenuLateralProps) {
  const location = useLocation();
  const Icon = item.icone;
  const hasChildren = Boolean(item.filhos?.length);
  const isChildActive = item.filhos?.some((child) => location.pathname === child.destino) ?? false;
  const [open, setOpen] = useState(isChildActive);

  useEffect(() => {
    if (isChildActive) setOpen(true);
  }, [isChildActive]);

  if (!hasChildren || recolhido) {
    return (
      <NavLink
        to={item.destino}
        title={recolhido ? item.rotulo : undefined}
        className={({ isActive }) => juntarClasses(styles.item, (isActive || isChildActive) && styles.itemActive)}
      >
        <Icon className={styles.itemIcon} size={18} strokeWidth={2} />
        <span className={styles.itemLabel}>{item.rotulo}</span>
      </NavLink>
    );
  }

  return (
    <div className={styles.group}>
      <button
        type="button"
        className={juntarClasses(styles.item, styles.groupTrigger, isChildActive && styles.itemActive)}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <Icon className={styles.itemIcon} size={18} strokeWidth={2} />
        <span className={styles.itemLabel}>{item.rotulo}</span>
        <ChevronDown className={juntarClasses(styles.chevron, open && styles.chevronOpen)} size={15} strokeWidth={2} />
      </button>

      {open ? (
        <div className={styles.children}>
          {item.filhos?.map((child) => (
            <NavLink
              key={child.destino}
              to={child.destino}
              end
              className={({ isActive }) => juntarClasses(styles.child, isActive && styles.childActive)}
            >
              {child.rotulo}
            </NavLink>
          ))}
        </div>
      ) : null}
    </div>
  );
}
