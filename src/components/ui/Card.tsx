import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';
import styles from './Card.module.css';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** `muted` para blocos secundarios, `bare` quando o proprio conteudo desenha a moldura. */
  tone?: 'default' | 'muted' | 'bare';
  padding?: 'none' | 'sm' | 'md';
}

export function Card({ tone = 'default', padding = 'md', className, children, ...rest }: CardProps) {
  return (
    <div className={cn(styles.card, styles[tone], styles[`padding-${padding}`], className)} {...rest}>
      {children}
    </div>
  );
}

export interface CardHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}

export function CardHeader({ title, description, action }: CardHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.headerText}>
        <h2 className={styles.title}>{title}</h2>
        {description ? <p className={styles.description}>{description}</p> : null}
      </div>
      {action ? <div className={styles.action}>{action}</div> : null}
    </header>
  );
}

export function CardBody({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(styles.body, className)} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(styles.footer, className)} {...rest}>
      {children}
    </div>
  );
}
