import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { CSSProperties, FocusEvent, MouseEvent, PointerEvent, ReactNode } from 'react';
import { AlertTriangle, Check, Info, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { DISTANCIA_DESLIZE_DISPENSA_PX } from '@/constants/notificacoes';
import { focarConteudoPrincipal } from '@/utils/foco';
import { juntarClasses } from '@/utils/juntarClasses';
import styles from './Notificacao.module.css';

export type VarianteNotificacao = 'success' | 'error' | 'warning' | 'info';

export interface MensagemNotificacao {
  id: string;
  titulo: string;
  descricao?: string;
  variante: VarianteNotificacao;
  duracao: number;
  versao: number;
  saindo: boolean;
}

const iconePorVariante: Record<VarianteNotificacao, LucideIcon> = {
  success: Check,
  error: X,
  warning: AlertTriangle,
  info: Info,
};

const rotuloVariante: Record<VarianteNotificacao, string> = {
  success: 'Sucesso',
  error: 'Erro',
  warning: 'Atenção',
  info: 'Informação',
};

export interface ItemNotificacaoProps {
  notificacao: MensagemNotificacao;
  pausado: boolean;
  aoDispensar: (id: string) => void;
}

export function ItemNotificacao({ notificacao, pausado, aoDispensar }: ItemNotificacaoProps) {
  const { id, titulo, descricao, variante, duracao, versao, saindo } = notificacao;
  const Icon = iconePorVariante[variante];
  const [pressionado, setPressionado] = useState(false);
  const [deslize, setDeslize] = useState(0);
  const restante = useRef(duracao);
  const origemToque = useRef<number | null>(null);
  const parado = pausado || pressionado || saindo;

  useEffect(() => {
    restante.current = duracao;
  }, [versao, duracao]);

  useEffect(() => {
    if (parado) return undefined;
    const inicio = performance.now();
    const timer = window.setTimeout(() => aoDispensar(id), Math.max(restante.current, 0));
    return () => {
      window.clearTimeout(timer);
      restante.current -= performance.now() - inicio;
    };
  }, [parado, versao, id, aoDispensar]);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' || saindo) return;
    if ((event.target as HTMLElement).closest('button')) return;
    origemToque.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
    setPressionado(true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (origemToque.current === null) return;
    setDeslize(Math.max(0, event.clientX - origemToque.current));
  };

  const handlePointerEnd = () => {
    if (origemToque.current === null) return;
    origemToque.current = null;
    setPressionado(false);
    if (deslize >= DISTANCIA_DESLIZE_DISPENSA_PX) {
      aoDispensar(id);
      return;
    }
    setDeslize(0);
  };

  const handleClose = (event: MouseEvent<HTMLButtonElement>) => {
    const lista = event.currentTarget.closest('ol');
    const vizinhos = [...(lista?.querySelectorAll<HTMLButtonElement>('[data-fechar-notificacao]') ?? [])].filter(
      (botao) => botao !== event.currentTarget && !botao.closest('[data-saindo]'),
    );
    aoDispensar(id);
    const proximo = vizinhos[vizinhos.length - 1];
    if (proximo) proximo.focus();
    else focarConteudoPrincipal();
  };

  const estiloItem = {
    '--deslize': `${deslize}px`,
    '--deslize-fracao': Math.min(deslize / (DISTANCIA_DESLIZE_DISPENSA_PX * 4), 0.5),
  } as CSSProperties;

  return (
    <li
      className={juntarClasses(styles.item, saindo && styles.leaving)}
      style={estiloItem}
      data-saindo={saindo || undefined}
    >
      <div className={styles.clip}>
        <div
          className={juntarClasses(styles.toast, styles[variante], deslize > 0 && styles.dragging)}
          role={variante === 'error' ? 'alert' : 'status'}
          aria-atomic="true"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
        >
          <span className={styles.badge} aria-hidden="true">
            <Icon size={14} strokeWidth={2.5} />
          </span>
          <div className={styles.text}>
            <p className={styles.title}>
              <span className="visually-hidden">{rotuloVariante[variante]}: </span>
              {titulo}
            </p>
            {descricao ? <p className={styles.description}>{descricao}</p> : null}
          </div>
          <button
            type="button"
            className={styles.close}
            onClick={handleClose}
            aria-label="Fechar notificação"
            tabIndex={saindo ? -1 : undefined}
            data-fechar-notificacao
          >
            <X size={16} strokeWidth={2} aria-hidden="true" />
          </button>
          <span
            key={versao}
            className={juntarClasses(styles.progress, parado && styles.progressPaused)}
            style={{ animationDuration: `${duracao}ms` }}
            aria-hidden="true"
          />
        </div>
      </div>
    </li>
  );
}

export interface AreaNotificacoesProps {
  children: ReactNode;
  quantidade: number;
  aoPausar: (pausado: boolean) => void;
}

export function AreaNotificacoes({ children, quantidade, aoPausar }: AreaNotificacoesProps) {
  const areaRef = useRef<HTMLElement>(null);
  const [comMouse, setComMouse] = useState(false);
  const [comFoco, setComFoco] = useState(false);
  const [oculta, setOculta] = useState(() => document.visibilityState === 'hidden');

  useEffect(() => {
    const atualizar = () => setOculta(document.visibilityState === 'hidden');
    document.addEventListener('visibilitychange', atualizar);
    return () => document.removeEventListener('visibilitychange', atualizar);
  }, []);

  useEffect(() => {
    if (quantidade === 0) setComMouse(false);
    setComFoco(Boolean(areaRef.current?.contains(document.activeElement)));
  }, [quantidade]);

  const pausado = comMouse || comFoco || oculta;

  useEffect(() => {
    aoPausar(pausado);
  }, [pausado, aoPausar]);

  const handleBlur = (event: FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setComFoco(false);
  };

  return createPortal(
    <section
      ref={areaRef}
      className={styles.viewport}
      aria-label="Notificações"
      onPointerEnter={(event) => event.pointerType === 'mouse' && setComMouse(true)}
      onPointerLeave={(event) => event.pointerType === 'mouse' && setComMouse(false)}
      onFocus={() => setComFoco(true)}
      onBlur={handleBlur}
    >
      <ol className={styles.list} aria-live="polite" aria-relevant="additions">
        {children}
      </ol>
    </section>,
    document.body,
  );
}
