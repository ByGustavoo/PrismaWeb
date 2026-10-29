import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent as KeyboardEventReact } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownLeft,
  CalendarClock,
  Check,
  CheckCheck,
  ChevronDown,
  Clock,
  CreditCard,
  PiggyBank,
  Receipt,
  Repeat,
  Tag,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Undo2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ValorMonetario } from '@/components/comum';
import { EstadoVazio, IndicadorGiratorio } from '@/components/ui';
import { opcoesAdiamentoAviso } from '@/constants/avisos';
import { avisosService } from '@/services';
import { useDadosAssincronos } from '@/hooks/useDadosAssincronos';
import { useAvisos } from '@/providers/ProvedorAvisos';
import { useNotificacoes } from '@/providers/ProvedorNotificacoes';
import { useTelas } from '@/providers/ProvedorTelas';
import type { AvisoDTO, SeveridadeAviso, TipoAviso } from '@/types';
import { juntarClasses } from '@/utils/juntarClasses';
import { formatarDataCurta } from '@/utils/formatacao';
import styles from './PainelAvisos.module.css';

const iconePorTipo: Record<TipoAviso, LucideIcon> = {
  FATURA_VENCENDO: Receipt,
  CONTA_VENCENDO: TriangleAlert,
  RECORRENTE_VENCENDO: Repeat,
  LANCAMENTO_AGENDADO: CalendarClock,
  RECEITA_PREVISTA: ArrowDownLeft,
  LIMITE_CARTAO: CreditCard,
  INVESTIMENTO_DESATUALIZADO: TrendingUp,
  ORCAMENTO_NO_LIMITE: PiggyBank,
  SALDO_NEGATIVO_PREVISTO: TrendingDown,
  META_SEM_PRECO: Tag,
};

const classePorSeveridade: Record<SeveridadeAviso, string> = {
  CRITICO: 'critical',
  ATENCAO: 'attention',
  INFO: 'info',
};

interface PainelAvisosProps {
  aberto: boolean;
  aoFechar: () => void;
  aoMudarQuantidade: (count: number) => void;
}

