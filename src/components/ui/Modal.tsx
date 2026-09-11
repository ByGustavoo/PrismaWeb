import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { useTravarRolagem } from '@/hooks/useTravarRolagem';
import { devolverFoco, manterTabDentro } from '@/utils/foco';
import { juntarClasses } from '@/utils/juntarClasses';
import { Botao } from './Botao';
import styles from './Modal.module.css';

export interface ModalProps {
  aberto: boolean;
  aoFechar: () => void;
  titulo: string;
  descricao?: string;
  tamanho?: 'sm' | 'md' | 'lg';
  rodape?: ReactNode;
  children: ReactNode;
}

export function Modal({ aberto, aoFechar, titulo, descricao, tamanho = 'md', rodape, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const descriptionId = `${baseId}-description`;

  useTravarRolagem(aberto);

  if (aberto && openerRef.current === null) {
    openerRef.current = document.activeElement as HTMLElement | null;
  }

  useEffect(() => {
    if (!aberto) return;

    const panel = panelRef.current;
    if (panel && !panel.contains(document.activeElement)) panel.focus();

    return () => {
      if (panel?.isConnected) return;
      const opener = openerRef.current;
      openerRef.current = null;
      devolverFoco(opener);
    };
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        aoFechar();
        return;
      }

      if (panelRef.current) manterTabDentro(event, panelRef.current);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [aberto, aoFechar]);

  if (!aberto) return null;

  return createPortal(
    <div className={styles.overlay} onMouseDown={aoFechar}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descricao ? descriptionId : undefined}
        tabIndex={-1}
        className={juntarClasses(styles.panel, styles[tamanho])}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <div>
            <h2 className={styles.title} id={titleId}>
              {titulo}
            </h2>
            {descricao ? (
              <p className={styles.description} id={descriptionId}>
                {descricao}
              </p>
            ) : null}
          </div>
          <Botao variante="ghost" tamanho="sm" icone={X} onClick={aoFechar} aria-label="Fechar" />
        </header>

        <div className={styles.content}>{children}</div>

        {rodape ? <footer className={styles.footer}>{rodape}</footer> : null}
      </div>
    </div>,
    document.body,
  );
}
