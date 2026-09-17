import { CalendarRange } from 'lucide-react';
import { SeletorData, CampoSelecao } from '@/components/ui';
import { chavesPeriodoRelatorio, rotuloPeriodoRelatorio, opcoesPeriodoRelatorio } from '@/constants/relatorios';
import type { ChavePeriodoRelatorio } from '@/constants/relatorios';
import { useEhCompacto } from '@/hooks/useConsultaMidia';
import type { PeriodoRelatorio } from '@/types';
import { hojeISO } from '@/utils/data';
import styles from './SeletorPeriodoRelatorio.module.css';

interface SeletorPeriodoRelatorioProps {
  valor: ChavePeriodoRelatorio;
  periodo: PeriodoRelatorio;
  aoSelecionar: (key: ChavePeriodoRelatorio) => void;
  aoMudarPeriodo: (range: PeriodoRelatorio) => void;
}

export function SeletorPeriodoRelatorio({ valor, periodo, aoSelecionar, aoMudarPeriodo }: SeletorPeriodoRelatorioProps) {
  const compact = useEhCompacto();
  const today = hojeISO();

  return (
    <div className={styles.picker}>
      {compact ? (
        <CampoSelecao
          className={styles.select}
          larguraPelaMaiorOpcao
          tamanho="sm"
          icone={CalendarRange}
          prefixo="Período:"
          opcoes={opcoesPeriodoRelatorio}
          value={valor}
          onChange={(key) => aoSelecionar(key as ChavePeriodoRelatorio)}
          aria-label="Período do relatório"
        />
      ) : (
        <div className={styles.segments} role="group" aria-label="Período do relatório">
          {chavesPeriodoRelatorio.map((key) => (
            <button
              key={key}
              type="button"
              className={styles.segment}
              aria-pressed={key === valor}
              onClick={() => aoSelecionar(key)}
            >
              {rotuloPeriodoRelatorio[key]}
            </button>
          ))}
        </div>
      )}

      {valor === 'custom' ? (
        <div className={styles.dates}>
          <SeletorData
            tamanho="sm"
            className={styles.date}
            value={periodo.dataInicial}
            max={periodo.dataFinal}
            onChange={(from) => aoMudarPeriodo({ ...periodo, dataInicial: from })}
            aria-label="Data inicial do relatório"
          />
          <span className={styles.separator} aria-hidden="true">
            até
          </span>
          <SeletorData
            tamanho="sm"
            className={styles.date}
            value={periodo.dataFinal}
            min={periodo.dataInicial}
            max={today}
            onChange={(to) => aoMudarPeriodo({ ...periodo, dataFinal: to })}
            aria-label="Data final do relatório"
          />
        </div>
      ) : null}
    </div>
  );
}