export function PainelAvisos({ aberto, aoFechar, aoMudarQuantidade }: PainelAvisosProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const pendingFocus = useRef<number | null>(null);
  const { versaoAvisos, atualizarAvisos } = useAvisos();
  const toast = useNotificacoes();
  const { estaOculto } = useTelas();
  const [local, setLocal] = useState<AvisoDTO[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [showRead, setShowRead] = useState(false);
  const readListId = useId();

  const fetchAlerts = useCallback((signal: AbortSignal) => avisosService.listar(signal), []);
  const { dados, carregando, erro } = useDadosAssincronos(fetchAlerts, [versaoAvisos]);

  useEffect(() => {
    setLocal(null);
  }, [dados]);

  const alerts = (local ?? dados ?? []).filter((alert) => !alert.rota || !estaOculto(alert.rota));
  const fresh = alerts.filter((alert) => alert.estado === 'NOVO');
  const read = alerts.filter((alert) => alert.estado !== 'NOVO');

  useEffect(() => {
    aoMudarQuantidade(fresh.length);
  }, [fresh.length, aoMudarQuantidade]);

  useEffect(() => {
    if (pendingFocus.current === null || !panelRef.current) return;
    const links = panelRef.current.querySelectorAll<HTMLAnchorElement>('[data-aviso-novo]');
    const target = links[Math.min(pendingFocus.current, links.length - 1)];
    pendingFocus.current = null;
    (target ?? titleRef.current)?.focus();
  }, [fresh.length]);

  useEffect(() => {
    if (!aberto) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if ((target as HTMLElement).closest?.('[data-notifications-trigger]')) return;
      aoFechar();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') aoFechar();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [aberto, aoFechar]);

  const replace = (updated: AvisoDTO) =>
    setLocal((current) => (current ?? dados ?? []).map((alert) => (alert.id === updated.id ? updated : alert)));

  const markAsRead = async (alert: AvisoDTO) => {
    setBusyId(alert.id);
    try {
      const updated = await avisosService.marcarComoLido(alert.id);
      pendingFocus.current = fresh.findIndex((item) => item.id === alert.id);
      replace(updated);
      atualizarAvisos();
    } catch (causa) {
      toast.erro('Não foi possível marcar o aviso como lido.', causa);
    } finally {
      setBusyId(null);
    }
  };

  const snooze = async (alert: AvisoDTO, dias: number) => {
    setBusyId(alert.id);
    try {
      const updated = await avisosService.adiar(alert.id, { dias });
      pendingFocus.current = fresh.findIndex((item) => item.id === alert.id);
      replace(updated);
      atualizarAvisos();
      toast.sucesso(
        'Aviso adiado!',
        updated.adiadoAte ? `${alert.titulo} volta ao sino em ${formatarDataCurta(updated.adiadoAte)}.` : alert.titulo,
      );
    } catch (causa) {
      toast.erro('Não foi possível adiar o aviso.', causa);
    } finally {
      setBusyId(null);
    }
  };

  const restore = async (alert: AvisoDTO) => {
    setBusyId(alert.id);
    try {
      await avisosService.devolverAosNovos(alert.id);
      replace({ ...alert, estado: 'NOVO', adiadoAte: undefined });
      atualizarAvisos();
    } catch (causa) {
      toast.erro('Não foi possível devolver o aviso aos novos.', causa);
    } finally {
      setBusyId(null);
    }
  };

  const markAllAsRead = async () => {
    setMarkingAll(true);
    try {
      const updated = await avisosService.marcarTodosComoLidos();
      pendingFocus.current = 0;
      setLocal(updated);
      atualizarAvisos();
    } catch (causa) {
      toast.erro('Não foi possível marcar os avisos como lidos.', causa);
    } finally {
      setMarkingAll(false);
    }
  };

  if (!aberto) return null;

  return (
    <div ref={panelRef} className={styles.panel} role="dialog" aria-label="Avisos">
      <header className={styles.header}>
        <div className={styles.heading}>
          <h2 ref={titleRef} className={styles.title} tabIndex={-1}>
            Avisos
          </h2>
          {dados ? (
            <span className={styles.count}>
              {fresh.length === 0 ? 'Nenhum novo' : fresh.length === 1 ? '1 novo' : `${fresh.length} novos`}
            </span>
          ) : null}
        </div>
        {fresh.length > 0 ? (
          <button type="button" className={styles.markAll} onClick={markAllAsRead} disabled={markingAll}>
            {markingAll ? <IndicadorGiratorio tamanho={13} /> : <CheckCheck size={15} strokeWidth={2} aria-hidden="true" />}
            Marcar todos como lidos
          </button>
        ) : null}
      </header>

      {carregando && !dados ? (
        <div className={styles.state}>
          <IndicadorGiratorio />
        </div>
      ) : erro && !dados ? (
        <div className={styles.state}>
          <EstadoVazio titulo="Não foi possível carregar os avisos" descricao={erro.message} />
        </div>
      ) : alerts.length === 0 ? (
        <div className={styles.state}>
          <EstadoVazio titulo="Nenhum aviso" descricao="Nada exige sua atenção no momento." />
        </div>
      ) : (
        <div className={styles.scroll}>
          {fresh.length === 0 ? (
            <div className={styles.allRead}>
              <EstadoVazio titulo="Tudo lido" descricao="Os avisos voltam aqui quando a situação deles mudar." />
            </div>
          ) : (
            <ul className={styles.list}>
              {fresh.map((alert, index) => (
                <LinhaAviso
                  key={alert.id}
                  aviso={alert}
                  indice={index}
                  ocupado={busyId === alert.id}
                  aoNavegar={aoFechar}
                  aoMarcarComoLido={() => markAsRead(alert)}
                  aoAdiar={(dias) => snooze(alert, dias)}
                />
              ))}
            </ul>
          )}

          {read.length > 0 ? (
            <section className={styles.readSection}>
              <button
                type="button"
                className={styles.readToggle}
                aria-expanded={showRead}
                aria-controls={readListId}
                onClick={() => setShowRead((value) => !value)}
              >
                <span>
                  Lidos e adiados <span className={juntarClasses(styles.readCount, 'tabular')}>{read.length}</span>
                </span>
                <ChevronDown
                  className={juntarClasses(styles.chevron, showRead && styles.chevronOpen)}
                  size={15}
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </button>
              {showRead ? (
                <ul className={juntarClasses(styles.list, styles.readList)} id={readListId}>
                  {read.map((alert, index) => (
                    <LinhaAviso
                      key={alert.id}
                      aviso={alert}
                      indice={index}
                      ocupado={busyId === alert.id}
                      aoNavegar={aoFechar}
                      aoDevolver={() => restore(alert)}
                    />
                  ))}
                </ul>
              ) : null}
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}

interface LinhaAvisoProps {
  aviso: AvisoDTO;
  indice: number;
  ocupado: boolean;
  aoNavegar: () => void;
  aoMarcarComoLido?: () => void;
  aoAdiar?: (dias: number) => void;
  aoDevolver?: () => void;
}

function LinhaAviso({ aviso, indice, ocupado, aoNavegar, aoMarcarComoLido, aoAdiar, aoDevolver }: LinhaAvisoProps) {
  const [choosingSnooze, setChoosingSnooze] = useState(false);
  const snoozeRef = useRef<HTMLDivElement>(null);
  const snoozeTriggerRef = useRef<HTMLButtonElement>(null);
  const Icon = iconePorTipo[aviso.tipo];
  const fresh = aviso.estado === 'NOVO';

  useEffect(() => {
    if (choosingSnooze) snoozeRef.current?.querySelector('button')?.focus();
  }, [choosingSnooze]);

  const closeSnooze = (event: KeyboardEventReact) => {
    if (event.key !== 'Escape') return;
    event.stopPropagation();
    event.nativeEvent.stopImmediatePropagation();
    setChoosingSnooze(false);
    snoozeTriggerRef.current?.focus();
  };

  const stateLabel =
    aviso.estado === 'ADIADO' && aviso.adiadoAte ? `Adiado até ${formatarDataCurta(aviso.adiadoAte)}` : aviso.estado === 'LIDO' ? 'Lido' : null;

  const content = (
    <>
      <span className={juntarClasses(styles.icon, styles[classePorSeveridade[aviso.severidade]])} aria-hidden="true">
        <Icon size={15} strokeWidth={2} />
      </span>

      <span className={styles.text}>
        <span className={styles.alertTitle}>{aviso.titulo}</span>
        <span className={styles.description}>{aviso.descricao}</span>
        {stateLabel ? <span className={styles.stateLabel}>{stateLabel}</span> : null}
      </span>

      <span className={styles.meta}>
        {aviso.valor === undefined ? null : <ValorMonetario valor={aviso.valor} tamanho="sm" tom="muted" />}
        <span className={juntarClasses(styles.date, 'tabular')}>{formatarDataCurta(aviso.data)}</span>
      </span>
    </>
  );

  return (
    <li
      className={juntarClasses(styles.row, 'list-item-in', !fresh && styles.rowRead, ocupado && styles.rowBusy)}
      style={{ '--i': indice } as CSSProperties}
      aria-busy={ocupado}
    >
      {aviso.rota ? (
        <Link className={styles.item} to={aviso.rota} onClick={aoNavegar} {...(fresh ? { 'data-aviso-novo': '' } : {})}>
          {content}
        </Link>
      ) : (
        <div className={styles.item} tabIndex={fresh ? 0 : undefined} {...(fresh ? { 'data-aviso-novo': '' } : {})}>
          {content}
        </div>
      )}

      <div className={styles.actions}>
        {aoMarcarComoLido ? (
          <button
            type="button"
            className={styles.action}
            onClick={aoMarcarComoLido}
            disabled={ocupado}
            aria-label={`Marcar como lido: ${aviso.titulo}`}
            title="Marcar como lido"
          >
            <Check size={15} strokeWidth={2.25} aria-hidden="true" />
            <span className={styles.actionLabel}>Lido</span>
          </button>
        ) : null}
        {aoAdiar ? (
          <button
            ref={snoozeTriggerRef}
            type="button"
            className={styles.action}
            onClick={() => setChoosingSnooze((value) => !value)}
            disabled={ocupado}
            aria-expanded={choosingSnooze}
            aria-label={`Adiar: ${aviso.titulo}`}
            title="Adiar"
          >
            <Clock size={15} strokeWidth={2} aria-hidden="true" />
            <span className={styles.actionLabel}>Adiar</span>
          </button>
        ) : null}
        {aoDevolver ? (
          <button
            type="button"
            className={styles.action}
            onClick={aoDevolver}
            disabled={ocupado}
            aria-label={`Voltar aos novos: ${aviso.titulo}`}
            title="Voltar aos novos"
          >
            <Undo2 size={15} strokeWidth={2} aria-hidden="true" />
            <span className={styles.actionLabel}>Voltar aos novos</span>
          </button>
        ) : null}
      </div>

      {choosingSnooze && aoAdiar ? (
        <div ref={snoozeRef} className={styles.snooze} role="group" aria-label="Lembrar de novo" onKeyDown={closeSnooze}>
          <span className={styles.snoozeLabel}>Lembrar de novo</span>
          {opcoesAdiamentoAviso.map((option) => (
            <button
              key={option.dias}
              type="button"
              className={styles.snoozeOption}
              onClick={() => {
                setChoosingSnooze(false);
                aoAdiar(option.dias);
              }}
            >
              {option.rotulo}
            </button>
          ))}
        </div>
      ) : null}
    </li>
  );
}
