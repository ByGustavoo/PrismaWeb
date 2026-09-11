import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import { juntarClasses } from '@/utils/juntarClasses';
import styles from './Tabela.module.css';

export function ContainerTabela({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={juntarClasses(styles.wrapper, className)} {...rest}>
      {children}
    </div>
  );
}

export function Tabela({ className, children, ...rest }: HTMLAttributes<HTMLTableElement>) {
  return (
    <table className={juntarClasses(styles.table, className)} {...rest}>
      {children}
    </table>
  );
}

export function CabecaTabela({ children, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={styles.thead} {...rest}>
      {children}
    </thead>
  );
}

export function CorpoTabela({ children, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...rest}>{children}</tbody>;
}

export interface LinhaTabelaProps extends HTMLAttributes<HTMLTableRowElement> {
  interativo?: boolean;
}

export function LinhaTabela({ interativo = false, className, children, ...rest }: LinhaTabelaProps) {
  return (
    <tr className={juntarClasses(styles.row, interativo && styles.interactive, className)} {...rest}>
      {children}
    </tr>
  );
}

interface CelulaProps {
  numerico?: boolean;
}

export function CelulaCabecalho({
  numerico = false,
  className,
  children,
  ...rest
}: ThHTMLAttributes<HTMLTableCellElement> & CelulaProps) {
  return (
    <th className={juntarClasses(styles.th, numerico && styles.numeric, className)} {...rest}>
      {children}
    </th>
  );
}

export function Celula({
  numerico = false,
  className,
  children,
  ...rest
}: TdHTMLAttributes<HTMLTableCellElement> & CelulaProps) {
  return (
    <td className={juntarClasses(styles.td, numerico && styles.numeric, className)} {...rest}>
      {children}
    </td>
  );
}
