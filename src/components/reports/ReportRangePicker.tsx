import { CalendarRange } from 'lucide-react';
import { DatePicker, Select } from '@/components/ui';
import { reportRangeKeys, reportRangeLabel, reportRangeOptions } from '@/constants/reports';
import type { ReportRangeKey } from '@/constants/reports';
import { useIsCompact } from '@/hooks/useMediaQuery';
import type { ReportRange } from '@/types';
import { todayISO } from '@/utils/date';
import styles from './ReportRangePicker.module.css';

interface ReportRangePickerProps {
  value: ReportRangeKey;
  range: ReportRange;
  onSelect: (key: ReportRangeKey) => void;
  onRangeChange: (range: ReportRange) => void;
}

/**
 * Filtro de periodo da tela. Os seis recortes ficam a vista como botoes: eles
 * sao a acao principal desta tela — nao ha nada para cadastrar aqui —, e
 * escondidos num seletor cada troca custaria dois cliques em vez de um.
 *
 * Abaixo de 900px a fileira nao cabe sem apertar os rotulos, e ai o mesmo
 * conjunto vira um `Select`: a escolha continua inteira, so muda a forma.
 */
export function ReportRangePicker({ value, range, onSelect, onRangeChange }: ReportRangePickerProps) {
  const compact = useIsCompact();
  const today = todayISO();

  return (
    <div className={styles.picker}>
      {compact ? (
        <Select
          className={styles.select}
          size="sm"
          icon={CalendarRange}
          prefix="Período:"
          options={reportRangeOptions}
          value={value}
          onChange={(key) => onSelect(key as ReportRangeKey)}
          aria-label="Período do relatório"
        />
      ) : (
        <div className={styles.segments} role="group" aria-label="Período do relatório">
          {reportRangeKeys.map((key) => (
            <button
              key={key}
              type="button"
              className={styles.segment}
              aria-pressed={key === value}
              onClick={() => onSelect(key)}
            >
              {reportRangeLabel[key]}
            </button>
          ))}
        </div>
      )}

      {/*
        As duas datas so aparecem no recorte proprio. Fixas na linha, elas
        ficariam desabilitadas na maior parte do tempo — um controle presente
        que nao responde e pior que um ausente.
      */}
      {value === 'custom' ? (
        <div className={styles.dates}>
          <DatePicker
            size="sm"
            className={styles.date}
            value={range.from}
            max={range.to}
            onChange={(from) => onRangeChange({ ...range, from })}
            aria-label="Data inicial do relatório"
          />
          <span className={styles.separator} aria-hidden="true">
            até
          </span>
          <DatePicker
            size="sm"
            className={styles.date}
            value={range.to}
            min={range.from}
            max={today}
            onChange={(to) => onRangeChange({ ...range, to })}
            aria-label="Data final do relatório"
          />
        </div>
      ) : null}
    </div>
  );
}
