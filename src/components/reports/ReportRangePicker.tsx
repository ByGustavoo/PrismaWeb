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
