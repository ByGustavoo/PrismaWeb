import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { APP_NAME, APP_TAGLINE } from '@/constants/app';
import { brandIcon as BrandIcon, navigation } from '@/constants/navigation';
import type { NavItem } from '@/constants/navigation';
import { cn } from '@/utils/cn';
import { initials } from '@/utils/format';
import styles from './Sidebar.module.css';

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
}

const currentUser = { name: 'Ana Ribeiro', email: 'ana@exemplo.com' };

export function Sidebar({ collapsed, mobileOpen, onToggleCollapse, onCloseMobile }: SidebarProps) {
  return (
    <>
      <div
        className={cn(styles.scrim, mobileOpen && styles.scrimVisible)}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      <aside
        className={cn(styles.sidebar, collapsed && styles.collapsed, mobileOpen && styles.mobileOpen)}
        aria-label="Navegacao principal"
      >
        <div className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">
            <BrandIcon size={18} strokeWidth={2} />
          </span>
          <span className={styles.brandText}>
            <span className={styles.brandName}>{APP_NAME}</span>
            <span className={styles.brandTagline}>{APP_TAGLINE}</span>
          </span>
          <button type="button" className={styles.closeMobile} onClick={onCloseMobile} aria-label="Fechar menu">
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <nav className={styles.nav}>
          {navigation.map((section, index) => (
            <div className={styles.section} key={section.title ?? `section-${index}`}>
              {section.title && !collapsed ? <p className={styles.sectionTitle}>{section.title}</p> : null}
              {section.items.map((item) => (
                <SidebarItem key={item.label} item={item} collapsed={collapsed} />
              ))}
            </div>
          ))}
        </nav>

        <div className={styles.footer}>
          <div className={styles.user}>
            <span className={styles.avatar} aria-hidden="true">
              {initials(currentUser.name)}
            </span>
            <span className={styles.userText}>
              <span className={styles.userName}>{currentUser.name}</span>
              <span className={styles.userEmail}>{currentUser.email}</span>
            </span>
          </div>

          <button
            type="button"
            className={styles.collapseButton}
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {collapsed ? <PanelLeftOpen size={18} strokeWidth={2} /> : <PanelLeftClose size={18} strokeWidth={2} />}
          </button>
        </div>
      </aside>
    </>
  );
}

interface SidebarItemProps {
  item: NavItem;
  collapsed: boolean;
}

function SidebarItem({ item, collapsed }: SidebarItemProps) {
  const location = useLocation();
  const Icon = item.icon;
  const hasChildren = Boolean(item.children?.length);
  const isChildActive = item.children?.some((child) => location.pathname === child.to) ?? false;
  const [open, setOpen] = useState(isChildActive);

  useEffect(() => {
    if (isChildActive) setOpen(true);
  }, [isChildActive]);

  if (!hasChildren || collapsed) {
    return (
      <NavLink
        to={item.to}
        end={item.to === '/'}
        title={collapsed ? item.label : undefined}
        className={({ isActive }) => cn(styles.item, (isActive || isChildActive) && styles.itemActive)}
      >
        <Icon className={styles.itemIcon} size={18} strokeWidth={2} />
        <span className={styles.itemLabel}>{item.label}</span>
      </NavLink>
    );
  }

  return (
    <div className={styles.group}>
      <button
        type="button"
        className={cn(styles.item, styles.groupTrigger, isChildActive && styles.itemActive)}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <Icon className={styles.itemIcon} size={18} strokeWidth={2} />
        <span className={styles.itemLabel}>{item.label}</span>
        <ChevronDown className={cn(styles.chevron, open && styles.chevronOpen)} size={15} strokeWidth={2} />
      </button>

      {open ? (
        <div className={styles.children}>
          {item.children?.map((child) => (
            <NavLink
              key={child.to}
              to={child.to}
              end
              className={({ isActive }) => cn(styles.child, isActive && styles.childActive)}
            >
              {child.label}
            </NavLink>
          ))}
        </div>
      ) : null}
    </div>
  );
}
