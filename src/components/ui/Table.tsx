import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';
import styles from './Table.module.css';

export function TableWrapper({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(styles.wrapper, className)} {...rest}>
      {children}
    </div>
  );
}

export function Table({ className, children, ...rest }: HTMLAttributes<HTMLTableElement>) {
  return (
    <table className={cn(styles.table, className)} {...rest}>
      {children}
    </table>
  );
}

export function THead({ children, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={styles.thead} {...rest}>
      {children}
    </thead>
  );
}

export function TBody({ children, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...rest}>{children}</tbody>;
}

export interface RowProps extends HTMLAttributes<HTMLTableRowElement> {
  interactive?: boolean;
}

export function Tr({ interactive = false, className, children, ...rest }: RowProps) {
  return (
    <tr className={cn(styles.row, interactive && styles.interactive, className)} {...rest}>
      {children}
    </tr>
  );
}

interface CellProps {
  numeric?: boolean;
}

export function Th({
  numeric = false,
  className,
  children,
  ...rest
}: ThHTMLAttributes<HTMLTableCellElement> & CellProps) {
  return (
    <th className={cn(styles.th, numeric && styles.numeric, className)} {...rest}>
      {children}
    </th>
  );
}

export function Td({
  numeric = false,
  className,
  children,
  ...rest
}: TdHTMLAttributes<HTMLTableCellElement> & CellProps) {
  return (
    <td className={cn(styles.td, numeric && styles.numeric, className)} {...rest}>
      {children}
    </td>
  );
}
