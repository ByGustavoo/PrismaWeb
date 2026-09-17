import { useCallback, useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownLeft, CalendarClock, CreditCard, Receipt, Repeat, TriangleAlert } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ValorMonetario } from '@/components/comum';
import { EstadoVazio, IndicadorGiratorio } from '@/components/ui';
import { avisosService } from '@/services';
import { useDadosAssincronos } from '@/hooks/useDadosAssincronos';
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

  const fetchAlerts = useCallback((signal: AbortSignal) => avisosService.listar(signal), []);
  const { dados, carregando, erro } = useDadosAssincronos(fetchAlerts);

  const alerts = dados ?? [];
  const urgentCount = alerts.filter((alert) => alert.severidade !== 'INFO').length;

  useEffect(() => {
    aoMudarQuantidade(urgentCount);
  }, [urgentCount, aoMudarQuantidade]);

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

  if (!aberto) return null;

  return (
    <div ref={panelRef} className={styles.panel} role="dialog" aria-label="Avisos">
      <header className={styles.header}>
        <h2 className={styles.title}>Avisos</h2>
        {alerts.length > 0 ? (
          <span className={styles.count}>
            {alerts.length} {alerts.length === 1 ? 'aviso' : 'avisos'}
          </span>
        ) : null}
      </header>

      {carregando ? (
        <div className={styles.state}>
          <IndicadorGiratorio />
        </div>
      ) : erro ? (
        <div className={styles.state}>
          <EstadoVazio titulo="Não foi possível carregar os avisos" descricao={erro.message} />
        </div>
      ) : alerts.length === 0 ? (
        <div className={styles.state}>
          <EstadoVazio titulo="Nenhum aviso" descricao="Nada exige sua atenção no momento." />
        </div>
      ) : (
        <ul className={styles.list}>
          {alerts.map((alert, index) => (
            <LinhaAviso key={alert.id} aviso={alert} indice={index} aoNavegar={aoFechar} />
          ))}
        </ul>
      )}
    </div>
  );
}

interface LinhaAvisoProps {
  aviso: AvisoDTO;
  indice: number;
  aoNavegar: () => void;
}

function LinhaAviso({ aviso, indice, aoNavegar }: LinhaAvisoProps) {
  const Icon = iconePorTipo[aviso.tipo];

  const content = (
    <>
      <span className={juntarClasses(styles.icon, styles[classePorSeveridade[aviso.severidade]])} aria-hidden="true">
        <Icon size={15} strokeWidth={2} />
      </span>

      <span className={styles.text}>
        <span className={styles.alertTitle}>{aviso.titulo}</span>
        <span className={styles.description}>{aviso.descricao}</span>
      </span>

      <span className={styles.meta}>
        {aviso.valor === undefined ? null : <ValorMonetario valor={aviso.valor} tamanho="sm" tom="muted" />}
        <span className={juntarClasses(styles.date, 'tabular')}>{formatarDataCurta(aviso.data)}</span>
      </span>
    </>
  );

  return (
    <li className="list-item-in" style={{ '--i': indice } as CSSProperties}>
      {aviso.rota ? (
        <Link className={styles.item} to={aviso.rota} onClick={aoNavegar}>
          {content}
        </Link>
      ) : (
        <div className={styles.item}>{content}</div>
      )}
    </li>
  );
}
